from ollama import Client
from ollama._types import ResponseError
import requests


def load_system_prompt(filepath):
    """Load K.I.R.A's instructions from a text file"""
    try:
        with open("Kira.txt", 'r', encoding='utf-8') as file:
            return file.read().strip()
    except FileNotFoundError:
        print("⚠️ Instruction file not found. Using default personality.")
        return "You are K.I.R.A, Knowledge-based Intelligent Responsive Assistant."


def chat_with_KIRA():
    client = Client(host='http://localhost:11434')
    model = "K.I.R.A"

    system_prompt = load_system_prompt("Kira.txt")

    print("💬 Chat with K.I.R.A (type 'exit' to quit)\n")

    while True:
        user_input = input("You: ")
        if user_input.lower() in ["exit", "quit"]:
            print("👋 Goodbye from K.I.R.A!")
            break

        try:
            response = client.chat(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_input}
                ]
            )

            kiara_reply = response["message"]["content"]
            print(f"Kiara: {kiara_reply}\n")

        except requests.exceptions.ConnectionError:
            print(
                "❌ Ollama server is not running.\n"
                "👉 Start it using:  ollama serve\n"
            )

        except ResponseError as e:
            print(f"⚠️ Ollama error: {e}")

        except Exception as e:
            print(f"⚠️ Unexpected error: {e}")


if __name__ == "__main__":
    chat_with_kiara()
