import asyncio
from telegram import Bot

async def get_chat_ids():
    bot = Bot(token="7953028871:AAEJib0zd5mnbbzAOpL9OY6u9e9bVmpW3A4")
    try:
        updates = await bot.get_updates()
        for update in updates:
            if update.message:
                print(f"Chat ID: {update.message.chat.id}")
    except Exception as e:
        print(f"Ошибка: {e}")

if __name__ == "__main__":
    asyncio.run(get_chat_ids())