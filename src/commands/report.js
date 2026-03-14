const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');

module.exports = {
  name: 'report',
  async prefix({ message, store, argText }) {
    const target = message.mentions.users.first();
    if (!argText) return replyPrefix(message, makeEmbed('<:draven_security:1477349313482063912> Report', 'Provide a user or link to report.'));
    await store.addReport(message.guild.id, message.author.id, target?.id, argText);
    await replyPrefix(message, makeEmbed('<:draven_security:1477349313482063912> Report Logged', 'Your report has been recorded silently.'));
  },
  async slash({ interaction, store }) {
    const user = interaction.options.getUser('user');
    const link = interaction.options.getString('link');
    const payload = [user ? `user:${user.id}` : null, link].filter(Boolean).join(' | ');
    if (!payload) return replySlash(interaction, makeEmbed('<:draven_security:1477349313482063912> Report', 'Provide a user or link to report.'));
    await store.addReport(interaction.guildId, interaction.user.id, user?.id, payload);
    await replySlash(interaction, makeEmbed('<:draven_security:1477349313482063912> Report Logged', 'Your report has been recorded silently.'));
  },
};
