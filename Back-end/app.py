from flask_cors import CORS
import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
import logging
import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url
import requests
from concurrent.futures import ThreadPoolExecutor

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -----------------------------
# CONFIG
# -----------------------------
SPACE_URL_TEXT = "https://ashkanes-fortunetellerai.hf.space/run/chat_text"
SPACE_URL_IMAGE = "https://ashkanes-fortunetellerai.hf.space/run/chat_image"

TEXT_MODELS = [
    "meta-llama/Llama-3.1-8B-Instruct:groq",
    "deepseek-ai/DeepSeek-V4-Flash:novita",
    "Qwen/Qwen2.5-7B-Instruct:featherless-ai",
    "gemma-2-9b-it:groq"
]

VISION_MODEL = ['google/gemma-4-31B-it:novita', 'moonshotai/Kimi-K2.5:novita', 'zai-org/GLM-4.5V:novita', 'Qwen/Qwen3.6-27B:featherless-ai']

cloudinary.config(
    cloud_name=os.environ["CLOUDNARY_NAME"],
    api_key=os.environ["CLOUDNARY_API_KEY"],
    api_secret=os.environ["CLOUDNARY_SECRET_KEY"],
    secure=True
)

# -----------------------------
# QUERY FUNCTION (TEXT)
# -----------------------------
def query(prompt: str, model: str):
    logger.info(f"----->Calling Space model: {model}")

    payload = {
        "data": [
            model,
            prompt
        ]
    }

    try:
        r = requests.post(SPACE_URL_TEXT, json=payload, timeout=120)
        r.raise_for_status()
        content = r.json()["data"][0]
        return {"generated_text": content}

    except Exception as e:
        logger.exception("Space error")
        return {"error": str(e)}

# -----------------------------
# HOME
# -----------------------------
@app.route('/')
def home():
    return "Fortune Teller Backend is running!"

# -----------------------------
# TAROT
# -----------------------------
@app.route('/tarot', methods=['GET'])
def tarot():
    logger.info('----->Tarot endpoint called.')

    cards_list = request.args.getlist("cards_list[]")
    if not cards_list:
        return jsonify({"error": "No cards provided"}), 400

    cards_text = ", ".join(cards_list)

    prmpt_1 = """
        You are a traditional Tarot scholar.
        Focus on:
        - Rider-Waite symbolism
        - archetypes
        - esoteric meanings
        - historical Tarot
        - interactions between Major and Minor Arcana
        Never speculate outside Tarot tradition.
    """

    prmpt_2 = """
        You are a modern psychological Tarot counselor.
        Focus on:
        - emotions
        - unconscious patterns
        - relationships
        - shadow work
        - personal growth
        - practical advice
        Use Tarot as a mirror of the psyche.
    """

    base_prompt = f"""
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
            - Maximum 220 words
        IMPORTANT: Return Your interpretations in Farsi.
        Write in fluent Markdown.

        Cards drawn: {cards_text}
    """

    with ThreadPoolExecutor(max_workers=2) as executor:
        future_1 = executor.submit(query, prmpt_1 + base_prompt, TEXT_MODELS[0])
        future_2 = executor.submit(query, prmpt_2 + base_prompt, TEXT_MODELS[1])

        response1 = future_1.result()
        response2 = future_2.result()

    text1 = response1.get("generated_text") or "No interpretation was produced."
    text2 = response2.get("generated_text") or "No interpretation was produced."

    correction_prompt = f"""
        You are the Grand Master Tarot Reader.
        The following two expert readers interpreted the same Tarot spread.

        Cards:
        {cards_text}

        ------------------------
        Interpretation A
        {text1}

        ------------------------
        Interpretation B
        {text2}

        ------------------------

        Your task is NOT to rewrite them.
        Instead:
        • Merge only the strongest insights.
        • Discard weak, repetitive or contradictory ideas.
        • Correct any factual Tarot mistakes.
        • Preserve traditional symbolism.
        • Explain interactions between cards.
        • Produce one polished, coherent reading.
        • Do NOT mention there were multiple readers.

        Requirements:
        - Persian
        - Maximum 300 words
        - Beautiful Markdown
        - Mystical but psychologically grounded
        - Encouraging
        - No deterministic predictions
        - Output only the final interpretation.
    """

    final_result = query(correction_prompt, TEXT_MODELS[3])

    if "error" in final_result:
        return jsonify({
            "interpretation": "The spirits are quiet right now. Please try again in a moment.",
            "details": final_result["error"]
        }), 502

    return jsonify({"interpretation": final_result["generated_text"]})

# -----------------------------
# COFFEE READING
# -----------------------------
@app.route('/coffee', methods=['POST'])
def coffee():
    files = request.files.getlist("images")
    names = request.form.getlist("images_name")

    if not files:
        return jsonify({"error": "No images uploaded"}), 400

    img_urls = []
    for f, nm in zip(files, names):
        cloudinary.uploader.upload(f, public_id=nm)
        optimize_url, _ = cloudinary_url(
            nm,
            fetch_format="auto",
            quality="auto",
            width=500,
            height=500,
            crop="auto",
            gravity="auto"
        )
        img_urls.append(optimize_url)

    payload = {
        "data": [
            VISION_MODEL,
            img_urls[0],
            """
            You are an expert in Persian coffee fortune telling...
            IMPORTANT: Return your interpretation in Persian.
            """
        ]
    }

    try:
        r = requests.post(SPACE_URL_IMAGE, json=payload, timeout=120)
        r.raise_for_status()
        content = r.json()["data"][0]
        return jsonify({"interpretation": content})

    except Exception as e:
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
