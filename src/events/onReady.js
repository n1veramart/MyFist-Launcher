const { ActivityType } = require('discord.js');
const { registerCommands } = require('../loaders/registerCommands');
const { log } = require('../utils/logger');

function registerOnReady(client, store, reviverService) {
  client.once('ready', async () => {
    log(`Logged in as ${client.user.tag}`);
    await store.warmCache();
    await registerCommands(client);
    reviverService.start();

    client.user.setActivity('=help or /help', { type: ActivityType.Streaming });
    log('Slash commands synced');
  });
}

module.exports = { registerOnReady };
