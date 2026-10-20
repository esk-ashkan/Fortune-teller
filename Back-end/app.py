import logging
import os
from datetime import datetime, timezone
from google import genai
import cloudinary
import cloudinary.uploader
import traceback
import sys
from cloudinary.utils import cloudinary_url
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from google.genai import types
import requests
from flask_sqlalchemy import SQLAlchemy
from groq import Groq
from openai import OpenAI
import time
from datetime import date

# --------------------------------------------------
# Environment
# --------------------------------------------------
load_dotenv()

# --------------------------------------------------
# Variables
# --------------------------------------------------

groqModels = [
    "qwen/qwen3.6-27b",#VLM and LLM
    "openai/gpt-oss-20b",#LLM
    "openai/gpt-oss-120b",#LLM
]

SUN_SIGN_FA = {
    "Aries": "حمل (فروردین)",
    "Taurus": "ثور (اردیبهشت)",
    "Gemini": "جوزا (خرداد)",
    "Cancer": "سرطان (تیر)",
    "Leo": "اسد (مرداد)",
    "Virgo": "سنبله (شهریور)",
    "Libra": "میزان (مهر)",
    "Scorpio": "عقرب (آبان)",
    "Sagittarius": "قوس (آذر)",
    "Capricorn": "جدی (دی)",
    "Aquarius": "دلو (بهمن)",
    "Pisces": "حوت (اسفند)",
}

HAFEZ_PRICE = 490000
TAROT_PRICE = 990000
COFFEE_PRICE = 1200000
STARS_PRICE = 790000
# --------------------------------------------------
# Flask And Database
# --------------------------------------------------
app = Flask(__name__)
CORS(app)
DATABASE_URL = os.getenv("DATABASE_URL")

logging.basicConfig(
    level=logging.DEBUG,  # more detail than INFO
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)

@app.before_request
def log_request():
    logger.info(
        "REQUEST %s %s args=%s",
        request.method,
        request.path,
        dict(request.args),
    )

@app.after_request
def log_response(response):
    logger.info(
        "RESPONSE %s %s status=%s",
        request.method,
        request.path,
        response.status_code,
    )
    return response

@app.errorhandler(Exception)
def handle_exception(e):
    logger.error("UNHANDLED ERROR: %s", str(e))
    logger.error(traceback.format_exc())
    return jsonify({"error": "Internal server error", "details": str(e)}), 500

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")

app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_pre_ping": True,
    "pool_recycle": 280,
    "pool_size": 3,
    "max_overflow": 0,
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
    r = requests.post(url, json=payload, headers=headers)
    if r.status_code != 200:
        print(r.status_code, r.text)
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
        "birth_date": profile.birth_date.isoformat() if profile.birth_date else None,
        "sun_sign": profile.sun_sign,
        "sun_sign_fa": SUN_SIGN_FA.get(profile.sun_sign, profile.sun_sign) if profile.sun_sign else None,
    }

def is_coffee_cup_image(file_storage) -> tuple[bool, str]:
    """
    Cheap gate: ask Gemini if image is coffee grounds in a cup.
    Returns (is_valid, raw_answer)
    """
    file_storage.stream.seek(0)
    prompt = (
        "Look at this image. "
        "Is it a photo of coffee grounds / coffee sediment inside a cup (fal gahve / coffee cup reading)? "
        "Answer with ONLY one word: YES or NO."
    )
    try:
        answer = gemini_api(
            prompt=prompt,
            vision=True,
            file=file_storage,
            max_tokens=10,
            temperature=0.0,
        )
        text = (answer or "").strip().upper()
        ok = text.startswith("YES")
        return ok, text
    except Exception as e:
        logger.warning("Coffee cup validation failed: %s", str(e))
        # Fail closed to save tokens if validator errors? 
        # Better: fail open only when unsure is risky; fail closed is safer for cost.
        return False, f"VALIDATOR_ERROR: {e}"

