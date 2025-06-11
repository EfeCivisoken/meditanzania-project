from transformers import AutoTokenizer, AutoModelForSequenceClassification
from flask import Flask, jsonify, request
import json
import torch
import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest


app = Flask(__name__)

sa_tokenizer = AutoTokenizer.from_pretrained('./swahili-sentiment-model')
sa_model = AutoModelForSequenceClassification.from_pretrained('./swahili-sentiment-model')
sa_model.eval()


@app.route('/')
def home():
    return "Machine Learning Server!"


@app.route('/sentiment', methods=['POST'])
def sentiment_analysis():
    data = request.json  
    text = data.get('text', '')


    def predict(text):
        # Tokenize input
        inputs = sa_tokenizer(text, return_tensors="pt", truncation=True, padding=True)

        # Disable gradient computation
        with torch.no_grad():
            outputs = sa_model(**inputs)

        # Convert logits to probabilities
        probs = torch.softmax(outputs.logits, dim=-1)
        predicted_class = torch.argmax(probs, dim=-1).item()

        return {
            "class": 'negative' if predicted_class == 0 else 'positive',
            "confidence": probs[0][predicted_class].item()
        }
    
    return jsonify(predict(text))

@app.route('/anomaly', methods=['POST'])
def anomaly_detection():
    """
    Data Structure:
    {
        facility1.id: {
            surveyres1: { k: v }
            surveyres2: {}
        }
    }
    """

    try:
        facility_data = request.get_json()

        # Filter out empty survey lists
        filtered_data = {k: v for k, v in facility_data.items() if v}

        if not filtered_data:
            return jsonify({
                "error": "No valid survey data provided.",
                "anomalous_facilities": []
            }), 200

        print(filtered_data)
        if not isinstance(filtered_data, dict):
            return jsonify({"error": "Expected facility-level dictionary."}), 400

        all_fields = set()
        for reviews in filtered_data.values():
            for r in reviews:
                all_fields.update(k for k, v in r.items() if isinstance(v, (int, float)))

        def summarize_facility(reviews):
            stats = {}
            for field in all_fields:
                values = [r[field] for r in reviews if field in r and isinstance(r[field], (int, float))]
                stats[f'{field}_mean'] = np.mean(values) if values else np.nan
                stats[f'{field}_std'] = np.std(values) if values else np.nan
            return stats
        
        summary_rows = {
            facility: summarize_facility(reviews)
            for facility, reviews in filtered_data.items()
        }

        df = pd.DataFrame.from_dict(summary_rows, orient='index')

        imputer = SimpleImputer(strategy='mean')
        scaler = StandardScaler()
        X_imp = imputer.fit_transform(df)
        X = scaler.fit_transform(X_imp)

        model = IsolationForest(contamination=0.15, random_state=42)
        preds = model.fit_predict(X)
        df['anomalous'] = preds == -1

        anomalous_facilities = df[df['anomalous']].index.tolist()

        return jsonify({
            'anomalous_facilities': anomalous_facilities,
            'count': len(anomalous_facilities)
        })
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500



if __name__ == '__main__':
    app.run(port=5000, debug=True)  # Flask server runs on port 5000