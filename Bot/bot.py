import os
import json
import logging
import requests
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    PreCheckoutQueryHandler,
    MessageHandler,
    filters,
)

load_dotenv()

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
WEB_APP_URL = os.getenv("WEB_APP_URL")
API_BASE = os.getenv("API_BASE", "https://fortune-teller-nhy4.onrender.com")
INTERNAL_PAYMENT_SECRET = os.getenv("INTERNAL_PAYMENT_SECRET", "")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bot")


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("✨ Open Mystic Oracle ✨", web_app={"url": WEB_APP_URL})]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(
        "🌟 Welcome to the **Mystic Oracle**! 🌟\n\n"
        "Click the button below to open the Fortune Teller:",
        reply_markup=reply_markup,
        parse_mode="Markdown",
    )


async def on_pre_checkout(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.pre_checkout_query
    # Optional: validate payload JSON / package_id here
    await q.answer(ok=True)


async def on_successful_payment(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = update.message
    if not msg or not msg.successful_payment:
        return

    pay = msg.successful_payment
    try:
        payload = json.loads(pay.invoice_payload)
        tgid = int(payload["tgid"])
        package_id = payload["package_id"]
    except Exception:
        logger.exception("Bad invoice payload: %s", pay.invoice_payload)
        await msg.reply_text("Payment received but order data was invalid. Contact support.")
        return

    charge_id = pay.telegram_payment_charge_id

    try:
        r = requests.post(
            f"{API_BASE}/payments/stars/complete",
            json={
                "tgid": tgid,
                "package_id": package_id,
                "charge_id": charge_id,
                "secret": INTERNAL_PAYMENT_SECRET,
            },
            timeout=30,
        )
        data = r.json() if r.content else {}
        if r.status_code >= 400:
            logger.error("Grant failed: %s %s", r.status_code, data)
            await msg.reply_text("Payment OK, but activating the package failed. Contact support.")
            return
    except Exception:
        logger.exception("Grant request failed")
        await msg.reply_text("Payment OK, but server error while activating. Contact support.")
        return

    await msg.reply_text("✅ Payment successful. Your package is active.")


import asyncio

def main():
    if not BOT_TOKEN:
        print("❌ TELEGRAM_BOT_TOKEN not found in env!")
        return

    try:
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            raise RuntimeError
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(PreCheckoutQueryHandler(on_pre_checkout))
    app.add_handler(MessageHandler(filters.SUCCESSFUL_PAYMENT, on_successful_payment))

    print("✅ Bot is starting...")
    app.run_polling(
        drop_pending_updates=True,
        stop_signals=None,
    )


if __name__ == "__main__":
    main()