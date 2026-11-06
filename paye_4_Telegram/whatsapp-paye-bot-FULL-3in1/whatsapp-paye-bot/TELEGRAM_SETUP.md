# Telegram Setup - 2 Minutes

## Step 1: Create Bot (30 seconds)
1. Open Telegram, search @BotFather
2. Send /newbot
3. Name: PAYE Calculator ZM
4. Username: zambia_paye_2026_bot (must end with _bot, must be unique)
5. BotFather gives you TOKEN like 123456:ABC-DEF...

## Step 2: Run
```
npm install
npm install node-telegram-bot-api
```
Create .env:
```
TELEGRAM_BOT_TOKEN=123456:ABC-DEF-your-token
```
Run:
```
node index-telegram.js
```
or
```
npm run start:telegram
```

## Step 3: Test
- Open your bot on Telegram (t.me/zambia_paye_2026_bot)
- Send: hi
- Send: 15000
- Send: paye 25000
- Send: gratuity 12000 24

## Step 4: Deploy 24/7 (Optional)
Render.com / Railway.app:
- Build: npm install
- Start: node index-telegram.js
- Add env var TELEGRAM_BOT_TOKEN

That's it! No webhook, no ngrok, no approval needed. Telegram uses long polling.

## Features
- Keyboard buttons for quick calc
- Markdown formatted replies
- Same logic as WhatsApp
