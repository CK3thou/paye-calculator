// ALTERNATIVE: No Meta approval needed - uses your personal WhatsApp via QR code
// npm install whatsapp-web.js qrcode-terminal
// Run: node qr-version.js
// Then scan QR with your phone. Your WhatsApp becomes the bot.

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

function calcPAYE(monthly){
  const bands = [{limit:5100,rate:0},{limit:7100,rate:0.20},{limit:9200,rate:0.30},{limit:37000,rate:0.37},{limit:Infinity,rate:0.395}];
  let rem=monthly, prev=0, tax=0;
  const breakdown=[];
  for(const b of bands){
    if(rem<=0) break;
    const taxable = Math.min(rem, b.limit-prev);
    const t = taxable*b.rate; tax+=t; breakdown.push(t); rem-=taxable; prev=b.limit;
  }
  return {tax, breakdown};
}
const fmt = (n)=> 'K'+n.toLocaleString('en-ZM',{minimumFractionDigits:2});
function handleMessage(text){
  const lower = text.toLowerCase().trim();
  if(['hi','hello','help','menu'].includes(lower)){
    return `👋 PAYE Calculator 2026\nCommands:\npaye 15000\nannual 180000\ngratuity 12000 24\nTop PAYE band: 39.5% on K37,000.01 and above`;
  }
  let monthly=null;
  if(lower.startsWith('paye')) monthly=parseFloat(lower.split(' ')[1]);
  else if(lower.startsWith('annual')) monthly=parseFloat(lower.split(' ')[1])/12;
  else if(lower.startsWith('gratuity')){
    const p=lower.split(' '); const basic=parseFloat(p[1]), months=parseFloat(p[2]);
    if(basic&&months) return `Gratuity: ${fmt(basic*months*0.25)} (25% of ${fmt(basic*months)})`;
  } else {
    const v=parseFloat(lower); if(!isNaN(v)) monthly=v;
  }
  if(monthly!==null){
    const {tax,breakdown}=calcPAYE(monthly);
    const napsa=Math.min(monthly*0.05,1861.80); const nhima=monthly*0.01;
    const net=monthly-tax-napsa-nhima;
    return `PAYE Breakdown ${fmt(monthly)}\n0% up to K5,100: ${fmt(breakdown[0]||0)}\n20% K5,100.01-K7,100: ${fmt(breakdown[1]||0)}\n30% K7,100.01-K9,200: ${fmt(breakdown[2]||0)}\n37% K9,200.01-K37,000: ${fmt(breakdown[3]||0)}\n39.5% K37,000.01 and above: ${fmt(breakdown[4]||0)}\nTotal PAYE ${fmt(tax)}\nNAPSA ${fmt(napsa)}\nNHIMA ${fmt(nhima)}\nNET ${fmt(net)}`;
  }
  return null;
}

const client = new Client({ authStrategy: new LocalAuth() });
client.on('qr', qr => qrcode.generate(qr, {small:true}));
client.on('ready', ()=> console.log('QR Bot ready!'));
client.on('message', async msg=>{
  const reply = handleMessage(msg.body);
  if(reply) msg.reply(reply);
});
client.initialize();