def get_sun_sign(d: date) -> str:
    m, day = d.month, d.day
    if (m == 3 and day >= 21) or (m == 4 and day <= 19):
        return "Aries"
    if (m == 4 and day >= 20) or (m == 5 and day <= 20):
        return "Taurus"
    if (m == 5 and day >= 21) or (m == 6 and day <= 20):
        return "Gemini"
    if (m == 6 and day >= 21) or (m == 7 and day <= 22):
        return "Cancer"
    if (m == 7 and day >= 23) or (m == 8 and day <= 22):
        return "Leo"
    if (m == 8 and day >= 23) or (m == 9 and day <= 22):
        return "Virgo"
    if (m == 9 and day >= 23) or (m == 10 and day <= 22):
        return "Libra"
    if (m == 10 and day >= 23) or (m == 11 and day <= 21):
        return "Scorpio"
    if (m == 11 and day >= 22) or (m == 12 and day <= 21):
        return "Sagittarius"
    if (m == 12 and day >= 22) or (m == 1 and day <= 19):
        return "Capricorn"
    if (m == 1 and day >= 20) or (m == 2 and day <= 18):
        return "Aquarius"
    return "Pisces"  # Feb 19 – Mar 20


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
    birth_date = db.Column(db.Date, nullable=True)
    sun_sign = db.Column(db.String(20), nullable=True)
    credit = db.Column(db.Integer, nullable=False, default=150000)

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

    def can_use_hafez(self) -> bool:
        return self.remained_hafez > 0

    def can_use_coffee(self) -> bool:
        return self.remained_coffee > 0

    def can_use_tarot(self) -> bool:
        return self.remained_tarot > 0
    
    def use_hafez(self) -> bool:
        if self.remained_hafez > 0:
            self.remained_hafez -= 1
            self.hafez_count += 1
            return True
        if self.credit >= HAFEZ_PRICE:
            self.credit -= HAFEZ_PRICE
            self.hafez_count += 1
            return True
        return False

    def use_coffee(self) -> bool:
        if self.remained_coffee > 0:
            self.remained_coffee -= 1
            self.coffee_count += 1
            return True
        if self.credit >= COFFEE_PRICE:
            self.credit -= COFFEE_PRICE
            self.coffee_count += 1
            return True
        return False

    def use_tarot(self) -> bool:
        if self.remained_tarot > 0:
            self.remained_tarot -= 1
            self.tarot_count += 1
            return True
        if self.credit >= TAROT_PRICE:
            self.credit -= TAROT_PRICE
            self.tarot_count += 1
            return True
        return False

    def update_last_visit(self):
        self.last_visit = datetime.now(timezone.utc)

with app.app_context():
    db.create_all()

# -----------------------------
# PAYMENTS (Blupal)
# -----------------------------
BLUPAL_API_KEY = os.environ.get("BLUPAL_API_KEY", "")
BLUPAL_BASE_URL = os.environ.get("BLUPAL_BASE_URL", "https://blupal.top/api")

