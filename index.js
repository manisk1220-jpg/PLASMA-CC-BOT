const http = require("http");

const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Discord bot is running.");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`HTTP server listening on port ${PORT}`);
});

const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages],
  partials: ["CHANNEL"]
});

const CARDS_FILE = "./cards.js";
const CLAIMS_FILE = "./claims.json";

function readCards() {
  if (!fs.existsSync(CARDS_FILE)) return [];
  return fs.readFileSync(CARDS_FILE, "utf8")
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("//"))
    .map((line, index) => {
      const [number, month, year, pin] = line.split("|");
      return { id: `card-${index + 1}`, number, month, year, pin };
    })
    .filter(card => card.number && card.month && card.year && card.pin);
}

function readClaims() {
  if (!fs.existsSync(CLAIMS_FILE)) {
    fs.writeFileSync(CLAIMS_FILE, "{}");
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(CLAIMS_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeClaims(data) {
  fs.writeFileSync(CLAIMS_FILE, JSON.stringify(data, null, 2));
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.trim().startsWith("!")) return;

  const args = message.content.trim().split(/\s+/);
  const command = args[0].toLowerCase();

  if (command === "!deploycc") {
    const claims = readClaims();

    if (claims[message.author.id]) {
      return message.reply("❌ You have already received your test card. Each user can receive only one card.");
    }

    const cards = readCards();
    const usedIds = new Set(Object.values(claims).map(c => c.cardId));
    const card = cards.find(c => !usedIds.has(c.id));

    if (!card) return message.reply("❌ No test cards are available right now.");

    try {
      await message.author.send(
        `# CARD INFO\n` +
        `💳 **CARD NUMBER:** \`${card.number}\`\n` +
        `📅 **CARD DATE:** \`${card.month}/${card.year}\`\n` +
        `🔒 **CARD PIN:** \`${card.pin}\`\n\n` +
        `⚠️ **TEST/DEMO CARD — NO REAL FUNDS OR PAYMENT CAPABILITY**`
      );
    } catch {
      return message.reply("❌ I couldn't DM you. Please enable DMs from server members and try again.");
    }

    claims[message.author.id] = {
      cardId: card.id,
      claimedAt: new Date().toISOString()
    };

    writeClaims(claims);
    return message.reply("✅ **Card info sent in your DM!** 📩");
  }

  if (command === "!stock") {
    const cards = readCards();
    const claims = readClaims();
    const usedIds = new Set(Object.values(claims).map(c => c.cardId));
    const available = cards.filter(c => !usedIds.has(c.id)).length;
    return message.reply(`📦 Available test cards: **${available}**`);
  }

  if (command === "!resetuser") {
    if (!message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Administrator permission required.");
    }

    const user = message.mentions.users.first();
    if (!user) return message.reply("Usage: `!resetuser @user`");

    const claims = readClaims();
    if (!claims[user.id]) return message.reply("❌ That user has no card claim.");

    delete claims[user.id];
    writeClaims(claims);

    return message.reply(`✅ Test-card claim reset for ${user}.`);
  }

  if (command === "!helpcc") {
    return message.reply(
      "**Test Card Bot Commands**\n" +
      "`!deploycc` — receive one test card by DM\n" +
      "`!stock` — show remaining test cards\n" +
      "`!resetuser @user` — admin: allow a user to claim again"
    );
  }
});

client.login(process.env.DISCORD_TOKEN);
