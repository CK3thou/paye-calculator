const fs = require('fs');
const path = require('path');
const { Bot } = require('node-telegram-bot-api');
const { run } = require('node-telegram-bot-api/node');

function readTokenFromEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^TELEGRAM_BOT_TOKEN\s*=\s*(.+)$/m);
    return match ? match[1].trim() : null;
  } catch (error) {
    return null;
  }
}

const token = process.env.TELEGRAM_BOT_TOKEN || readTokenFromEnvFile();

if (!token) {
  console.error('Missing TELEGRAM_BOT_TOKEN. Add it to .env or set it in the environment.');
  process.exit(1);
}

function calcPAYE(monthly) {
  const bands = [
    { limit: 5100, rate: 0 },
    { limit: 7100, rate: 0.20 },
    { limit: 9200, rate: 0.30 },
    { limit: 37000, rate: 0.37 },
    { limit: Infinity, rate: 0.395 },
  ];

  let remaining = monthly;
  let previousLimit = 0;
  let totalTax = 0;
  const breakdown = [];

  for (const band of bands) {
    if (remaining <= 0) break;
    const taxable = Math.min(remaining, band.limit - previousLimit);
    const tax = taxable * band.rate;
    totalTax += tax;
    breakdown.push({ ...band, taxable, tax });
    remaining -= taxable;
    previousLimit = band.limit;
  }

  return { totalTax, breakdown };
}

function formatCurrency(amount) {
  return `K${amount.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function handleText(text) {
  const input = text.trim();
  const annualMatch = input.match(/^(?:\/)?annual\s+([\d,]+(?:\.\d+)?)$/i);
  const monthlyMatch = input.match(/^(?:\/)?paye\s+([\d,]+(?:\.\d+)?)$/i);
  const amountMatch = input.match(/^(?:k|zmk)?\s*([\d,]+(?:\.\d+)?)$/i);
  let monthly;
  let isAnnual = false;

  if (annualMatch) {
    monthly = Number(annualMatch[1].replace(/,/g, '')) / 12;
    isAnnual = true;
  } else if (monthlyMatch) {
    monthly = Number(monthlyMatch[1].replace(/,/g, ''));
  } else if (amountMatch) {
    monthly = Number(amountMatch[1].replace(/,/g, ''));
  } else {
    return null;
  }

  if (!Number.isFinite(monthly) || monthly < 0 || monthly >= 10000000) {
    return 'Please enter a valid gross amount below K10,000,000.';
  }

  const { totalTax, breakdown } = calcPAYE(monthly);
  const napsa = Math.min(monthly * 0.05, 1861.80);
  const nhima = monthly * 0.01;
  const netPay = monthly - totalTax - napsa - nhima;
  const effectiveRate = monthly > 0 ? (totalTax / monthly * 100).toFixed(2) : '0.00';
  const labels = [
    '0% up to K5,100',
    '20% K5,100.01-K7,100',
    '30% K7,100.01-K9,200',
    '37% K9,200.01-K37,000',
    '39.5% K37,000.01 and above',
  ];
  const bandLines = labels.map((label, index) =>
    `${label}: ${formatCurrency(breakdown[index]?.tax || 0)}`
  );

  return `${isAnnual ? `Annual gross: ${formatCurrency(monthly * 12)}\n` : ''}Monthly gross: ${formatCurrency(monthly)}

${bandLines.join('\n')}

Total PAYE: ${formatCurrency(totalTax)}
NAPSA (5%, capped): ${formatCurrency(napsa)}
NHIMA (1%): ${formatCurrency(nhima)}
Net pay: ${formatCurrency(netPay)}
Effective PAYE rate: ${effectiveRate}%`;
}

const bot = new Bot(token);

bot.command('start', (ctx) => {
  const firstName = ctx.from?.first_name || 'there';
  return ctx.reply(
    `Hello ${firstName}! Send a monthly gross amount (for example 38000), /paye 38000, or /annual 456000.\n` +
    'Top PAYE band: 39.5% on K37,000.01 and above. Use /help for details.'
  );
});

bot.command('help', (ctx) => {
  return ctx.reply(
    'PAYE calculator commands:\n' +
    '/paye 38000 - calculate monthly gross\n' +
    '/annual 456000 - calculate annual gross\n' +
    'Or send a monthly amount, such as 38000.\n\n' +
    'PAYE bands: 0% up to K5,100; 20% to K7,100; 30% to K9,200; ' +
    '37% to K37,000; 39.5% on K37,000.01 and above.'
  );
});

bot.on('message', (ctx) => {
  const text = ctx.message?.text;
  if (!text || text.startsWith('/start') || text.startsWith('/help')) return;

  const response = handleText(text);
  return ctx.reply(response || 'Send a gross amount, /paye 38000, or /annual 456000. Use /help for the PAYE bands.');
});

bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  if (ctx) {
    console.error('Update context:', ctx.update?.update_id ?? 'unknown');
  }
});

console.log('Telegram bot starting...');

run(bot).catch((error) => {
  console.error('Failed to start Telegram bot:', error);
  process.exit(1);
});
