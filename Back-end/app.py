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
    # Use the correct HuggingFace Inference API endpoint
    API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"
    token = os.environ.get("HF_TOKEN")

    if not token:
        logger.error("HF_TOKEN is not set")
        return {"error": "HF_TOKEN is not set"}

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    for attempt in range(retries):
        try:
            logger.info(f"Attempt {attempt + 1}/{retries} to HuggingFace API")
            response = requests.post(API_URL, headers=headers, json=payload, timeout=90)
            response.raise_for_status()
            result = response.json()
            logger.info("HuggingFace API call successful")
            return result
        except requests.exceptions.Timeout:
            logger.warning(f"Attempt {attempt + 1} timed out")
            if attempt < retries - 1:
                time.sleep(delay * (attempt + 1))
            else:
                return {"error": "API timeout after all retries"}
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error: {str(e)}")
            if response := getattr(e, 'response', None):
                logger.error(f"Response content: {response.text[:500]}")
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

    # Format cards as a clean string
    cards_text = ", ".join(cards_list)

    prompt =f"""You are an experienced Tarot reader.
                Your role is to interpret the meaning of Tarot cards according to traditional Tarot principles, symbolism, and archetypes.
                Always respect the established meanings of the Major Arcana and Minor Arcana, including upright and reversed positions.
                Provide interpretations that are mystical, symbolic, and psychologically insightful, but avoid generic fortune-telling clichés.
                When multiple cards are drawn, explain both the individual meanings and how they interact together in the spread.

                Tone guidelines:
                - Use gentle, compassionate language, even when the interpretation is challenging.
                - Frame difficulties as opportunities for growth, reflection, or transformation.
                - Avoid alarming or discouraging phrasing; instead, highlight resilience, hope, and constructive paths forward.
                - Keep the tone mystical yet reassuring, so the customer feels guided rather than judged.

                Cards drawn: {cards_text}"""

    
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 1024,
            "temperature": 0.7,
            "top_p": 0.95,
            "return_full_text": False
        }
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
        # HuggingFace text generation returns list of dicts with 'generated_text'
        if isinstance(result, list) and len(result) > 0:
            interpretation = result[0].get("generated_text", "")
        elif isinstance(result, dict):
            interpretation = result.get("generated_text", "") or result.get("text", "")
        else:
            interpretation = str(result)
            
        if not interpretation:
            raise ValueError("Empty response from API")
            
        logger.info(f'----->Interpretation received successfully')
    except (KeyError, TypeError, IndexError, ValueError) as e:
        logger.error(f"Failed to parse response: {e}, result: {result}")
        return jsonify({
            "interpretation": "The spirits are quiet right now. Please try again in a moment.",
            "details": "Invalid response format from Hugging Face"
        }), 502

    return jsonify({"interpretation": interpretation})

import socket

@app.route("/dns-test")
def dns_test():
    try:
        ip = socket.gethostbyname("api-inference.huggingface.co")
        return {"resolved_ip": ip}
    except Exception as e:
        return {"error": str(e)}, 500

import socket

@app.route("/dns-google")
def dns_google():
    try:
        return {
            "google": socket.gethostbyname("google.com"),
            "cloudflare": socket.gethostbyname("cloudflare.com"),
        }
    except Exception as e:
        return {"error": str(e)}, 500
    
@app.route('/health') 
def health(): 
    return {"status": "ok"} 

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)


    ############################