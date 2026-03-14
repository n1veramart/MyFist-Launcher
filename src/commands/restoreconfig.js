const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { hasManageGuild } = require('../utils/permissions');

function decode(input) {
  try {
    const raw = Buffer.from(String(input || '').trim(), 'base64').toString('utf8');
    return JSON.parse(raw);
  } catch {
    try { return JSON.parse(String(input || '').trim()); } catch { return null; }
  }
}

module.exports = {
  name: 'restoreconfig',
  async prefix({ message, store, argText }) {
    if (!hasManageGuild(message.member)) return;
    const data = decode(argText);
    if (!data) return replyPrefix(message, makeEmbed('<:draven_utility:1477349327092322377> Restore Config', 'Invalid backup payload.'));
    await store.restoreGuildConfig(message.guild.id, data);
    await replyPrefix(message, makeEmbed('<:draven_utility:1477349327092322377> Restore Config', 'Configuration restored successfully.'));
  },
  async slash({ interaction, store }) {
    if (!hasManageGuild(interaction.memberPermissions)) return replySlash(interaction, makeEmbed('<:draven_no_permission:1477349273535385776> Permission Denied', 'Manage Server is required.'));
    const payload = interaction.options.getString('payload', true);
    const data = decode(payload);
    if (!data) return replySlash(interaction, makeEmbed('<:draven_utility:1477349327092322377> Restore Config', 'Invalid backup payload.'));
    await store.restoreGuildConfig(interaction.guildId, data);
    await replySlash(interaction, makeEmbed('<:draven_utility:1477349327092322377> Restore Config', 'Configuration restored successfully.'));
  },
};