PACKAGES = {
    # --- تکی ---
    "hafez_1": {
        "id": "hafez_1",
        "title": "۱ فال حافظ",
        "description": "یک نوبت فال حافظ",
        "tab": "single",
        "amount_rial": 490_000,
        "grant": {"remained_hafez": 1},
        "tab": "single",
    },
    "tarot_1": {
        "id": "tarot_1",
        "title": "۱ فال تاروت",
        "description": "یک نوبت فال تاروت",
        "tab": "single",
        "amount_rial": 990_000,
        "grant": {"remained_tarot": 1},
        "tab": "single",
    },
    "coffee_1": {
        "id": "coffee_1",
        "title": "۱ فال قهوه",
        "description": "یک نوبت فال قهوه",
        "tab": "single",
        "amount_rial": 1_200_000,
        "grant": {"remained_coffee": 1},
        "tab": "single",
    },
    "stars_1": {
        "id": "stars_1",
        "title": "۱ فال نجوم",
        "description": "یک نوبت خواندن آسمان",
        "tab": "single",
        "amount_rial": 790_000,
        "grant": {"credit": 1},  
        "tab": "single",
    },

    # --- بسته ---
    "hafez_5": {
        "id": "hafez_5",
        "title": "۵ فال حافظ",
        "description": "بسته کوچک حافظ",
        "tab": "pack",
        "amount_rial": 2_250_000,
        "grant": {"remained_hafez": 5},
        "tab": "pack",
    },
    "hafez_10": {
        "id": "hafez_10",
        "title": "۱۰ فال حافظ",
        "description": "به‌صرفه‌تر از تکی",
        "tab": "pack",
        "amount_rial": 4_200_000,
        "grant": {"remained_hafez": 10},
        "tab": "pack",
    },
    "tarot_5": {
        "id": "tarot_5",
        "title": "۵ فال تاروت",
        "description": "بسته کوچک تاروت",
        "tab": "pack",
        "amount_rial": 4_750_000,
        "grant": {"remained_tarot": 5},
        "tab": "pack",
    },
    "tarot_10": {
        "id": "tarot_10",
        "title": "۱۰ فال تاروت",
        "description": "بسته متوسط تاروت",
        "tab": "pack",
        "amount_rial": 9_500_000,
        "grant": {"remained_tarot": 10},
        "tab": "pack",
    },
    "coffee_5": {
        "id": "coffee_5",
        "title": "۵ فال قهوه",
        "description": "بسته کوچک قهوه",
        "tab": "pack",
        "amount_rial": 6_000_000,
        "grant": {"remained_coffee": 5},
        "tab": "pack",
    },
    "mix_3": {
        "id": "mix_3",
        "title": "میکس ۳تایی",
        "description": "۱ حافظ + ۱ تاروت + ۱ قهوه",
        "tab": "pack",
        "amount_rial": 2_490_000,
        "grant": {
            "remained_hafez": 1,
            "remained_tarot": 1,
            "remained_coffee": 1,
        },
        "tab": "pack",
    },

    # --- دوره‌ای ---
    "week_1": {
        "id": "week_1",
        "title": "پکیج ۱ هفته",
        "description": "۷ حافظ + ۷ تاروت",
        "tab": "period",
        "amount_rial": 9_000_000,
        "grant": {"remained_hafez": 7, "remained_tarot": 7},
        "tab": "period",
    },
    "month_1": {
        "id": "month_1",
        "title": "پکیج ۱ ماهه",
        "description": "۳۰ حافظ + ۳۰ تاروت",
        "tab": "period",
        "amount_rial": 2_900_000,
        "grant": {"remained_hafez": 30, "remained_tarot": 30},
        "tab": "period",
    },
    # "month_3": {
    #     "id": "month_3",
    #     "title": "پکیج ۳ ماهه",
    #     "description": "۹۰ حافظ + ۹۰ تاروت + ۱۲ قهوه",
    #     "tab": "period",
    #     "amount_rial": 6_500_000,
    #     "grant": {
    #         "remained_hafez": 90,
    #         "remained_tarot": 90,
    #         "remained_coffee": 12,
    #     },
    # },

    # --- اعتبار ---
    "credit_300k": {
        "id": "credit_300k",
        "title": "شارژ اعتبار ۱۰۰٬۰۰۰",
        "description": "افزایش credit داخلی",
        "tab": "credit",
        "amount_rial": 3_000_000,
        "grant": {"credit": 3_000_000},
        "tab": "credit",
    },
    "credit_500k": {
        "id": "credit_500k",
        "title": "5شارژ اعتبار:۰۰٬۰۰۰",
        "description": "شارژ بیشتر با تخفیف جزئی",
        "tab": "credit",
        "amount_rial": 5_000_000,
        "grant": {"credit": 5_000_000},
        "tab": "credit",
    },
}

class PaymentInvoice(db.Model):
    __tablename__ = "payment_invoice"

    id = db.Column(db.Integer, primary_key=True)
    tgid = db.Column(db.BigInteger, nullable=False, index=True)
    package_id = db.Column(db.String(50), nullable=False)
    blupal_invoice_id = db.Column(db.Integer, unique=True)
    amount_rial = db.Column(db.Integer, nullable=False)
    final_amount = db.Column(db.Integer)
    status = db.Column(db.String(20), nullable=False, default="PENDING")
    payment_link = db.Column(db.Text)
    mode = db.Column(db.String(20))
    transaction_id = db.Column(db.Integer)
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    paid_at = db.Column(db.DateTime(timezone=True))

def blupal_headers():
    return {
        "Content-Type": "application/json",
        "X-API-Key": BLUPAL_API_KEY,
    }

def grant_package(user: Profile, package_id: str) -> None:
    pkg = PACKAGES.get(package_id)
    if not pkg:
        raise ValueError(f"Unknown package: {package_id}")

    grant = pkg["grant"]
    if "credit" in grant:
        user.increase_credit(int(grant["credit"]))
    if "remained_hafez" in grant:
        user.remained_hafez += int(grant["remained_hafez"])
    if "remained_tarot" in grant:
        user.remained_tarot += int(grant["remained_tarot"])
    if "remained_coffee" in grant:
        user.remained_coffee += int(grant["remained_coffee"])

    spent = int(pkg["amount_rial"])
    user.total_spent = (user.total_spent or 0) + spent


