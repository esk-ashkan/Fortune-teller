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
from flask_sqlalchemy import SQLAlchemy
from groq import Groq

# --------------------------------------------------
# Environment
# --------------------------------------------------
load_dotenv()
gemini_client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

# --------------------------------------------------
# Variables
# --------------------------------------------------

groqModels = [
    "qwen/qwen3.6-27b",#VLM and LLM
    "groq/compound",#LLM
    "groq/compound-mini",#LLM
    "llama-3.1-8b-instant",#LLM
    "openai/gpt-oss-120b",#LLM
]

# --------------------------------------------------
# Flask And Database
# --------------------------------------------------
app = Flask(__name__)
CORS(app)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")

app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_pre_ping": True,
    "pool_recycle": 300,
    "pool_timeout": 30,
    "connect_args": {
        "connect_timeout": 10,
        "sslmode": "require",
    },
}

db = SQLAlchemy(app)
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
# Functions
# -----------------------------
def mistral_api(prompt: str, temprature:float=0.85):
    url = "https://api.mistral.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {os.environ['MISTRAL_API_KEY']}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "mistral-small-latest",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temprature,
    }


    r = requests.post(url, json=payload, headers=headers)
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]

def gemini_api(
    prompt: str,
    model: str = "gemini-3.5-flash",
    temperature: float = 0.7,
    max_tokens: int = 200,
    vision: bool = False,
    file: object | None = None
) -> str:

    if not vision:
        generation_config = types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
            top_p=0.95,
        )

        response = gemini_client.models.generate_content(
            model=model,
            contents=prompt,
            config=generation_config,
        )
        return response.text

    if file is None:
        raise ValueError("Vision mode requires a file")

    uploaded_file = gemini_client.files.upload(file=file)

    interaction = gemini_client.interactions.create(
        model="gemini-3.6-flash",
        input=[
            {"type": "text", "text": prompt},
            {
                "type": "image",
                "uri": uploaded_file.uri,
                "mime_type": uploaded_file.mime_type
            }
        ]
    )

    return interaction.output_text

def user_information(tgid, username, fname, lname):

    if tgid is None:
        raise ValueError("Telegram ID is required")

    profile = Profile.query.filter_by(tgid=tgid).first()

    if profile is None:
        profile = Profile(
            tgid=tgid,
            username=username,
            first_name=fname,
            last_name=lname,
            credit=15000
        )

        db.session.add(profile)
        db.session.commit()

    return {
        "username": profile.username,
        "credit": profile.credit,
        "first_name": profile.first_name,
        "last_name": profile.last_name
    }

def fetchingGroq(
    model: str,
    prompt: str,
    url: str,
    vision: bool = True
) -> str:

    client = Groq(api_key=os.environ["GROQ_API_KEY"])

    logging.info("-----> Groq Requesting")

    system_message = {
        "role": "system",
        "content": (
            "You are a Persian coffee horoscoper."
            if vision
            else "You are a Persian Tarot horoscoper."
        )
    }

    if vision:
        user_message = {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": prompt
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": url
                    }
                }
            ]
        }
    else:
        user_message = {
            "role": "user",
            "content": prompt
        }

    completion = client.chat.completions.create(
        model=model,
        messages=[
            system_message,
            user_message
        ],
        temperature=1,
        max_completion_tokens=6144,
        top_p=1,
        stream=False,
    )

    logging.info("-----> Groq response received")

    logging.info(
        "Finish reason: %s",
        completion.choices[0].finish_reason
    )

    content = completion.choices[0].message.content

    logging.info(
        "Content length: %s",
        len(content) if content else 0
    )

    logging.info(
        "----->\n%s\n<-----",
        content
    )

    return content or ""

# -----------------------------
# Models
# -----------------------------
class Profile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tgid = db.Column(db.BigInteger, unique=True, nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=True)
    first_name = db.Column(db.String(50), nullable=True)
    last_name = db.Column(db.String(50), nullable=True)
    credit = db.Column(db.Integer, default=15000, nullable=False)


    def __repr__(self):
        return f"Profile(username={self.username}, credit={self.credit})"

    def increase_credit(self, amount):
        self.credit += amount

    def decrease_credit(self, amount):
        self.credit -= amount

with app.app_context():
    db.create_all()
# -----------------------------
# Views
# -----------------------------
# HOME
# -----------------------------
@app.route("/", methods=["GET", "POST"])
def home():
    tgid = request.args.get("tgid", type=int)
    username = request.args.get("username")
    fname = request.args.get("fname")
    lname = request.args.get("lname")

    if tgid is None:
        return jsonify({
            "error": "tgid is required"
        }), 400

    info = user_information(
        tgid,
        username,
        fname,
        lname
    )

    return jsonify(info)

# -----------------------------
# TAROT
# -----------------------------
@app.route("/tarot", methods=["GET"])
def tarot():
    logger.info("-----> Tarot endpoint called.")
    
    cards_list = request.args.getlist("cards_list[]")
    cards_list = [card.strip() for card in cards_list if card.strip()]
    kindOfHoroscopy = request.args.get("kindOfHoroscopy")
    if not cards_list:
        return jsonify({"error": "No cards provided"}), 400
    
    if len(cards_list) > 10:
        return jsonify({"error": "Maximum 10 cards allowed"}), 400
    
    cards_text = ", ".join(cards_list)
    extra_context = (
        f"Main goal of horoscopy is: {kindOfHoroscopy}."
        if kindOfHoroscopy and kindOfHoroscopy != "سایر"
        else ""
    )

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

    {extra_context}

    Maximum 220 words, and dedicate most of words to the final interpretation.
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

    file = files[0]
    name = names[0]

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

    logger.info("----->Calling Vision model...")

    prompt = "این تصاویر قهوه را تحلیل کن و یک فال دقیق ارائه بده."

    try:
        response = fetchingGroq(
            model=groqModels[0],
            prompt=prompt,
            url=image_url,
        )
        if not response:
            response = gemini_api(
                prompt=prompt,
                vision=True,
                file=file
            )

        return jsonify({"interpretation": response})

    except Exception as e:
        logger.exception("----->Coffee reading failed")
        return jsonify({"error": str(e)}), 502


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
