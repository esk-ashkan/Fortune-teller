from flask_cors import CORS 
import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from openai import OpenAI
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv() 

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/') 
def home(): 
    return "Fortune Teller Backend is running!" 


client = OpenAI(
    api_key=os.environ["OPENROUTER_API_KEY"],
    base_url="https://openrouter.ai/api/v1",
)


def query(prompt: str):
    try:
        logger.info("Calling OpenRouter...")

        completion = client.chat.completions.create(
            model="openai/gpt-oss-120b:free",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an experienced Tarot reader. "
                        "Provide mystical, compassionate, psychologically insightful interpretations."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=1000,
        )

        interpretation = completion.choices[0].message.content

        logger.info("OpenRouter request successful.")

        return {
            "generated_text": interpretation
        }

    except Exception as e:
        logger.exception("OpenRouter error")
        return {
            "error": str(e)
        }
    
@app.route('/tarot', methods=['GET'])
def tarot():
    logger.info('----->Back-End is Called.')
    
    cards_list = request.args.getlist("cards_list[]")
    if not cards_list:
        return jsonify({"error": "No cards provided"}), 400

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
    
    logger.info('----->AI API is ready.')
    result = query(prompt)
    logger.info(f'----->AI API response: {result}')

    if "error" in result:
        logger.error(f"AI API error: {result['error']}")
        return jsonify({
            "interpretation": "The spirits are quiet right now. Please try again in a moment.",
            "details": result.get("error", "Unknown error")
        }), 502

    try:
        interpretation = result.get("generated_text", "")
            
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

@app.route('/health') 
def health(): 
    return {"status": "ok"} 

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
