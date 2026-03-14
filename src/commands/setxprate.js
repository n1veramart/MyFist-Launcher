const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { hasManageGuild } = require('../utils/permissions');

function validate(...vals) { return vals.every((v) => Number.isFinite(v) && v > 0 && v <= 500); }

module.exports = {
  name: 'setxprate',
  async prefix({ message, store, args }) {
    if (!hasManageGuild(message.member)) return;
    const [m, d, q] = args.map(Number);
    if (!validate(m, d, q)) return replyPrefix(message, makeEmbed('<:draven_xp:1477349339499204770> XP Rates', 'Use: setxprate <message_xp> <daily_xp> <quest_xp> (1-500 each)'));
    await store.setXpRates(message.guild.id, m, d, q);
    await replyPrefix(message, makeEmbed('<:draven_xp:1477349339499204770> XP Rates', `Updated rates\nMessage: ${m} XP\nDaily: ${d} XP\nQuest: ${q} XP`));
  },
  async slash({ interaction, store }) {
    if (!hasManageGuild(interaction.memberPermissions)) return replySlash(interaction, makeEmbed('<:draven_no_permission:1477349273535385776> Permission Denied', 'Manage Server is required.'));
    const m = interaction.options.getInteger('message_xp', true);
    const d = interaction.options.getInteger('daily_xp', true);
    const q = interaction.options.getInteger('quest_xp', true);
    if (!validate(m, d, q)) return replySlash(interaction, makeEmbed('<:draven_xp:1477349339499204770> XP Rates', 'Each value must be between 1 and 500.'));
    await store.setXpRates(interaction.guildId, m, d, q);
    await replySlash(interaction, makeEmbed('<:draven_xp:1477349339499204770> XP Rates', `Updated rates\nMessage: ${m} XP\nDaily: ${d} XP\nQuest: ${q} XP`));
  },
};
