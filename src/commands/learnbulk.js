const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { hasManageGuild } = require('../utils/permissions');

function parseBulk(text) {
  return String(text || '')
    .split(/\n|\|\|/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split('|').map((x) => x.trim()))
    .filter((pair) => pair.length >= 2 && pair[0] && pair[1])
    .map(([q, a]) => ({ question: q, answer: a }));
}

module.exports = {
  name: 'learnbulk',
  async prefix({ message, store, argText }) {
    if (!hasManageGuild(message.member)) return;
    const entries = parseBulk(argText);
    if (!entries.length) return replyPrefix(message, makeEmbed('<:draven_productivity:1477349287796146216> Learn Bulk', 'Use lines in `question | answer` format (or separate entries with `||`).'));
    for (const e of entries) await store.learnFaq(message.guild.id, e.question, e.answer);
    await replyPrefix(message, makeEmbed('<:draven_productivity:1477349287796146216> Learn Bulk', `Imported **${entries.length}** FAQ entries.`));
  },
  async slash({ interaction, store }) {
    if (!hasManageGuild(interaction.memberPermissions)) return replySlash(interaction, makeEmbed('<:draven_no_permission:1477349273535385776> Permission Denied', 'Manage Server is required.'));
    const payload = interaction.options.getString('entries', true);
    const entries = parseBulk(payload);
    if (!entries.length) return replySlash(interaction, makeEmbed('<:draven_productivity:1477349287796146216> Learn Bulk', 'No valid entries found. Use `question | answer` per line.'));
    for (const e of entries) await store.learnFaq(interaction.guildId, e.question, e.answer);
    await replySlash(interaction, makeEmbed('<:draven_productivity:1477349287796146216> Learn Bulk', `Imported **${entries.length}** FAQ entries.`));
  },
};
