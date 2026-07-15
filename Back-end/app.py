from flask_cors import CORS 
import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from gradio_client import Client
import logging
from openai import OpenAI
import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url
import requests
from concurrent.futures import ThreadPoolExecutor

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
      
cloudinary.config(
    cloud_name=os.environ["CLOUDNARY_NAME"],
    api_key=os.environ["CLOUDNARY_API_KEY"],
    api_secret=os.environ["CLOUDNARY_SECRET_KEY"],
    secure=True
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/') 
def home(): 
    return "Fortune Teller Backend is running!" 


ROUTER_URL = "https://router.huggingface.co/v1/chat/completions"
HF_TOKEN = os.environ["HFT"]

def query(prompt: str, model: str, temperature: float = 0.7):
    logger.info(f"----->Calling model: {model}")

    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
    }

    try:
        logger.info("----->Calling HuggingFace Router...")
        r = requests.post(ROUTER_URL, headers=headers, json=payload, timeout=120)
        r.raise_for_status()

        content = r.json()["choices"][0]["message"]["content"]
        logger.info("----->Router is responded successfully.")

        return {"generated_text": content}

    except Exception as e:
        logger.exception("Router error")
        return {"error": str(e)}

    
@app.route('/tarot', methods=['GET'])
def tarot():
    logger.info('----->Back-End is Called.')

    cards_list = request.args.getlist("cards_list[]")
    if not cards_list:
        return jsonify({"error": "No cards provided"}), 400

    cards_text = ", ".join(cards_list)

    # -----------------------------
    # PROMPTS
    # -----------------------------
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

    # -----------------------------
    # PARALLEL MODEL EXECUTION
    # -----------------------------
    logger.info('----->AI API is ready.')

    with ThreadPoolExecutor(max_workers=2) as executor:
        future_1 = executor.submit(query, prmpt_1 + base_prompt, TEXT_MODELS[0], 0.3)
        future_2 = executor.submit(query, prmpt_2 + base_prompt, TEXT_MODELS[1], 0.8)

        response1 = future_1.result()
        response2 = future_2.result()

    text1 = response1.get("generated_text") or "No interpretation was produced."
    text2 = response2.get("generated_text") or "No interpretation was produced."

    # -----------------------------
    # MERGE PROMPT
    # -----------------------------
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
        - Maximum 300 words, and dedicate most of them to the interpretation
        - Beautiful Markdown
        - Mystical but psychologically grounded
        - Encouraging
        - No deterministic predictions
        - Output only the final interpretation.
    """

    final_result = query(correction_prompt, TEXT_MODELS[3], 0.2)

    if "error" in final_result:
        logger.error(f"AI API error: {final_result['error']}")
        return jsonify({
            "interpretation": "The spirits are quiet right now. Please try again in a moment.",
            "details": final_result.get("error", "Unknown error")
        }), 502

    interpretation = final_result.get("generated_text", "")
    if not interpretation:
        return jsonify({
            "interpretation": "The spirits are quiet right now. Please try again in a moment.",
            "details": "Invalid response format from AI provider"
        }), 502

    logger.info('----->Interpretation received successfully')
    return jsonify({"interpretation": interpretation})


@app.route('/coffee', methods=['POST'])
def coffee():
    files = request.files.getlist("images")
    names = request.form.getlist("images_name")

    logger.info('----->Back-End is Called.')

    if not files:
        return jsonify({"error": "No images uploaded"}), 400

    img_urls = []
    logger.info(f"Received {len(files)} files")
    logger.info(f"Received names: {names}")
    for f, nm in zip(files, names):
        upload_result = cloudinary.uploader.upload(f, public_id=nm)
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

    HF_client = OpenAI(
        base_url="https://router.huggingface.co/v1",
        api_key=os.environ["HFT"],
    )

    logger.info('----->Request is initiated.')
    prompt = """
            You are an expert in Persian coffee fortune telling and symbolic astrology.
            Analyze the uploaded coffee cup images carefully and extract:
            - hidden shapes
            - symbolic patterns
            - emotional energy
            - mythological references
            - astrological influences
            - personality insights
            - future tendencies (non‑deterministic)

            Your interpretation must be:
            - mystical and poetic
            - psychologically insightful
            - compassionate and encouraging
            - rooted in Persian divination traditions
            - based ONLY on what is visible in the images
            - written in fluent Farsi
            - structured like a horoscope reading
            - maximum 250 words

            Include:
            1. **Overall energy of the cup**
            2. **Symbolic shapes and their meaning**
            3. **Astrological alignment inspired by the patterns**
            4. **Guidance for the seeker**

            Do NOT make deterministic predictions.
            Do NOT mention the analysis process.
            Focus only on the symbolic meaning of the images.
            IMPORTANT:Return your interpretation in Persian."""
    
    result = HF_client.chat.completions.create(
        model="google/gemma-4-31B-it:novita",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": img_urls[0]}
                ]
            }
        ],
    )

    interpretation = result.choices[0].message.content
    logging.info(f"----->\n{interpretation}\n<-----")
    return jsonify({"interpretation": interpretation})

@app.route('/stars')
def stars():
    lat = request.args.get('lat')
    long = request.args.get('long')

    API_KEY = os.environ["IPGL_API_KEY"]
    url = f"https://api.ipgeolocation.io/v3/astronomy?apiKey={API_KEY}&lat={lat}&long={long}&elevation=10"

    response = requests.get(url)
    data = response.json()

    astro = data["astronomy"]
    loc = data["location"]

    horoscope_data = {
        "location": {
            "city": loc["city"],
            "state": loc["state_prov"],
            "country": loc["country_name"],
            "latitude": loc["latitude"],
            "longitude": loc["longitude"],
            "elevation": loc["elevation"]
        },
        "sun": {
            "altitude": astro["sun_altitude"],
            "azimuth": astro["sun_azimuth"],
            "sunrise": astro["sunrise"],
            "sunset": astro["sunset"],
            "solar_noon": astro["solar_noon"],
            "day_length": astro["day_length"]
        },
        "moon": {
            "phase": astro["moon_phase"],
            "altitude": astro["moon_altitude"],
            "azimuth": astro["moon_azimuth"],
            "illumination": astro["moon_illumination_percentage"],
            "moonrise": astro["moonrise"],
            "moonset": astro["moonset"]
        },
        "timing": {
            "current_time": astro["current_time"],
            "night_begin": astro["night_begin"],
            "night_end": astro["night_end"],
            "golden_hour_morning": astro["morning"]["golden_hour_begin"],
            "golden_hour_evening": astro["evening"]["golden_hour_begin"],
            "blue_hour_morning": astro["morning"]["blue_hour_begin"],
            "blue_hour_evening": astro["evening"]["blue_hour_begin"]
        }
    }

    prompt =f"""
            You are an expert astrologer.
            Based on the following astronomical data:
            {horoscope_data}

            Generate a mystical horoscope in Farsi.
            Avoid deterministic predictions.
            Maximum 200 words.
            IMPORTANT:Return horoscope in Persian.
            """

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
        horoscope_data = result.get("generated_text", "")
            
        if not horoscope_data:
            raise ValueError("Empty response from API")
            
        logger.info(f'----->horoscope_data received successfully')
    except (KeyError, TypeError, IndexError, ValueError) as e:
        logger.error(f"Failed to parse response: {e}, result: {result}")
        return jsonify({
            "horoscope_data": "The spirits are quiet right now. Please try again in a moment.",
            "details": "Invalid response format from AI provider"
        }), 502

    return jsonify({"horoscope_data": horoscope_data})


@app.route('/env-test') 
def health(): 
    return {"status": "ok"} 

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
