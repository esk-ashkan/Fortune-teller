import logging
import os
from datetime import datetime, timezone
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
from openai import OpenAI

# --------------------------------------------------
# Environment
# --------------------------------------------------
load_dotenv()

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

HAFEZ_PRICE = 799999
TAROT_PRICE = 899999
COFFEE_PRICE = 999999
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
    
    gemini_client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

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

def fetchingGroq(

    model: str,
    prompt: str,
    url: str="",
    vision: bool = True,
    tarot: bool = True
) -> str:

    client = Groq(api_key=os.environ["GROQ_API_KEY"])

    logging.info("-----> Groq Requesting")

    system_message = {
        "role": "system",
        "content": (
            "You are a Persian coffee horoscoper."
            if vision
            else
                "You are a Persian Tarot horoscoper." if tarot
            else 
                "You are a Persian Darvish."
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

def huggingFaceAPI(prompt:str, imageUrl:str):
    HF_client = OpenAI(
        base_url="https://router.huggingface.co/v1",
        api_key=os.environ["HFT"],
    )
    completion = HF_client.chat.completions.create(
        model="google/gemma-3-4b-it:featherless-ai",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": imageUrl
                        }
                    }
                ]
            }
        ],
    )
    return completion.choices[0].message

def user_information(tgid, username=None, first_name=None, last_name=None, full_name=None):
    if tgid is None:
        raise ValueError("Telegram ID is required")

    profile = Profile.query.filter_by(tgid=tgid).first()

    if profile is None:
        profile = Profile(
            tgid=tgid,
            username=username,
            first_name=first_name,
            last_name=last_name,
            full_name=full_name or f"{first_name or ''} {last_name or ''}".strip() or None,
            credit=15000
        )
        db.session.add(profile)
        db.session.commit()
    else:
        updated = False

        if username and profile.username != username:
            profile.username = username
            updated = True
        if first_name and profile.first_name != first_name:
            profile.first_name = first_name
            updated = True
        if last_name and profile.last_name != last_name:
            profile.last_name = last_name
            updated = True
        if full_name and profile.full_name != full_name:
            profile.full_name = full_name
            updated = True

        profile.update_last_visit()
        updated = True

        if updated:
            db.session.commit()

    return {
        "tgid": profile.tgid,
        "username": profile.username,
        "full_name": profile.full_name,
        "first_name": profile.first_name,
        "last_name": profile.last_name,
        "credit": profile.credit,
        "hafez_count": profile.hafez_count,
        "coffee_count": profile.coffee_count,
        "tarot_count": profile.tarot_count,
        "remained_hafez": profile.remained_hafez,
        "remained_coffee": profile.remained_coffee,
        "remained_tarot": profile.remained_tarot,
        "is_premium": profile.is_premium,
        "registered_at": profile.registered_at.isoformat() if profile.registered_at else None,
        "last_visit": profile.last_visit.isoformat() if profile.last_visit else None,
    }