def fulfill_invoice(inv: PaymentInvoice) -> bool:
    """Idempotent: apply package only once when status becomes PAID."""
    if inv.status == "PAID":
        return False  # already fulfilled

    user = Profile.query.filter_by(tgid=inv.tgid).first()
    if not user:
        logger.error("Payment user not found tgid=%s invoice=%s", inv.tgid, inv.blupal_invoice_id)
        return False

    grant_package(user, inv.package_id)
    inv.status = "PAID"
    inv.paid_at = datetime.now(timezone.utc)
    db.session.commit()
    logger.info(
        "Fulfilled package=%s tgid=%s blupal_invoice=%s",
        inv.package_id, inv.tgid, inv.blupal_invoice_id,
    )
    return True

@app.route("/payments/packages", methods=["GET"])
def payments_packages():
    items = []
    for p in PACKAGES.values():
        items.append({
            "id": p["id"],
            "title": p["title"],
            "description": p["description"],
            "amount_rial": p["amount_rial"],
            "amount_toman": p["amount_rial"] // 10,
            "grant": p["grant"],
        })
    return jsonify({"packages": items})

@app.route("/payments/create", methods=["POST"])
def payments_create():
    if not BLUPAL_API_KEY:
        return jsonify({"error": "Payment gateway not configured"}), 503

    data = request.get_json(silent=True) or {}
    tgid = data.get("tgid")
    package_id = data.get("package_id")

    if not tgid or not package_id:
        return jsonify({"error": "tgid and package_id are required"}), 400

    pkg = PACKAGES.get(package_id)
    if not pkg:
        return jsonify({"error": "invalid package_id"}), 400

    user = Profile.query.filter_by(tgid=int(tgid)).first()
    if not user:
        return jsonify({"error": "User not found. Open app home first."}), 404

    amount = int(pkg["amount_rial"])
    if amount < 100_000:
        return jsonify({"error": "amount below Blupal minimum"}), 400

    try:
        r = requests.post(
            f"{BLUPAL_BASE_URL}/v1/invoices/create",
            headers=blupal_headers(),
            json={"amount": amount},
            timeout=30,
        )
        body = r.json()
    except Exception as e:
        logger.exception("Blupal create failed")
        return jsonify({"error": "gateway_error", "details": str(e)}), 502

    if not body.get("success"):
        return jsonify({
            "error": body.get("error") or "create_failed",
            "message": body.get("message"),
            "raw": body,
        }), 400

    inv = PaymentInvoice(
        tgid=int(tgid),
        package_id=package_id,
        blupal_invoice_id=body.get("invoice_id"),
        amount_rial=body.get("amount") or amount,
        final_amount=body.get("final_amount"),
        status=body.get("status") or "PENDING",
        payment_link=body.get("payment_link"),
        mode=body.get("mode"),
    )
    db.session.add(inv)
    db.session.commit()

    return jsonify({
        "success": True,
        "local_id": inv.id,
        "invoice_id": inv.blupal_invoice_id,
        "amount": inv.amount_rial,
        "final_amount": inv.final_amount,
        "status": inv.status,
        "payment_link": inv.payment_link,
        "mode": inv.mode,
        "package_id": package_id,
        "card_number": body.get("card_number"),
        "expires_at": body.get("expires_at"),
    })

@app.route("/payments/status/<int:invoice_id>", methods=["GET"])
def payments_status(invoice_id: int):
    """invoice_id = Blupal invoice id"""
    inv = PaymentInvoice.query.filter_by(blupal_invoice_id=invoice_id).first()
    if not inv:
        return jsonify({"error": "not_found"}), 404

    # If still pending, refresh from Blupal
    if inv.status == "PENDING" and BLUPAL_API_KEY:
        try:
            r = requests.get(
                f"{BLUPAL_BASE_URL}/v1/invoices/{invoice_id}",
                headers=blupal_headers(),
                timeout=20,
            )
            body = r.json()
            if body.get("success") and body.get("status") == "PAID":
                inv.transaction_id = body.get("transaction_id")
                fulfill_invoice(inv)
                inv = PaymentInvoice.query.filter_by(blupal_invoice_id=invoice_id).first()
            elif body.get("status") in ("EXPIRED", "CANCELED"):
                inv.status = body["status"]
                db.session.commit()
        except Exception as e:
            logger.warning("Blupal status check failed: %s", e)

    user = Profile.query.filter_by(tgid=inv.tgid).first()
    return jsonify({
        "invoice_id": inv.blupal_invoice_id,
        "package_id": inv.package_id,
        "status": inv.status,
        "amount": inv.amount_rial,
        "final_amount": inv.final_amount,
        "payment_link": inv.payment_link,
        "credit": user.credit if user else None,
        "remained_hafez": user.remained_hafez if user else None,
        "remained_tarot": user.remained_tarot if user else None,
        "remained_coffee": user.remained_coffee if user else None,
    })

