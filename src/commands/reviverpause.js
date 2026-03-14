const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { hasManageGuild } = require('../utils/permissions');

module.exports = {
  name: 'reviverpause',
  async prefix({ message, store, args }) {
    if (!hasManageGuild(message.member)) return;
    const mode = (args[0] || '').toLowerCase();
    if (!['on', 'off'].includes(mode)) return replyPrefix(message, makeEmbed('<:draven_rev_pandr:1477349306078855188> Reviver Pause', 'Use: reviverpause <on|off>'));
    const paused = mode === 'on';
    await store.setReviverPaused(message.guild.id, paused);
    await replyPrefix(message, makeEmbed('<:draven_rev_pandr:1477349306078855188> Reviver Pause', paused ? 'Reviver paused.' : 'Reviver resumed.'));
  },
  async slash({ interaction, store }) {
    if (!hasManageGuild(interaction.memberPermissions)) return replySlash(interaction, makeEmbed('<:draven_no_permission:1477349273535385776> Permission Denied', 'Manage Server is required.'));
    const mode = interaction.options.getString('mode', true).toLowerCase();
    const paused = mode === 'on';
    await store.setReviverPaused(interaction.guildId, paused);
    await replySlash(interaction, makeEmbed('<:draven_rev_pandr:1477349306078855188> Reviver Pause', paused ? 'Reviver paused.' : 'Reviver resumed.'));
  },
};
