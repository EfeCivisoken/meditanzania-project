# MediTanzania

Improving healthcare through transparency.

## About

This project was completed as part of CS 205: Software Engineering. We were tasked with taking a large and nebulous problem presentation and drilling it down to a completed piece of software.

## Running

### Development

On your first run, you'll need to initialize the ML stuff and Python, along with NodeJS. To do this, run:

```zsh
./build_dev.sh
```

Keep in mind, this will build a ML model, so it may take a few minutes.

After this (and each subsequent time), simply start the Python server, then the node server:

```zsh
cd ml_api
source .venv/bin/activate
python3 app.py
```

```zsh
# (new session in the main directory)
node server
```

### Production

Build the production server like this (you only need to do this once):

```zsh
./build_prod.sh
```

To start it, simply run:

```zsh
./start_production.sh
```

To kill it, use:

```zsh
./kill_production.sh
```


## Testing

Unit tests expect the Python server to be running, so ensure you run `./build_dev.sh` and start the Flask server before running them, or they will run infinitely.