# -----------------------------
# Models
# -----------------------------
class Profile(db.Model):
    __tablename__ = "profile"

    id = db.Column(db.Integer, primary_key=True)
    tgid = db.Column(db.BigInteger, unique=True, nullable=False)
    username = db.Column(db.String(64), unique=True, nullable=True)
    full_name = db.Column(db.String(100), nullable=True)
    first_name = db.Column(db.String(64), nullable=True)
    last_name = db.Column(db.String(64), nullable=True)
    birthday = db.Column(db.Date, nullable=True)

    credit = db.Column(db.Integer, nullable=False, default=15000)

    hafez_count = db.Column(db.Integer, nullable=False, default=0)
    coffee_count = db.Column(db.Integer, nullable=False, default=0)
    tarot_count = db.Column(db.Integer, nullable=False, default=0)

    remained_hafez = db.Column(db.Integer, nullable=False, default=0)
    remained_coffee = db.Column(db.Integer, nullable=False, default=0)
    remained_tarot = db.Column(db.Integer, nullable=False, default=0)

    registered_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    last_visit = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    is_premium = db.Column(db.Boolean, nullable=False, default=False)
    language = db.Column(db.String(10), default="fa")
    total_spent = db.Column(db.Integer, nullable=False, default=0)
    referral_code = db.Column(db.String(20), unique=True, nullable=True)
    referred_by = db.Column(db.BigInteger, nullable=True)

    def __repr__(self):
        return f"<Profile tgid={self.tgid} username={self.username} credit={self.credit}>"

    def increase_credit(self, amount: int):
        if amount > 0:
            self.credit += amount

    def decrease_credit(self, amount: int) -> bool:
        if amount <= 0 or self.credit < amount:
            return False
        self.credit -= amount
        return True

    def use_hafez(self) -> bool:
        if self.remained_hafez > 0:
            self.remained_hafez -= 1
            self.hafez_count += 1
            return True
        if self.credit > HAFEZ_PRICE:
            self.credit -= HAFEZ_PRICE
            self.hafez_count += 1
            return True
        return False

    def use_coffee(self) -> bool:
        if self.remained_coffee > 0:
            self.remained_coffee -= 1
            self.coffee_count += 1
            return True
        if self.credit > COFFEE_PRICE:
            self.credit -= COFFEE_PRICE
            self.coffee_count += 1
            return True
        return False

    def use_tarot(self) -> bool:
        if self.remained_tarot > 0:
            self.remained_tarot -= 1
            self.tarot_count += 1
            return True
        if self.credit > TAROT_PRICE:
            self.credit -= TAROT_PRICE
            self.tarot_count += 1
            return True
        return False

    def update_last_visit(self):
        self.last_visit = datetime.now(timezone.utc)

with app.app_context():
    db.create_all()
