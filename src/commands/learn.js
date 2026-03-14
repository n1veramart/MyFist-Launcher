const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { hasManageGuild } = require('../utils/permissions');

module.exports = {
  name: 'learn',
  async prefix({ message, store, argText }) {
    if (!hasManageGuild(message.member)) return;
    if (!argText.includes('|')) return replyPrefix(message, makeEmbed('<:draven_productivity:1477349287796146216> Learn', 'Use `question | answer` format.'));
    const [question, answer] = argText.split('|').map((s) => s.trim());
    await store.learnFaq(message.guild.id, question, answer);
    await replyPrefix(message, makeEmbed('<:draven_productivity:1477349287796146216> Learn', 'FAQ entry stored.'));
  },
  async slash({ interaction, store }) {
    if (!hasManageGuild(interaction.memberPermissions)) return replySlash(interaction, makeEmbed('<:draven_no_permission:1477349273535385776> Permission Denied', 'Manage Server is required.'));
    const question = interaction.options.getString('question', true);
    const answer = interaction.options.getString('answer', true);
    await store.learnFaq(interaction.guildId, question, answer);
    await replySlash(interaction, makeEmbed('<:draven_productivity:1477349287796146216> Learn', 'FAQ entry stored.'));
  },
};
