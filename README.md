# K.I.R.A

A simple Python chatbot interface for interacting with a custom AI persona ("K.I.R.A") using the Ollama API and a local language model.

## Features

- Loads detailed system prompt/personality from `Kira.txt`
- Interactive chat loop in the terminal
- Connects to a local Ollama server (`http://localhost:11434`)
- Graceful fallback if prompt file is missing

## Requirements

- Python 3.8+
- [Ollama](https://ollama.com/) running locally with your desired model (e.g., `llama3:8b`)
- Python dependencies listed in `requirements.txt`

## Setup

1. Clone this repository.
2. Install dependencies:
   ```sh
   pip install -r requirements.txt