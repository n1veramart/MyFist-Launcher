const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { hasManageGuild } = require('../utils/permissions');

async function remove(guildId, byIndex, byQuestion, store) {
  if (Number.isInteger(byIndex)) return store.deleteFaqByIndex(guildId, byIndex);
  if (byQuestion) return store.deleteFaqByQuestion(guildId, byQuestion);
  return null;
}

module.exports = {
  name: 'faqdelete',
  async prefix({ message, store, args, argText }) {
    if (!hasManageGuild(message.member)) return;
    const maybeIndex = Number(args[0]);
    const removed = await remove(message.guild.id, Number.isInteger(maybeIndex) && maybeIndex > 0 ? maybeIndex - 1 : null, Number.isInteger(maybeIndex) ? null : argText, store);
    if (!removed) return replyPrefix(message, makeEmbed('<:draven_productivity:1477349287796146216> FAQ Delete', 'Use: faqdelete <index> OR faqdelete <exact question text>'));
    await replyPrefix(message, makeEmbed('<:draven_productivity:1477349287796146216> FAQ Delete', `Deleted FAQ:\nQ: ${removed.question}`));
  },
  async slash({ interaction, store }) {
    if (!hasManageGuild(interaction.memberPermissions)) return replySlash(interaction, makeEmbed('<:draven_no_permission:1477349273535385776> Permission Denied', 'Manage Server is required.'));
    const index = interaction.options.getInteger('index');
    const question = interaction.options.getString('question');
    const removed = await remove(interaction.guildId, Number.isInteger(index) && index > 0 ? index - 1 : null, question, store);
    if (!removed) return replySlash(interaction, makeEmbed('<:draven_productivity:1477349287796146216> FAQ Delete', 'Provide a valid index/question for an existing FAQ entry.'));
    await replySlash(interaction, makeEmbed('<:draven_productivity:1477349287796146216> FAQ Delete', `Deleted FAQ:\nQ: ${removed.question}`));
  },
};
