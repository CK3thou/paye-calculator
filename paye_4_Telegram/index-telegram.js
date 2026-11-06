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

const bot = new Bot(token);

bot.command('start', (ctx) => {
  const firstName = ctx.from?.first_name || 'there';
  return ctx.reply(`Hello ${firstName}! Your Telegram bot is running.\nUse /help to see commands.`);
});

bot.command('help', (ctx) => {
  return ctx.reply('Available commands:\n/start\n/help');
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
