# Twilio WhatsApp Setup - Step by Step

## 1. Create Twilio Account
- Go to https://www.twilio.com/try-twilio
- Verify email + phone

## 2. Join WhatsApp Sandbox (for testing - FREE)
- Console -> Messaging -> Try it out -> WhatsApp Sandbox
- You'll see: Join code like `join <word>`
- On YOUR WhatsApp, send that join code to +1 415 523 8886
- You are now connected to sandbox

## 3. Install project locally
```
npm install
npm install twilio
```
Create .env file:
```
PORT=3000
```

## 4. Run locally + expose with ngrok
Twilio can't reach localhost, so use ngrok:
```
npm install -g ngrok
npm run start:twilio  (or node index-twilio.js)
In another terminal: ngrok http 3000
```
Copy the https URL e.g. https://a1b2-...ngrok-free.app

## 5. Connect Twilio Webhook
- Twilio Console -> Messaging -> WhatsApp Sandbox Settings
- When a message comes in: PASTE your ngrok URL + /whatsapp
  e.g. https://a1b2-...ngrok-free.app/whatsapp
- Save
- Now send on WhatsApp: paye 15000 to the sandbox number -> bot replies!

## 6. Deploy for 24/7 (so you don't need ngrok)
- Push to GitHub
- Go to Render.com -> New Web Service
- Build: npm install
- Start: node index-twilio.js
- After deploy, copy Render URL e.g. https://paye-bot.onrender.com/whatsapp
- Go back to Twilio Sandbox Settings -> replace ngrok URL with Render URL

## 7. Go Live (own number)
- Sandbox is only for you. For public:
- Twilio Console -> Messaging -> WhatsApp Senders -> Request to enable your own number
- Need Facebook Business verification + business display name
- Or keep using Cloud API version (index.js) which is free forever

## Testing Commands
- hi
- paye 15000
- annual 180000
- gratuity 12000 24
