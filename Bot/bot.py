import os
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
WEBAPP_URL = "https://khaki-pears-beam.loca.lt"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("✨ Open Mystic Oracle ✨", web_app={"url": WEBAPP_URL})]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        "🌟 Welcome to the **Mystic Oracle**! 🌟\n\n"
        "Click the button below to open the Fortune Teller:",
        reply_markup=reply_markup,
        parse_mode='Markdown'
    )

def main():
    if not BOT_TOKEN:
        print("❌ BOT_TOKEN not found in .env!")
        return

    # Build application with proxy if provided
    builder = Application.builder().token(BOT_TOKEN)
    
   

    app = builder.build()

    app.add_handler(CommandHandler("start", start))

    print("✅ Bot is starting...")
    app.run_polling()

if __name__ == '__main__':
    main()