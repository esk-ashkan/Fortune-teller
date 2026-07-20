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

# --------------------------------------------------
# Environment
# --------------------------------------------------

load_dotenv()

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
@app.route("/")
def home():
    return "Fortune Teller Backend is running!"

# -----------------------------
# TAROT
# -----------------------------
@app.route("/tarot", methods=["GET"])
def tarot():
    logger.info("-----> Tarot endpoint called.")

    cards_list = request.args.getlist("cards_list[]")

    if not cards_list:
        return jsonify({"error": "No cards provided"}), 400

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
        
        client = genai.Client()
        grounding_tool = types.Tool(google_search=types.GoogleSearch())
        generation_config = types.GenerateContentConfig(
            temperature=1.0,
            max_output_tokens=2000, 
            top_p=0.95,
            tools=[grounding_tool]
        )

        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=base_prompt,
            config=generation_config,
        )

        if not response.text:
            return jsonify({
                "interpretation": "The spirits are quiet right now.",
                "details": "Model returned an empty response."
            }), 502

        return jsonify({
            "interpretation": response.text
        })

    except Exception as e:
        logger.error(f"Gemini API Error: {str(e)}")
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
