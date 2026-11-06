# WhatsApp PAYE & Gratuity Calculator 2026 - Zambia
By Chishimba Kabwe

Full project to run your PAYE calculator from the HTML on WhatsApp.

## Features
- 2026 ZRA PAYE bands: 0% up to 5100, 20% 5100-7100, 30% 7100-9200, 37% above
- NAPSA 5% capped at K1,861.80
- NHIMA 1%
- Gratuity 25% of total basic earnings
- Natural language: users can just type "15000"

## Two Versions Included

### A) Cloud API (Official, Recommended for public bot)
Uses Meta WhatsApp Cloud API. Free forever.

1. Create app at developers.facebook.com
2. Add WhatsApp product -> get PHONE_NUMBER_ID and WHATSAPP_TOKEN
3. Deploy:
   - Push to GitHub
   - Go to render.com -> New Web Service -> connect repo
   - Build: npm install
   - Start: npm start
   - Add Env vars from .env.example
4. Set Webhook in Meta dashboard:
   URL: https://your-app.onrender.com/webhook
   Verify Token: same as in .env
   Subscribe to messages
5. Test with your number

### B) QR Version (Instant, no approval)
Runs on your own phone.

```
npm install whatsapp-web.js qrcode-terminal
node qr-version.js
```
Scan QR code. Your WhatsApp number IS the bot. Keep laptop on.

## WhatsApp Commands
- `hi` / `help` -> menu
- `paye 15000` -> monthly
- `annual 180000` -> converts to monthly
- `15000` -> just amount
- `gratuity 12000 24` -> basic + months

## Deploy Anywhere
- Render.com (free)
- Railway.app
- Vercel (serverless)
- Your own VPS

## Next Steps
- Add PDF payslip: use pdfkit
- Add Swahili/Bemba language support
- Save history to database (MongoDB)
- Add "Share" button