@app.route("/payments/webhook", methods=["POST"])
def payments_webhook():
    payload = request.get_json(silent=True) or {}
    logger.info("Blupal webhook: %s", payload)

    if payload.get("event") != "payment.completed" or payload.get("status") != "PAID":
        return jsonify({"received": True, "ignored": True}), 200

    invoice_id = payload.get("invoice_id")
    if not invoice_id:
        return jsonify({"error": "missing invoice_id"}), 400

    inv = PaymentInvoice.query.filter_by(blupal_invoice_id=int(invoice_id)).first()
    if not inv:
        logger.error("Webhook unknown invoice_id=%s", invoice_id)
        return jsonify({"error": "invoice not found locally"}), 404

    if inv.status == "PAID":
        return jsonify({"received": True, "already_paid": True}), 200

    inv.transaction_id = payload.get("transaction_id")
    inv.final_amount = payload.get("final_amount") or inv.final_amount
    fulfill_invoice(inv)

    return jsonify({"received": True}), 200

#-----------------------------
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
            full_name=full_name,
            
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
    extra_line = ""
    if kindOfHoroscopy and kindOfHoroscopy != "سایر":
        extra_line = f"Main goal of horoscopy is: {kindOfHoroscopy}."

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

        {extra_line}

        Maximum 220 words, and dedicate most of words to the final interpretation.
        IMPORTANT:
        Return the interpretation in Persian.

        Cards drawn:
        {cards_text}
    """
    response = None
    errors = []

    try:
        response = mistral_api(prompt=base_prompt)
        if response:
            return jsonify({
                "interpretation": response,
                "cards": cards_list,
                "provider": "mistral"
            })
        errors.append("Mistral returned empty response")
    except Exception as e:
        logger.warning("Mistral failed: %s", str(e))
        errors.append(f"Mistral: {str(e)}")

    try:
        response = fetchingGroq(
            model=groqModels[4],
            prompt=base_prompt,
            vision=False,
            tarot=True,
        )
        if response:
            return jsonify({
                "interpretation": response,
                "cards": cards_list,
                "provider": "groq"
            })
        errors.append("Groq returned empty response")
    except Exception as e:
        logger.warning("Groq failed: %s", str(e))
        errors.append(f"Groq: {str(e)}")
    
    try:
        response = gemini_api(prompt=base_prompt)
        if response:
            return jsonify({
                "interpretation": response,
                "cards": cards_list,
                "provider": "gemini"
            })
        errors.append("Gemini returned empty response")
    except Exception as e:
        logger.warning("Gemini failed: %s", str(e))
        errors.append(f"Gemini: {str(e)}")

    logger.error("All tarot providers failed: %s", errors)
    return jsonify({
        "interpretation": "روح‌ها الان ساکت هستند. لطفاً چند لحظه بعد دوباره تلاش کنید.",
        "details": errors
    }), 502

# -----------------------------
# COFFEE READING
# -----------------------------
@app.route("/coffee", methods=["POST"])
def coffee():
    logger.info("-----> Coffee endpoint called.")

    files = request.files.getlist("images")
    names = request.form.getlist("images_name")
    tgid = request.form.get("tgid", type=int)

    if not files:
        return jsonify({"error": "No images uploaded"}), 400

    file = files[0]
    name = names[0] if names else f"coffee_{int(time.time())}"

    # ---------- 1) Basic file validation ----------
    ALLOWED = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
    MAX_BYTES = 3 * 1024 * 1024  # 3MB

    mimetype = (file.mimetype or "").lower()
    if mimetype not in ALLOWED:
        return jsonify({
            "error": "فرمت تصویر مجاز نیست. فقط jpg، png یا webp."
        }), 400

    file.stream.seek(0, 2)
    size = file.stream.tell()
    file.stream.seek(0)
    if size <= 0:
        return jsonify({"error": "فایل تصویر خالی است."}), 400
    if size > MAX_BYTES:
        return jsonify({"error": "حجم تصویر بیش از ۳ مگابایت است."}), 400

    # ---------- 2) Permission check ----------
    if tgid:
        user = Profile.query.filter_by(tgid=tgid).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        can_use = user.can_use_coffee() or user.credit >= COFFEE_PRICE
        if not can_use:
            return jsonify({
                "error": "اعتبار یا سهمیه فال قهوه کافی نیست."
            }), 403
    else:
        user = None
        logger.warning("Coffee called without tgid")

    # ---------- 3) Cheap cup validation (Gemini) ----------
    file.stream.seek(0)
    is_cup, validator_raw = is_coffee_cup_image(file)
    logger.info("Cup validator result=%s raw=%s", is_cup, validator_raw)

    if not is_cup:
        return jsonify({
            "error": "این تصویر شبیه فنجان قهوه / کف قهوه نیست. لطفاً عکس واضحی از کف فنجان بفرستید.",
            "validator": validator_raw,
        }), 400

    # ---------- 4) Upload to Cloudinary (compressed) ----------
    prompt = """
                این تصویر کف فنجان قهوه است.
                یک فال قهوه کوتاه، روان و امیدبخش به زبان فارسی بنویس.
                فقط بر اساس شکل‌ها و الگوهای قابل مشاهده در تصویر تفسیر کن.
                ادعاهای قطعی درباره آینده نکن.
                حداکثر ۱۲۰ کلمه.
            """

    errors = []
    image_url = None

    try:
        file.stream.seek(0)
        logger.info("-----> Uploading coffee image to Cloudinary...")
        cloudinary.uploader.upload(
            file,
            public_id=name,
            overwrite=True,
            transformation=[
                {"width": 768, "crop": "limit"},
                {"quality": "auto:good"},
                {"fetch_format": "auto"},
            ],
        )
        image_url, _ = cloudinary_url(
            name,
            secure=True,
            width=768,
            crop="limit",
            quality="auto",
            fetch_format="auto",
        )
        logger.info("-----> Cloudinary upload successful")
    except Exception as e:
        logger.exception("-----> Cloudinary upload failed")
        errors.append({"provider": "Cloudinary", "error": str(e)})

    # ---------- 5) Vision interpretation (Groq -> Gemini -> HF) ----------
    interpretation = None
    provider = None

    if image_url:
        try:
            logger.info("-----> Requesting Groq Vision...")
            response = fetchingGroq(
                model=groqModels[0],
                prompt=prompt,
                url=image_url,
                vision=True,
                tarot=False,
            )
            if response:
                interpretation = response
                provider = "groq"
        except Exception as e:
            logger.exception("-----> Groq Vision failed")
            errors.append({"provider": "Groq", "error": str(e)})

    if not interpretation:
        try:
            logger.info("-----> Requesting Gemini Vision...")
            file.stream.seek(0)
            response = gemini_api(
                prompt=prompt,
                vision=True,
                file=file,
                max_tokens=400,
                temperature=0.7,
            )
            if response:
                interpretation = response
                provider = "gemini"
        except Exception as e:
            logger.exception("-----> Gemini Vision failed")
            errors.append({"provider": "Gemini", "error": str(e)})

    if not interpretation and image_url:
        try:
            logger.info("-----> Requesting Hugging Face Vision...")
            response = huggingFaceAPI(prompt=prompt, imageUrl=image_url)
            # HF may return an object; normalize to text
            if response:
                interpretation = getattr(response, "content", None) or str(response)
                provider = "huggingface"
        except Exception as e:
            logger.exception("-----> Hugging Face Vision failed")
            errors.append({"provider": "Hugging Face", "error": str(e)})

    if not interpretation:
        logger.error("-----> All coffee-reading providers failed: %s", errors)
        return jsonify({
            "error": "خواندن فال قهوه الان ممکن نیست. کمی بعد دوباره تلاش کنید.",
            "details": errors,
        }), 502

    # ---------- 6) Charge only after success ----------
    if user is not None:
        if not user.use_coffee():
            # Race condition: credit changed after check
            return jsonify({
                "error": "اعتبار کافی نیست.",
                "interpretation": interpretation,  # optional: still return or not
            }), 403
        db.session.commit()
        logger.info("-----> Coffee usage charged for tgid=%s", tgid)

    return jsonify({
        "interpretation": interpretation,
        "provider": provider,
        "credit": user.credit if user else None,
        "remained_coffee": user.remained_coffee if user else None,
    }), 200

# -----------------------------
# STARS (HOROSCOPE)
# -----------------------------
@app.route("/stars", methods=["GET"])
def stars():
    lat = request.args.get("lat", type=float)
    long = request.args.get("long", type=float)
    tgid = request.args.get("tgid", type=int)
    city_name = request.args.get("city") or "موقعیت انتخاب‌شده"

    if lat is None or long is None:
        return jsonify({"error": "lat and long are required"}), 400
    if not (-90 <= lat <= 90 and -180 <= long <= 180):
        return jsonify({"error": "invalid coordinates"}), 400

    user = None
    if tgid:
        user = Profile.query.filter_by(tgid=tgid).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        # For now reuse credit; later you can add remained_stars
        STARS_PRICE = 1000  # adjust
        can_use = user.credit >= STARS_PRICE
        if not can_use:
            return jsonify({"error": "اعتبار کافی نیست."}), 403

    try:
        API_KEY = os.environ["IPGL_API_KEY"]
        url = (
            "https://api.ipgeolocation.io/v3/astronomy"
            f"?apiKey={API_KEY}&lat={lat}&long={long}&elevation=10"
        )
        r = requests.get(url, timeout=20)
        r.raise_for_status()
        raw = r.json()
    except Exception as e:
        logger.exception("Astronomy API failed")
        return jsonify({"error": "دریافت داده آسمان ناموفق بود", "details": str(e)}), 502

    astronomy = raw.get("astronomy") if isinstance(raw, dict) else None
    if not isinstance(astronomy, dict):
        astronomy = raw if isinstance(raw, dict) else {}

    sky_facts = {
        "city": city_name,
        "lat": lat,
        "long": long,
        "date": astronomy.get("date") or raw.get("date"),
        "sunrise": astronomy.get("sunrise"),
        "sunset": astronomy.get("sunset"),
        "moonrise": astronomy.get("moonrise"),
        "moonset": astronomy.get("moonset"),
        "moon_phase": astronomy.get("moon_phase") or astronomy.get("moonPhase"),
        "moon_illumination": astronomy.get("moon_illumination")
            or astronomy.get("moon_illumination_percentage"),
        "solar_noon": astronomy.get("solar_noon"),
        "day_length": astronomy.get("day_length"),
    }
    sun_sign = user.sun_sign if user and user.sun_sign else None
    sun_sign_fa = SUN_SIGN_FA.get(sun_sign, sun_sign) if sun_sign else None

    MOON_FA = {
        "NEW_MOON": "ماه نو",
        "WAXING_CRESCENT": "هلال افزاینده",
        "FIRST_QUARTER": "ربع اول",
        "WAXING_GIBBOUS": "کوژ افزاینده",
        "FULL_MOON": "ماه کامل",
        "WANING_GIBBOUS": "کوژ کاهنده",
        "LAST_QUARTER": "ربع آخر",
        "WANING_CRESCENT": "هلال کاهنده",
    }

    phase = sky_facts.get("moon_phase")
    if phase:
        sky_facts["moon_phase"] = MOON_FA.get(str(phase).upper(), phase)
    
    if sun_sign_fa:
        prompt = f"""
            تو یک روایت‌گر طالع به زبان فارسی هستی.

            کاربر متولد برج {sun_sign_fa or "نامشخص"} است.
            دادههای آسمان امروز:
            {sky_facts}

            دستورهای اجباری:
            - تمام متن را فقط به فارسی بنویس
            - هیچ کلمه یا عنوان انگلیسی استفاده نکن
            - از عبارتهایی مثل Energy of the day یا New Moon یا Aries استفاده نکن
            - فاز ماه را فارسی بگو (مثلاً ماه نو)
            - نام برج را فارسی بگو (مثلاً حمل)
            - پیشگویی قطعی نکن
            - ساختار فقط با عناوین فارسی:
            حال کلی
            انرژی روز
            یک توصیه
            - حداکثر ۱۵۰ کلمه
            """
    else:
        prompt = f"""
            تو یک روایت‌گر لطیف طالع و آسمان هستی.
            بر اساس این دادههای نجومی، یک متن کوتاه فارسی بنویس.

            دادهها:
            {sky_facts}

            قوانین:
            - لحنی گرم، عرفانی و امیدبخش داشته باش
            - پیشگویی قطعی نکن
            - از ترس و اغراق پرهیز کن
            - ساختار:
            1) حال کلی آسمان
            2) انرژی روز
            3) یک توصیه کوتاه
            - حداکثر 140 کلمه
            - فقط فارسی بنویس
            """

    interpretation = None
    provider = None
    errors = []

    try:
        interpretation = fetchingGroq(
            model=groqModels[1],
            prompt=prompt,
            vision=False,
            tarot=False,
            )
        if interpretation:
            provider = "groq"
    except Exception as e:
        logger.warning("Stars Groq failed: %s", e)
        errors.append(f"groq: {e}")

    if not interpretation:
        try:
            interpretation = gemini_api(prompt=prompt, max_tokens=350, temperature=0.8)
            if interpretation:
                provider = "gemini"
        except Exception as e:
            logger.warning("Stars Gemini failed: %s", e)
            errors.append(f"gemini: {e}")
        
    if not interpretation:
        return jsonify({
            "error": "الان خواندن آسمان ممکن نیست.",
            "details": errors,
            "sky_facts": sky_facts,
        }), 502

    if user is not None:
        STARS_PRICE = 1000
        if not user.decrease_credit(STARS_PRICE):
            return jsonify({"error": "اعتبار کافی نیست."}), 403
        db.session.commit()

    return jsonify({
        "sky_facts": sky_facts,
        "interpretation": interpretation,
        "provider": provider,
        "credit": user.credit if user else None,
        "sun_sign": sun_sign,
        "sun_sign_fa": sun_sign_fa,
    }), 200

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
                - فال نباید شامل پیش‌گویی قطعی باشد.
                - فال باید کوتاه، روان و قابل فهم باشد.
                - حداکثر 120 کلمه.

                شعر:
                {poem}
            """


    ai_faal = fetchingGroq(
        model=groqModels[1],
        prompt=prompt,
        vision=False
    )

    tgid = request.args.get("tgid", type=int)
    if tgid:
        user = Profile.query.filter_by(tgid=tgid).first()
        if user and user.use_hafez():
            db.session.commit()

    return jsonify({
        "poem": poem,
        "ai_faal": ai_faal
    })
