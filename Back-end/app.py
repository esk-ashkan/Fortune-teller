import logging
import os
from google import genai
import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from google.genai import types
import requests

# --------------------------------------------------
# Environment
# --------------------------------------------------

load_dotenv()
gemini_client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

# --------------------------------------------------
# Flask
# --------------------------------------------------

app = Flask(__name__)
CORS(app)

# --------------------------------------------------
# Logging
# --------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)

logger = logging.getLogger(__name__)


# --------------------------------------------------
# Cloudinary
# --------------------------------------------------

cloudinary.config(
    cloud_name=os.getenv("CLOUDNARY_NAME"),
    api_key=os.getenv("CLOUDNARY_API_KEY"),
    api_secret=os.getenv("CLOUDNARY_SECRET_KEY"),
    secure=True,
)
# -----------------------------
# HOME
# -----------------------------
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

def gemini_api(prompt: str,
    model: str = "gemini-3.5-flash",
    temperature: float = 0.7,
    max_tokens: int = 200
) -> str:
    """
    Send a prompt to Gemini API with optional parameters.
    """
    grounding_tool = types.Tool(google_search=types.GoogleSearch())
    generation_config = types.GenerateContentConfig(
        temperature=temperature,
        max_output_tokens=max_tokens, 
        top_p=0.95,
        )
    
    response = gemini_client.models.generate_content(
        model=model,
        contents=prompt,
            onfig=generation_config,
        )
    return response.text
    

@app.route("/")
def home():
    return "Fortune Teller Backend is running!"

# -----------------------------
# TAROT
# -----------------------------
@app.route("/tarot", methods=["GET"])
@app.route("/tarot", methods=["GET"])
def tarot():
    logger.info("-----> Tarot endpoint called.")
    
    cards_list = request.args.getlist("cards_list[]")
    cards_list = [card.strip() for card in cards_list if card.strip()]
    
    if not cards_list:
        return jsonify({"error": "No cards provided"}), 400
    
    if len(cards_list) > 10:
        return jsonify({"error": "Maximum 10 cards allowed"}), 400
    
    cards_text = ", ".join(cards_list)
    base_prompt = f"""
    You are a traditional Tarot scholar.
    For every card:

    1. Traditional meaning
    2. Upright/Reversed meaning
    3. Symbolism
    4. Psychological message
    5. Advice

    Do NOT answer as a numbered list.

    Write naturally as an experienced Tarot reader.

    Your interpretations should be:

    - mystical
    - psychologically insightful
    - compassionate
    - encouraging
    - avoid deterministic predictions
    - explain both each card and the spread as a whole

    Maximum 220 words.

    IMPORTANT:
    Return the interpretation in Persian.

    Cards drawn:

    {cards_text}
    """
    
    try:
        response = mistral_api(prompt=base_prompt)
        
        if not response:
            logger.warning("!Warning!\n----->Mistral returned empty response, trying Gemini...")
            response = gemini_api(prompt=base_prompt)
        
        if not response:
            return jsonify({
                "interpretation": "The spirits are quiet right now.",
                "details": "Both models returned empty responses."
            }), 502
        
        return jsonify({
            "interpretation": response,
            "cards": cards_list
        })
        
    except Exception as e:
        logger.error(f"!ERROR!:----->\nTarot API Error: {str(e)}")
        return jsonify({
            "interpretation": "The spirits are quiet right now.",
            "details": str(e)
        }), 502
# -----------------------------
# COFFEE READING
# -----------------------------
@app.route("/coffee", methods=["POST"])
def coffee():

    files = request.files.getlist("images")
    names = request.form.getlist("images_name")

    if not files:
        return jsonify({"error": "No images uploaded"}), 400

    uploaded_urls = []

    for file, name in zip(files, names):

        cloudinary.uploader.upload(
            file,
            public_id=name,
            overwrite=True,
        )

        image_url, _ = cloudinary_url(
            name,
            secure=True,
            fetch_format="auto",
            quality="auto",
        )

        uploaded_urls.append(image_url)

    logger.info("Calling Vision model...")

    try:

        return jsonify(
            {
                "interpretation": "interpretation"
            }
        )

    except Exception as e:

        logger.exception("Coffee reading failed")

        return (
            jsonify(
                {
                    "error": str(e)
                }
            ),
            502,
        )
# -----------------------------
# STARS (HOROSCOPE)
# -----------------------------
@app.route('/stars')
def stars():
    lat = request.args.get('lat')
    long = request.args.get('long')

    API_KEY = os.environ["IPGL_API_KEY"]
    url = f"https://api.ipgeolocation.io/v3/astronomy?apiKey={API_KEY}&lat={lat}&long={long}&elevation=10"

    response = requests.get(url)
    data = response.json()

    prompt = f"""
        You are an expert astrologer.
        Based on the following astronomical data:
        {data}

        Generate a mystical horoscope in Farsi.
        Avoid deterministic predictions.
        Maximum 200 words.
        IMPORTANT: Return horoscope in Persian.
    """

    result = query(prompt, TEXT_MODELS[0])

    if "error" in result:
        return jsonify({
            "horoscope_data": "The spirits are quiet right now. Please try again in a moment.",
            "details": result["error"]
        }), 502

    return jsonify({"horoscope_data": result["generated_text"]})

# -----------------------------
# HEALTH CHECK
# -----------------------------
@app.route('/env-test')
def health():
    return {"status": "ok"}

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
