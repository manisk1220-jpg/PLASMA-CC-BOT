# Discord Test Card Bot v2

## Flow

User types `!deploycc` in a Discord server.

Bot replies in the server:

> ✅ Card info sent in your DM! 📩

Then the bot sends the user:

# CARD INFO
💳 CARD NUMBER: `...`
📅 CARD DATE: `12/2030`
🔒 CARD PIN: `....`

Each Discord user can receive only one test card.

## Commands

- `!deploycc` — send one unused test/demo card to the user's DM
- `!stock` — show remaining stock
- `!resetuser @user` — administrator can reset a user's claim
- `!helpcc` — show commands

## Render

Build command:
`npm install`

Start command:
`npm start`

Environment variable:
`DISCORD_TOKEN=your_discord_bot_token`

Do not put the Discord token in GitHub.

## Discord Developer Portal

Enable the **Message Content Intent** for the bot because this bot reads `!deploycc` message commands.

The included card values are test/demo values only. Do not replace them with real payment-card credentials.
