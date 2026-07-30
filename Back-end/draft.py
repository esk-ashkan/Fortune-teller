import os
from mistralai.client import Mistral
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ["MISTRAL_API_KEY"]
model = [
    "mistral-large-2411",
    "mistral-saba-2502",
    "mistral-small-latest",
    "mistral-medium-2508",
    "mistral-small-latest",
]

client = Mistral(api_key=api_key)

messages = [
    {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": "Hi!"
            },
        ]
    }
]

chat_response = client.chat.complete(
    model=model,
    messages=messages
)

print(chat_response.choices[0].message.content)