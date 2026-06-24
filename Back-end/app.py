from flask_cors import CORS 
import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
import requests
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv() 

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/') 
def home(): 
    return "Fortune Teller Backend is running!" 

def query(payload, retries=3, delay=2):
    API_URL = "https://router.huggingface.co/v1/chat/completions"
    token = os.environ.get("HF_TOKEN")

    if not token:
        logger.error("HF_TOKEN is not set")
        return {"error": "HF_TOKEN is not set"}

    headers = {"Authorization": f"Bearer {token}"}

    for attempt in range(retries):
        try:
            logger.info(f"Attempt {attempt + 1}/{retries} to HuggingFace API")
            response = requests.post(API_URL, headers=headers, json=payload, timeout=60)  # Increased timeout
            response.raise_for_status()
            result = response.json()
            logger.info("HuggingFace API call successful")
            return result
        except requests.exceptions.Timeout:
            logger.warning(f"Attempt {attempt + 1} timed out")
            if attempt < retries - 1:
                time.sleep(delay * (attempt + 1))  # Exponential backoff
            else:
                return {"error": "API timeout after all retries"}
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error: {str(e)}")
            if attempt < retries - 1:
                time.sleep(delay)
            else:
                return {"error": f"Request failed: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return {"error": str(e)}

@app.route('/tarot', methods=['GET'])
def tarot():
    logger.info('----->Back-End is Called.')
    
    cards_list = request.args.getlist("cards_list[]")
    if not cards_list:
        return jsonify({"error": "No cards provided"}), 400

    prompt = f"""
    You are an experienced Tarot reader.
    Your role is to interpret the meaning of Tarot cards according to traditional Tarot principles, symbolism, and archetypes.
    Always respect the established meanings of the Major Arcana and Minor Arcana, including upright and reversed positions.
    Provide interpretations that are mystical, symbolic, and psychologically insightful, but avoid generic fortune-telling clichés.
    When multiple cards are drawn, explain both the individual meanings and how they interact together in the spread.

    Tone guidelines:
    - Use gentle, compassionate language, even when the interpretation is challenging.
    - Frame difficulties as opportunities for growth, reflection, or transformation.
    - Avoid alarming or discouraging phrasing; instead, highlight resilience, hope, and constructive paths forward.
    - Keep the tone mystical yet reassuring, so the customer feels guided rather than judged.

    Cards drawn: {cards_list}
    """

    payload = {
        "model": "meta-llama/Llama-3.2-3B-Instruct",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 1024 
    }
    
    logger.info('----->AI API is ready.')
    result = query(payload)
    logger.info(f'----->AI API response: {result}')

    if "error" in result:
        logger.error(f"AI API error: {result['error']}")
        return jsonify({
            "interpretation": "The spirits are quiet right now. Please try again in a moment.",
            "details": result.get("error", "Unknown error")
        }), 502

    try:
        interpretation = result["choices"][0]["message"]["content"]
        logger.info(f'----->Interpretation received successfully')
    except (KeyError, TypeError, IndexError) as e:
        logger.error(f"Failed to parse response: {e}")
        return jsonify({
            "interpretation": "The spirits are quiet right now. Please try again in a moment.",
            "details": "Invalid response format from Hugging Face"
        }), 502

    return jsonify({"interpretation": interpretation})

@app.route('/health') 
def health(): 
    return {"status": "ok"} 

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)