const { DISCORD_TOKEN } = require('./config/env');
const { createApp } = require('./app');

if (!DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is required');

const { client } = createApp();
client.login(DISCORD_TOKEN);