# -----------------------------
# Views
# -----------------------------
# HOME
# -----------------------------
@app.route("/", methods=["GET", "POST"])
def home():
    data = request.get_json(silent=True) or {}

    tgid = request.args.get("tgid", type=int) or data.get("tgid")
    username = request.args.get("username") or data.get("username")
    first_name = (
        request.args.get("fname")
        or request.args.get("first_name")
        or data.get("first_name")
        or data.get("fname")
    )
    last_name = (
        request.args.get("lname")
        or request.args.get("last_name")
        or data.get("last_name")
        or data.get("lname")
    )
    full_name = request.args.get("full_name") or data.get("full_name")

    if tgid is None:
        return jsonify({"error": "tgid is required"}), 400

    try:
        info = user_information(
            tgid=tgid,
            username=username,
            first_name=first_name,
            last_name=last_name,
            full_name=full_name
        )
        return jsonify(info)
    except Exception as e:
        logger.error(f"Error in home: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
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
        return jsonify({
            "error": "No images uploaded"
        }), 400

    file = files[0]
    name = names[0] if names else f"coffee_{int(time.time())}"
    prompt = """
    این تصویر قهوه را با دقت تحلیل کن و یک فال قهوه دقیق، روان با لحنی امیدبخش
    به زبان فارسی ارائه بده.
    نشانه‌ها، شکل‌ها، خطوط و الگوهای قابل مشاهده در فنجان را بررسی کن.
    تفسیر را بر اساس سنت فال قهوه انجام بده و از ادعاهای قطعی درباره
    آینده خودداری کن.
    """
    errors = []
    image_url = None

    try:

        logger.info("-----> Uploading coffee image to Cloudinary...")
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
        logger.info("-----> Cloudinary upload successful")

    except Exception as e:
        logger.exception(
            "-----> Cloudinary upload failed"
        )
        errors.append({
            "provider": "Cloudinary",
            "error": str(e)
        })

    if image_url:
        try:
            logger.info(
                "-----> Requesting Groq Vision..."
            )
            response = fetchingGroq(
                model=groqModels[0],
                prompt=prompt,
                url=image_url,
            )
            if response:
                logger.info(
                    "-----> Groq Vision succeeded"
                )
                return jsonify({
                    "interpretation": response,
                    "provider": "groq"
                }), 200
            errors.append({
                "provider": "Groq",
                "error": "Empty response"
            })

        except Exception as e:
            logger.exception(
                "-----> Groq Vision failed"
            )
            errors.append({
                "provider": "Groq",
                "error": str(e)
            })

    try:
        logger.info(
            "-----> Requesting Gemini Vision..."
        )
        file.stream.seek(0)
        response = gemini_api(
            prompt=prompt,
            vision=True,
            file=file
        )
        if response:
            logger.info(
                "-----> Gemini Vision succeeded"
            )
            return jsonify({
                "interpretation": response,
                "provider": "gemini"
            }), 200
        errors.append({
            "provider": "Gemini",
            "error": "Empty response"
        })

    except Exception as e:
        logger.exception(
            "-----> Gemini Vision failed"
        )
        errors.append({
            "provider": "Gemini",
            "error": str(e)
        })

    if image_url:
        try:
            logger.info(
                "-----> Requesting Hugging Face Vision..."
            )
            response = huggingFaceAPI(
                prompt=prompt,
                imageUrl=image_url
            )
            if response:

                logger.info(
                    "-----> Hugging Face Vision succeeded"
                )

                return jsonify({
                    "interpretation": response,
                    "provider": "huggingface"
                }), 200
            errors.append({
                "provider": "Hugging Face",
                "error": "Empty response"
            })

        except Exception as e:
            logger.exception(
                "-----> Hugging Face Vision failed"
            )
            errors.append({
                "provider": "Hugging Face",
                "error": str(e)
            })

    logger.error(
        "-----> All coffee-reading providers failed"
    )

    return jsonify({
        "error": "All vision providers failed.",
        "details": errors
    }), 502

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
# HAFEZ
# -----------------------------
@app.route('/hafez')
def hafez():
    goal = request.args.get("goal")
    r = requests.get('https://ganjgah.ir/api/ganjoor/hafez/faal')

    if r.status_code != 200:
        return jsonify({"error": "Failed to fetch poem"}), 502

    data = r.json()

    poem = {
        "poem": data.get("plainText"),
        "summary": data.get("poemSummary"),
        "interpretations": [
            verse["text"]
            for verse in data.get("verses", [])
            if verse.get("text") is not None
        ]
    }
    prompt = f"""
                با توجه به فضای معنایی این شعر و پیام‌های پنهان در ابیات، یک فال حافظ برایم بگیر.
                {f'هدف از گرفتن فال {goal} است'  if goal else ''}
                دستورالعمل‌ها:
                - شعر را نقل نکن.
                - ابیات را جداگانه تحلیل نکن.
                - فقط نتیجهٔ فال را بده.
                - فال باید لحن عرفانی، امیدوارکننده و کمی رمزآلود داشته باشد.
                - فال باید دربارهٔ مسیر، نیت، گره‌ها، گشایش‌ها و حالِ درونی صحبت کند.
                - فال نباید شامل پیش‌گویی قطعی یا جملات منفی باشد.
                - فال باید کوتاه، روان و قابل فهم باشد.
                - حداکثر 120 کلمه.

                شعر:
                {poem}
            """


    ai_faal = fetchingGroq(
        model=groqModels[4],
        prompt=prompt,
        vision=False
    )

    logging.info(f"----->{ai_faal}<-----")

    return jsonify({
        "poem": poem,
        "ai_faal": ai_faal
    })
# -----------------------------
# Credential Check
# -----------------------------
@app.route('/check')
def check():
    horoscopy_model = request.args.get("horoscopy_model")
    tgid = request.args.get("tgid", type=int)

    if not tgid:
        return jsonify({"error": "tgid is required"}), 400

    if horoscopy_model not in ["hafez", "coffee", "tarot"]:
        return jsonify({"error": "Invalid horoscopy_model"}), 400

    user = Profile.query.filter_by(tgid=tgid).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    try:
        if horoscopy_model == 'hafez':
            can_use = user.use_hafez()
            return can_use
        elif horoscopy_model == 'coffee':
            can_use = user.use_coffee()
            return can_use
        elif horoscopy_model == 'tarot':
            can_use = user.use_tarot()
            return can_use
    except Exception as e:
        logger.error(f"Error in checking permission: {str(e)}")
        return jsonify({"error": "Error in checking permission"}), 500 
    
# -----------------------------
# KEEP PROJECT AWAKE
# -----------------------------
@app.route("/keepitawake")
def keep_alive():
    logging.info("=====> I'm awake!")
    return "Success"

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
