import os
from openai import OpenAI
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDNARY_NAME"),
    api_key=os.getenv("CLOUDNARY_API_KEY"),
    api_secret=os.getenv("CLOUDNARY_SECRET_KEY"),
    secure=True,
)

client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
)

# Upload local image
with open("../images.jpg", "rb") as f:
    upload_result = cloudinary.uploader.upload(
        f,
        public_id="coffee_cup_test",
        overwrite=True
    )["secure_url"]

# Correct OpenRouter request
response = client.chat.completions.create(
        model="google/gemma-4-31b-it:free",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """What coffee divination do you see from this cup? 
                        Analyze the patterns in the coffee grounds and provide a detailed interpretation.
                        Return your response in this JSON format:
                        {
                            "symbols": ["symbol1", "symbol2", "symbol3"],
                            "interpretation": "Your detailed interpretation here",
                            "predictions": ["prediction1", "prediction2"]
                        }"""
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": upload_result
                        }
                    }
                ]
            }
        ],
        max_tokens=1024,
        temperature=0.8,
    )

print(response.choices[0].message.content)
