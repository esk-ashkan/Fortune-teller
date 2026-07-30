import requests
import os
from dotenv import load_dotenv

load_dotenv()

def mistral_api(prompt: str, temprature:float=0.85):
    url = "https://api.mistral.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {os.environ['MISTRAL_API_KEY']}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "mistral-small-latest",
        "messages": [{"role": "user", "content": "hi"}],
        "temprature":temprature
    }

    r = requests.post(url, json=payload, headers=headers)
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]


print(mistral_api("hi"))
