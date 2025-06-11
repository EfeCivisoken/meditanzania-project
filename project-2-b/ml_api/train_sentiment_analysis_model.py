from datasets import load_dataset, DatasetDict
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer
)
import numpy as np
from sklearn.metrics import accuracy_score, f1_score
from torch.nn import CrossEntropyLoss
from torch import tensor
import torch
from collections import Counter
import pandas as pd
from sklearn.model_selection import train_test_split


dataset = load_dataset('csv', data_files='./swahili.csv')

# Remap labels: {-1, 0, 1} -> {0, 1, 2} = {negative, neutral, positive}
label_map = {'negative': 0, 'positive': 1}
def remap_labels(example):
    example["label"] = label_map[example["labels"]]
    return example

dataset = dataset.map(remap_labels)

split = dataset["train"].train_test_split(test_size=0.1, seed=42)
dataset = DatasetDict({
    "train": split["train"],
    "test": split["test"]
})


tokenizer = AutoTokenizer.from_pretrained("bert-base-multilingual-cased")

def tokenize(batch):
    return tokenizer(batch["text"], padding="max_length", truncation=True, max_length=128)

tokenized = dataset.map(tokenize, batched=True)
tokenized.set_format("torch", columns=["input_ids", "attention_mask", "label"])

labels = [int(label) for label in dataset['train']['label']]  # Convert tensors to ints
counts = Counter(labels)
total = sum(counts.values())
weights = [total / counts[i] for i in range(2)]
class_weights = tensor(weights)

model_name = "bert-base-multilingual-cased"

# Load model
model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=2)

device = torch.device("cpu")
model.to(device)

# Weighted loss function
loss_fn = CrossEntropyLoss(weight=class_weights.to(device))

def compute_loss(outputs, labels, **kwargs):
    logits = outputs.logits
    loss = loss_fn(logits, labels)
    return loss


def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    return {
        "accuracy": accuracy_score(labels, preds),
        "f1": f1_score(labels, preds, average="weighted")
    }


training_args = TrainingArguments(
    output_dir="./results",
    eval_strategy="epoch",
    save_strategy="epoch",
    learning_rate=2e-5,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=16,
    num_train_epochs=4,
    weight_decay=0.01,
    load_best_model_at_end=True,
    metric_for_best_model="f1",
    logging_dir="./logs",
    use_cpu=True
)


trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized["train"],
    eval_dataset=tokenized["test"],
    tokenizer=tokenizer,
    compute_metrics=compute_metrics,
    compute_loss_func=compute_loss,
)


trainer.train()
trainer.save_model("swahili-sentiment-model")
tokenizer.save_pretrained("swahili-sentiment-model")