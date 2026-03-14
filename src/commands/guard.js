const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { hasManageGuild } = require('../utils/permissions');
const { sendDravenLog } = require('../utils/dravenlogs');

module.exports = {
  name: 'guard',
  async prefix({ message, store, args }) {
    if (!hasManageGuild(message.member)) return;
    const mode = (args[0] || '').toLowerCase();
    if (!['on', 'off'].includes(mode)) return replyPrefix(message, makeEmbed('<:draven_security:1477349313482063912> Guard Status', 'Use `on` or `off`.'));
    await store.setGuard(message.guild.id, mode === 'on');
    await sendDravenLog(message.guild, store, 'GUARD_TOGGLE', `By <@${message.author.id}>\nNew status: **${mode.toUpperCase()}**`);
    await replyPrefix(message, makeEmbed('<:draven_security:1477349313482063912> Guard Status', `Auto-monitoring is now **${mode === 'on' ? 'enabled' : 'disabled'}**.`));
  },
  async slash({ interaction, store }) {
    if (!hasManageGuild(interaction.memberPermissions)) return replySlash(interaction, makeEmbed('<:draven_no_permission:1477349273535385776> Permission Denied', 'Manage Server is required.'));
    const mode = interaction.options.getString('mode', true).toLowerCase();
    if (!['on', 'off'].includes(mode)) return replySlash(interaction, makeEmbed('<:draven_security:1477349313482063912> Guard Status', 'Use `on` or `off`.'));
    await store.setGuard(interaction.guildId, mode === 'on');
    await sendDravenLog(interaction.guild, store, 'GUARD_TOGGLE', `By <@${interaction.user.id}>\nNew status: **${mode.toUpperCase()}**`);
    await replySlash(interaction, makeEmbed('<:draven_security:1477349313482063912> Guard Status', `Auto-monitoring is now **${mode === 'on' ? 'enabled' : 'disabled'}**.`));
  },
};
