require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
if(!token){
  console.error("Missing TELEGRAM_BOT_TOKEN in .env");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
console.log("🇿🇲 PAYE Telegram Bot running... by Chishimba Kabwe");

// --- CORE TAX LOGIC ---
function calcPAYE(monthly){
  const bands = [
    { limit: 5100, rate: 0, label: 'First K5,100.00' },
    { limit: 7100, rate: 0.20, label: 'K5,100.01 - K7,100.00' },
    { limit: 9200, rate: 0.30, label: 'K7,100.01 - K9,200.00' },
    { limit: 37000, rate: 0.37, label: 'K9,200.01 - K37,000.00' },
    { limit: Infinity, rate: 0.39, label: 'Above K37,000.00' }
  ];
  let rem=monthly, prev=0, tax=0, breakdown=[];
  for(const b of bands){
    if(rem<=0) break;
    const taxable = Math.min(rem, b.limit-prev);
    const t = taxable*b.rate;
    tax+=t;
    breakdown.push({...b, taxable, tax: t});
    rem-=taxable; prev=b.limit;
  }
  return {tax, breakdown};
}

function getGratuity(basic, months){
  const total = basic*months;
  return { total, grat: total*0.25 };
}

const fmt = (n) => 'K' + n.toLocaleString('en-ZM',{minimumFractionDigits:2, maximumFractionDigits:2});

function buildMenu(){
  return {
    reply_markup: {
      keyboard: [
        [{text: "💰 PAYE 15,000"}, {text: "💰 PAYE 25,000"}],
        [{text: "📅 Annual 180,000"}, {text: "🎁 Gratuity Example"}],
        [{text: "❓ Help"}]
      ],
      resize_keyboard: true
    }
  };
}

function handleText(text){
  const lower = text.toLowerCase().trim();

  if(['hi','hello','hey','/start','start','help','❓ help'].includes(lower)){
    return `👋 *PAYE Tax Calculator 2026*
_by Chishimba Kabwe_

Zambia ZRA Rates:
• 0% up to K5,100
• 20% K5,100 - K7,100
• 30% K7,100 - K9,200
• 37% K9,200.01 - K37,000
• 39% above K37,000
• NAPSA 5% capped K1,861.80
• NHIMA 1%

*Commands:*
• Just type amount: \`15000\`
• \`paye 15000\` - monthly
• \`annual 180000\` - annual gross
• \`gratuity 12000 24\` - basic + months

Try typing 25000`;
  }

  if(lower.includes('gratuity example') || lower.startsWith('gratuity') || lower.startsWith('grat')){
    if(lower.includes('example')){
      return `Send like:\n\`gratuity 12000 24\`\n\nMeans: Basic K12,000 x 24 months`;
    }
    const parts = lower.split(/\s+/);
    const basic = parseFloat(parts[1]);
    const months = parseFloat(parts[2]);
    if(!basic || !months) return `❌ Format: \`gratuity 12000 24\`\nBasic pay + months worked`;
    const { total, grat } = getGratuity(basic, months);
    return `*🎁 Gratuity Summary*

Monthly Basic: ${fmt(basic)}
Months: ${months}
Total Earnings: ${fmt(total)}

*Gratuity (25%): ${fmt(grat)}*`;
  }

  let monthly=null, isAnnual=false;
  if(lower.startsWith('annual') || lower.includes('annual')){
    const v=parseFloat(lower.replace(/[^0-9.]/g,''));
    if(v){ monthly=v/12; isAnnual=true; }
  } else if(lower.startsWith('paye') || lower.includes('paye')){
    const v=parseFloat(lower.replace(/[^0-9.]/g,''));
    if(v) monthly=v;
  } else if(lower.includes('💰')){
    const v=parseFloat(lower.replace(/[^0-9.]/g,''));
    if(v) monthly=v;
  } else {
    const v=parseFloat(lower.replace(/k|,|zmk/gi,''));
    if(!isNaN(v) && v>=0) monthly=v;
  }

  if(monthly!==null && monthly>=0 && monthly<10000000){
    const {tax,breakdown}=calcPAYE(monthly);
    const napsa=Math.min(monthly*0.05,1861.80);
    const nhima=monthly*0.01;
    const net=monthly-tax-napsa-nhima;
    const eff=(monthly>0?tax/monthly*100:0).toFixed(2);

    return `*💰 PAYE Breakdown 2026*
${isAnnual?`Annual K${(monthly*12).toLocaleString()} => Monthly ${fmt(monthly)}`:`Gross: ${fmt(monthly)}`}

`+
    `*0%* on ${breakdown[0]?.label}: ${fmt(breakdown[0]?.tax||0)}
`+
    `*20%* on ${breakdown[1]?.label}: ${fmt(breakdown[1]?.tax||0)}
`+
    `*30%* on ${breakdown[2]?.label}: ${fmt(breakdown[2]?.tax||0)}
`+
    `*37%* on ${breakdown[3]?.label}: ${fmt(breakdown[3]?.tax||0)}
`+
    `*39%* on ${breakdown[4]?.label}: ${fmt(breakdown[4]?.tax||0)}

`+
    `*Total PAYE: ${fmt(tax)}*
NAPSA (5% capped): ${fmt(napsa)}
NHIMA (1%): ${fmt(nhima)}
----------------
*NET PAY: ${fmt(net)}*
Annual Net: ${fmt(net*12)}

Effective Rate: *${eff}%*`;
  }
  return null;
}

bot.onText(/.*/, async (msg)=>{
  const chatId = msg.chat.id;
  const text = msg.text || '';
  
  // Ignore commands handled elsewhere
  if(text.startsWith('/')) return;

  const reply = handleText(text);
  if(reply){
    bot.sendMessage(chatId, reply, { parse_mode: 'Markdown', ...buildMenu() });
  } else {
    bot.sendMessage(chatId, `🤔 Didn't get that. Try:\n\`paye 15000\` or just \`15000\`\nType /start for menu`, { parse_mode: 'Markdown', ...buildMenu() });
  }
});

bot.onText(/\/start/, (msg)=>{
  const chatId = msg.chat.id;
  const welcome = handleText('/start');
  bot.sendMessage(chatId, welcome, { parse_mode: 'Markdown', ...buildMenu() });
});

bot.onText(/\/help/, (msg)=>{
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, handleText('help'), { parse_mode: 'Markdown', ...buildMenu() });
});
