import os
import json
import logging
import asyncio
import requests
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
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

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("telegram.ext._httpxrequest").setLevel(logging.WARNING)

logger = logging.getLogger("bot")  # ← required


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    logger.info(
        "START from user_id=%s",
        update.effective_user.id if update.effective_user else None,
    )
    if not update.message:
        return

    url = (WEB_APP_URL or "").strip()
    if not url.startswith("https://"):
        await update.message.reply_text("WEB_APP_URL must start with https://")
        return

    lang = (update.effective_user.language_code or "en").lower()
    is_fa = lang.startswith("fa")

    text = (
        "به فال‌نامه جام‌جم خوش آمدید.\nبرای ورود روی دکمه زیر بزنید:"
        if is_fa
        else "Welcome to Jam-e-Jam Fortune.\nTap the button below to open the app:"
    )
    btn = "✨ باز کردن برنامه" if is_fa else "✨ Open app"

    keyboard = [[InlineKeyboardButton(btn, web_app=WebAppInfo(url=url))]]
    await update.message.reply_text(
        text,
        reply_markup=InlineKeyboardMarkup(keyboard),
    )

    if not update.message:
        return

    if not WEB_APP_URL:
        await update.message.reply_text(
            "Bot is online, but WEB_APP_URL is not set on the server."
        )
        return

    keyboard = [
        [
            InlineKeyboardButton(
                "✨ Open Mystic Oracle ✨",
                web_app={"url": WEB_APP_URL},
            )
        ]
    ]
    await update.message.reply_text(
        "Bot is online.\nOpen the app:",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )

async def on_pre_checkout(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.pre_checkout_query
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
        await msg.reply_text(
            "Payment received but order data was invalid. Contact support."
        )
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
            await msg.reply_text(
                "Payment OK, but activating the package failed. Contact support."
            )
            return
    except Exception:
        logger.exception("Grant request failed")
        await msg.reply_text(
            "Payment OK, but server error while activating. Contact support."
        )
        return

    await msg.reply_text("✅ Payment successful. Your package is active.")

async def terms(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not update.message:
        return
    await update.message.reply_text(
        "شرایط استفاده:\n"
        "این سرویس محتوای سرگرمی (فال و طالع) ارائه می‌دهد و جایگزین مشاوره تخصصی نیست.\n"
        "خریدها دیجیتال‌اند و قابل انتقال به حساب دیگر نیستند.\n"
        "برای خرید استارز می‌توانید از ایرانیکارت، یا ربات @TronKavbot استفاده کنید.\n"
        "در صورت مشکل پرداخت از /paysupport استفاده کنید."
    )

async def paysupport(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not update.message:
        return
    await update.message.reply_text(
        "پشتیبانی پرداخت:\n"
        "آیدی عددی تلگرام و زمان تقریبی پرداخت را ارسال کنید.\n"
        "مثال: tgid + تاریخ/ساعت تقریبی خرید استارز."
    )


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
    app.add_handler(CommandHandler("terms", terms))
    app.add_handler(CommandHandler("paysupport", paysupport))

    app.add_handler(PreCheckoutQueryHandler(on_pre_checkout))
    app.add_handler(MessageHandler(filters.SUCCESSFUL_PAYMENT, on_successful_payment))


    print("✅ Bot is starting...")
    app.run_polling(
        drop_pending_updates=True,
        stop_signals=None,
    )

    print("✅ Bot is starting...")
    app.run_polling(
        drop_pending_updates=True,
        stop_signals=None,
    )


if __name__ == "__main__":
    main()