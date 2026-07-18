from concurrent.futures import ThreadPoolExecutor
import logging
import os

import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from gradio_client import Client, handle_file

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
# AI Models
# --------------------------------------------------

TEXT_MODELS = [
    "meta-llama/Llama-3.3-70B-Instruct:groq",
    "openai/gpt-oss-120b:groq",
    "deepseek-ai/DeepSeek-V4-Flash:novita",
    "moonshotai/Kimi-K2-Instruct:novita",
]

VISION_MODELS = [
    "google/gemma-4-31B-it:novita",
    "moonshotai/Kimi-K2.5:novita",
    "zai-org/GLM-4.5V:novita",
    "Qwen/Qwen3.6-27B:featherless-ai",
]

DEFAULT_TEXT_MODEL = TEXT_MODELS[0]
DEFAULT_VISION_MODEL = VISION_MODELS[0]

# --------------------------------------------------
# Cloudinary
# --------------------------------------------------

cloudinary.config(
    cloud_name=os.getenv("CLOUDNARY_NAME"),
    api_key=os.getenv("CLOUDNARY_API_KEY"),
    api_secret=os.getenv("CLOUDNARY_SECRET_KEY"),
    secure=True,
)

# --------------------------------------------------
# Hugging Face Space Client
# --------------------------------------------------

HF_SPACE = "AshkanEs/FortuneTellerAI"

client = Client(
    HF_SPACE,
    token=os.getenv("HF_TOKEN"),
)
# -----------------------------
# QUERY FUNCTIONS
# -----------------------------
def query(
    prompt: str,
    model: str,
    temperature: float = 0.7,
):
    """
    Calls the Hugging Face Space text endpoint.
    """

    logger.info(f"Calling Space model: {model}")

    try:
        result = client.predict(
            model=model,
            prompt=prompt,
            temperature=temperature,
            api_name="/chat_text",
        )

        return {
            "generated_text": result
        }

    except Exception as e:
        logger.exception("Space error")

        return {
            "error": str(e)
        }


def query_image(
    image_path: str,
    prompt: str,
    model: str,
    temperature: float = 0.7,
):
    """
    Calls the Hugging Face Space vision endpoint.
    """

    logger.info(f"Calling Vision model: {model}")

    try:
        result = client.predict(
            model=model,
            image_path=handle_file(image_path),
            prompt=prompt,
            temperature=temperature,
            api_name="/chat_image",
        )

        return {
            "generated_text": result
        }

    except Exception as e:
        logger.exception("Vision Space error")

        return {
            "error": str(e)
        }
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

    prompt_1 = """
You are a traditional Tarot scholar.

Focus on:
- Rider-Waite symbolism
- archetypes
- esoteric meanings
- historical Tarot
- interactions between Major and Minor Arcana

Never speculate outside Tarot tradition.
"""

    prompt_2 = """
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

Maximum 220 words.

IMPORTANT:
Return the interpretation in Persian.

Cards drawn:

{cards_text}
"""

    with ThreadPoolExecutor(max_workers=2) as executor:

        future1 = executor.submit(
            query,
            prompt_1 + base_prompt,
            TEXT_MODELS[0],
            0.8,
        )

        future2 = executor.submit(
            query,
            prompt_2 + base_prompt,
            TEXT_MODELS[1],
            0.8,
        )

        response1 = future1.result()
        response2 = future2.result()

    text1 = response1.get("generated_text", "")
    text2 = response2.get("generated_text", "")

    correction_prompt = f"""
You are the Grand Master Tarot Reader.

Cards:

{cards_text}

--------------------------
Interpretation A

{text1}

--------------------------
Interpretation B

{text2}

--------------------------

Merge only the strongest ideas.

Discard repetitive or contradictory statements.

Correct Tarot mistakes.

Preserve traditional symbolism.

Explain interactions between the cards.

Produce ONE polished reading.

Do NOT mention multiple readers.

Requirements

- Persian
- Markdown
- Maximum 300 words
- Mystical
- Psychologically grounded
- Encouraging
- No deterministic predictions
"""

    final_result = query(
        correction_prompt,
        TEXT_MODELS[3],
        0.3,
    )

    if "error" in final_result:
        return (
            jsonify(
                {
                    "interpretation": "The spirits are quiet right now.",
                    "details": final_result["error"],
                }
            ),
            502,
        )

    return jsonify(
        {
            "interpretation": final_result["generated_text"]
        }
    )


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

        interpretation = client.predict(
            model=VISION_MODELS[0],
            image_path=handle_file(uploaded_urls[0]),
            prompt="""
You are an expert in Persian coffee fortune telling.

Interpret the cup symbolically.

Avoid deterministic predictions.

Be mystical, encouraging and psychologically insightful.

Return the answer in Persian Markdown.
""",
            temperature=0.7,
            api_name="/chat_image",
        )

        return jsonify(
            {
                "interpretation": interpretation
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
