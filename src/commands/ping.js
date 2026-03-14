const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');

module.exports = {
  name: 'ping',
  async prefix({ message, client }) {
    await replyPrefix(message, makeEmbed('<:draven_utility:1477349327092322377> Ping', `Latency: \`${Math.round(client.ws.ping)}ms\``));
  },
  async slash({ interaction, client }) {
    await replySlash(interaction, makeEmbed('<:draven_utility:1477349327092322377> Ping', `Latency: \`${Math.round(client.ws.ping)}ms\``));
  },
};
