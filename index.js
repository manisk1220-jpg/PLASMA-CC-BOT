const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: ["CHANNEL"]
});

const CARDS_FILE = "./cards.json";
const CLAIMS_FILE = "./claims.json";

function readJson(file, fallback) {
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.trim().toLowerCase().startsWith("!")) return;

  const args = message.content.trim().split(/\s+/);
  const command = args[0].toLowerCase();

  if (command === "!deploycc") {
    const claims = readJson(CLAIMS_FILE, {});

    // One card per Discord user, even across servers.
    if (claims[message.author.id]) {
      return message.reply("❌ You have already received your test card. Each user can receive only one card.");
    }

    const cards = readJson(CARDS_FILE, []);
    const availableIndex = cards.findIndex(card => !card.used);

    if (availableIndex === -1) {
      return message.reply("❌ No test cards are available right now.");
    }

    const card = cards[availableIndex];

    try {
      await message.author.send(
        `# CARD INFO\n` +
        `💳 **CARD NUMBER:** \`${card.number}\`\n` +
        `📅 **CARD DATE:** \`${card.month}/${card.year}\`\n` +
        `🔒 **CARD PIN:** \`${card.pin}\`\n\n` +
        `⚠️ TEST/DEMO CARD — NO REAL FUNDS OR PAYMENT CAPABILITY`
      );
    } catch (err) {
      return message.reply("❌ I couldn't DM you. Please enable DMs from server members and try again.");
    }

    card.used = true;
    card.claimedBy = message.author.id;
    card.claimedAt = new Date().toISOString();
    claims[message.author.id] = {
      cardId: card.id,
      claimedAt: card.claimedAt
    };

    writeJson(CARDS_FILE, cards);
    writeJson(CLAIMS_FILE, claims);

    await message.reply("✅ **Card info sent in your DM!** 📩");
  }

  if (command === "!stock") {
    const cards = readJson(CARDS_FILE, []);
    const available = cards.filter(card => !card.used).length;
    return message.reply(`📦 Available test cards: **${available}**`);
  }

  if (command === "!resetuser") {
    if (!message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Administrator permission required.");
    }

    const user = message.mentions.users.first();
    if (!user) return message.reply("Usage: `!resetuser @user`");

    const claims = readJson(CLAIMS_FILE, {});
    if (!claims[user.id]) return message.reply("❌ That user has no card claim.");

    const cards = readJson(CARDS_FILE, []);
    const card = cards.find(c => c.id === claims[user.id].cardId);

    if (card) {
      card.used = false;
      card.claimedBy = null;
      card.claimedAt = null;
      writeJson(CARDS_FILE, cards);
    }

    delete claims[user.id];
    writeJson(CLAIMS_FILE, claims);

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