# -----------------------------
# Credential Check
# -----------------------------
@app.route('/check')
def check():
    horoscopy_model = (
        request.args.get("horoscopy_model")
        or request.args.get("model")
    )
    tgid = request.args.get("tgid", type=int)

    if not tgid:
        return jsonify({"error": "tgid is required"}), 400

    if horoscopy_model not in ["hafez", "coffee", "tarot"]:
        return jsonify({
            "error": "Invalid or missing model. Use hafez, coffee, or tarot."
        }), 400

    user = Profile.query.filter_by(tgid=tgid).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    try:
        if horoscopy_model == "hafez":
            can_use = user.can_use_hafez() or user.credit >= HAFEZ_PRICE
        elif horoscopy_model == "coffee":
            can_use = user.can_use_coffee() or user.credit >= COFFEE_PRICE
        elif horoscopy_model == "stars":
            can_use = user.credit >= STARS_PRICE
        else: 
            can_use = user.can_use_tarot() or user.credit >= TAROT_PRICE

        return jsonify({
            "can_use": can_use,
            "credit": user.credit,
            "remained_hafez": user.remained_hafez,
            "remained_coffee": user.remained_coffee,
            "remained_tarot": user.remained_tarot,
        })
    except Exception as e:
        logger.error(f"Error in check: {str(e)}")
        return jsonify({"error": "Error in checking permission"}), 500

# -----------------------------
# Save BDay
# -----------------------------
@app.route("/profile/birth", methods=["POST"])
def save_birth():
    data = request.get_json(silent=True) or {}
    tgid = data.get("tgid") or request.args.get("tgid", type=int)
    birth_str = data.get("birth_date")  # "YYYY-MM-DD"

    if not tgid or not birth_str:
        return jsonify({"error": "tgid and birth_date are required"}), 400

    try:
        birth = date.fromisoformat(birth_str)
    except ValueError:
        return jsonify({"error": "birth_date must be YYYY-MM-DD"}), 400

    user = Profile.query.filter_by(tgid=int(tgid)).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    user.birth_date = birth
    user.sun_sign = get_sun_sign(birth)
    db.session.commit()

    return jsonify({
        "tgid": user.tgid,
        "birth_date": user.birth_date.isoformat(),
        "sun_sign": user.sun_sign,
        "sun_sign_fa": SUN_SIGN_FA.get(user.sun_sign, user.sun_sign),
    })

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
