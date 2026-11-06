require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'chishimba123';
const PORT = process.env.PORT || 3000;

// --- CORE TAX LOGIC (from your HTML) ---
function calcPAYE(monthly){
  const bands = [
    { limit: 5100, rate: 0, label: 'First K5,100.00' },
    { limit: 7100, rate: 0.20, label: 'K5,100.01 - K7,100.00' },
    { limit: 9200, rate: 0.30, label: 'K7,100.01 - K9,200.00' },
    { limit: Infinity, rate: 0.37, label: 'K9,200.01 and above' },
  ];
  let remaining = monthly, prev = 0, totalTax = 0;
  const breakdown = [];
  for(const band of bands){
    if(remaining <=0) break;
    const span = band.limit - prev;
    const taxable = Math.min(remaining, span);
    const tax = taxable * band.rate;
    totalTax += tax;
    breakdown.push({ ...band, taxable, tax, active: taxable>0 });
    remaining -= taxable;
    prev = band.limit;
  }
  return { totalTax, breakdown };
}

function getPayslip(monthly){
  const { totalTax, breakdown } = calcPAYE(monthly);
  const napsa = Math.min(monthly * 0.05, 1861.80);
  const nhima = monthly * 0.01;
  const totalDeductions = totalTax + napsa + nhima;
  const net = monthly - totalDeductions;
  const effRate = monthly>0 ? (totalTax/monthly*100) : 0;
  return { totalTax, breakdown, napsa, nhima, net, effRate, monthly };
}

function getGratuity(basicPay, months){
  const totalEarnings = basicPay * months;
  const gratuity = totalEarnings * 0.25;
  return { totalEarnings, gratuity };
}

const fmt = (n) => 'K' + n.toLocaleString('en-ZM',{minimumFractionDigits:2, maximumFractionDigits:2});

// --- MESSAGE HANDLER ---
function handleMessage(rawText){
  const text = rawText.trim().toLowerCase();
  if(!text) return null;

  if(['hi','hello','hey','menu','start'].includes(text) || text.includes('help')){
    return `👋 *PAYE Tax Calculator 2026*
_by Chishimba Kabwe_

*Commands:*
1️⃣ *paye 15000* - Monthly gross K15,000
2️⃣ *annual 180000* - Annual gross
3️⃣ *12000* - Just type amount (assumes monthly)
4️⃣ *gratuity 12000 24* - Basic K12k x 24 months
5️⃣ *help* - Show this menu

Example: Send *paye 25000*`;
  }

  // Gratuity
  if(text.startsWith('gratuity') || text.startsWith('grat')){
    const parts = text.split(/\s+/);
    const basic = parseFloat(parts[1]);
    const months = parseFloat(parts[2]);
    if(!basic || !months || basic<0 || months<0){
      return `❌ Format: *gratuity [basic pay] [months]*\nExample: *gratuity 12000 24*`;
    }
    const { totalEarnings, gratuity } = getGratuity(basic, months);
    return `*🎁 Gratuity Summary*

Monthly Basic: ${fmt(basic)}
Months Worked: ${months}
Total Earnings: ${fmt(totalEarnings)}

*Gratuity (25%): ${fmt(gratuity)}*

_Note: 25% of total basic salary earnings._`;
  }

  // PAYE
  let monthly = null;
  let isAnnual = false;
  if(text.startsWith('annual')){
    const val = parseFloat(text.split(/\s+/)[1]);
    if(val){ monthly = val/12; isAnnual = true; }
  } else if(text.startsWith('paye')){
    const val = parseFloat(text.split(/\s+/)[1]);
    if(val) monthly = val;
  } else {
    const val = parseFloat(text.replace(/k|,|zmk/gi,''));
    if(!isNaN(val) && val>=0) monthly = val;
  }

  if(monthly!==null && monthly>=0){
    const { totalTax, breakdown, napsa, nhima, net, effRate } = getPayslip(monthly);
    const annualGross = monthly*12;

    let breakdownText = breakdown.map((b,i)=>{
      const rates = ['0%','20%','30%','37%'];
      return `${rates[i]} on ${b.label}: ${b.tax>0?fmt(b.tax):'-'}`;
    }).join('\n');

    return `*💰 PAYE Breakdown 2026*
${isAnnual?`(Annual K${(monthly*12).toLocaleString()} => Monthly ${fmt(monthly)})`:`Gross: ${fmt(monthly)} (Monthly)`}

${breakdownText}

*Total PAYE: ${fmt(totalTax)}*
NAPSA (5% capped K1,861.80): ${fmt(napsa)}
NHIMA (1%): ${fmt(nhima)}
-----------------------------
*NET PAY: ${fmt(net)}*
Annual Net: ${fmt(net*12)}

Effective Tax Rate: *${effRate.toFixed(2)}%*

_Type another amount or *gratuity 10000 24*_`;
  }

  return null;
}

// --- WEBHOOKS ---
app.get('/', (req,res)=> res.send('PAYE WhatsApp Bot by Chishimba Kabwe is running. Use /webhook for Meta verification.'));
app.get('/webhook', (req,res)=>{
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if(mode==='subscribe' && token===VERIFY_TOKEN){
    console.log('Webhook verified');
    res.status(200).send(challenge);
  } else res.sendStatus(403);
});

app.post('/webhook', async (req,res)=>{
  try{
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];
    if(!message) return res.sendStatus(200);

    const from = message.from;
    const text = message.text?.body || '';
    console.log(`Incoming from ${from}: ${text}`);

    const reply = handleMessage(text) || `🤔 I didn't understand.\nSend *help* for commands.\nExample: *paye 15000*`;

    if(TOKEN && PHONE_ID){
      await axios.post(`https://graph.facebook.com/v20.0/${PHONE_ID}/messages`,{
        messaging_product: "whatsapp",
        to: from,
        type: "text",
        text: { body: reply }
      },{ headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type':'application/json' } });
      console.log('Replied to', from);
    } else {
      console.log('Would reply:', reply);
    }
  } catch(e){
    console.error('Webhook error', e.response?.data || e.message);
  }
  res.sendStatus(200);
});

app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));
