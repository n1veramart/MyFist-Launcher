const { Client, GatewayIntentBits } = require('discord.js');
const { registerEvents } = require('./events');
const { DataStore } = require('./services/dataStore');
const { AIService } = require('./services/aiService');
const { ReviverService } = require('./services/reviverService');

function createApp() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent,
    ],
  });

  const store = new DataStore();
  const ai = new AIService();
  const reviverService = new ReviverService(client, store, ai);

  registerEvents(client, store, ai, reviverService);
  return { client };
}

module.exports = { createApp };
