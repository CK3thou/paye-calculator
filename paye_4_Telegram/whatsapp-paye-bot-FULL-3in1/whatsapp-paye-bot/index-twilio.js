require('dotenv').config();
const express = require('express');
const app = express();

// Twilio needs urlencoded, not json
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// --- CORE TAX LOGIC (Zambia 2026) ---
function calcPAYE(monthly){
  const bands = [
    { limit: 5100, rate: 0 },
    { limit: 7100, rate: 0.20 },
    { limit: 9200, rate: 0.30 },
    { limit: 37000, rate: 0.37 },
    { limit: Infinity, rate: 0.395 },
  ];
  let rem=monthly, prev=0, tax=0, breakdown=[];
  for(const b of bands){
    if(rem<=0) break;
    const taxable = Math.min(rem, b.limit-prev);
    const t = taxable * b.rate;
    tax+=t;
    breakdown.push(t);
    rem-=taxable; prev=b.limit;
  }
  return {tax, breakdown};
}

const fmt = (n) => 'K' + n.toLocaleString('en-ZM',{minimumFractionDigits:2, maximumFractionDigits:2});

function handleMessage(text){
  const raw = text.trim();
  const lower = raw.toLowerCase();

  if(['hi','hello','hey','menu','start','help','hallo'].includes(lower)){
    return `👋 *PAYE Tax Calculator 2026*\n_by Chishimba Kabwe_\n\nCommands:\n• *paye 15000* - Monthly gross\n• *annual 180000* - Annual\n• *15000* - Just type amount\n• *gratuity 12000 24* - Basic + months\n\nTop PAYE band: *39.5% on K37,000.01 and above*\n\nTry: paye 25000`;
  }

  if(lower.startsWith('gratuity') || lower.startsWith('grat')){
    const parts = lower.split(/\s+/);
    const basic = parseFloat(parts[1]);
    const months = parseFloat(parts[2]);
    if(!basic || !months) return `❌ Format: *gratuity 12000 24*`;
    const total = basic*months;
    const grat = total*0.25;
    return `*🎁 Gratuity Summary*\n\nMonthly Basic: ${fmt(basic)}\nMonths: ${months}\nTotal Earnings: ${fmt(total)}\n\n*Gratuity 25%: ${fmt(grat)}*`;
  }

  let monthly=null, isAnnual=false;
  if(lower.startsWith('annual')){ const v=parseFloat(lower.split(/\s+/)[1]); if(v) {monthly=v/12; isAnnual=true;} }
  else if(lower.startsWith('paye')){ const v=parseFloat(lower.split(/\s+/)[1]); if(v) monthly=v; }
  else { const v=parseFloat(lower.replace(/k|,|zmk/gi,'')); if(!isNaN(v)) monthly=v; }

  if(monthly!==null && monthly>=0){
    const {tax,breakdown}=calcPAYE(monthly);
    const napsa=Math.min(monthly*0.05,1861.80);
    const nhima=monthly*0.01;
    const net=monthly-tax-napsa-nhima;
    const eff=(monthly>0?tax/monthly*100:0).toFixed(2);
    return `*💰 PAYE Breakdown 2026*\nGross: ${fmt(monthly)} ${isAnnual?'(from annual)':'(Monthly)'}\n\n0% on first 5,100: ${fmt(breakdown[0]||0)}\n20% on 5,100-7,100: ${fmt(breakdown[1]||0)}\n30% on 7,100-9,200: ${fmt(breakdown[2]||0)}\n37% on 9,200.01-37,000: ${fmt(breakdown[3]||0)}\n39.5% on 37,000.01 and above: ${fmt(breakdown[4]||0)}\n\n*Total PAYE: ${fmt(tax)}*\nNAPSA (5% capped): ${fmt(napsa)}\nNHIMA (1%): ${fmt(nhima)}\n----------------\n*NET PAY: ${fmt(net)}*\nEff Rate: ${eff}%`;
  }
  return `🤔 Didn't get that. Type *help*. Example: *paye 15000*`;
}

// Twilio Webhook
app.post('/whatsapp', (req,res)=>{
  const incomingMsg = req.body.Body || '';
  const reply = handleMessage(incomingMsg);
  
  // Twilio expects TwiML
  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${reply}</Message></Response>`;
  res.type('text/xml').send(twiml);
});

app.get('/', (req,res)=> res.send('Twilio PAYE Bot Running. POST to /whatsapp'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Twilio bot running on ${PORT}`));
