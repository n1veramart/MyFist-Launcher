const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { hasManageGuild } = require('../utils/permissions');

function encode(obj) {
  return Buffer.from(JSON.stringify(obj), 'utf8').toString('base64');
}

module.exports = {
  name: 'backupconfig',
  async prefix({ message, store }) {
    if (!hasManageGuild(message.member)) return;
    const payload = encode(store.backupGuildConfig(message.guild.id));
    await replyPrefix(message, makeEmbed('<:draven_utility:1477349327092322377> Backup Config', `Copy this backup string:\n\`\`\`${payload.slice(0, 900)}\`\`\``));
  },
  async slash({ interaction, store }) {
    if (!hasManageGuild(interaction.memberPermissions)) return replySlash(interaction, makeEmbed('<:draven_no_permission:1477349273535385776> Permission Denied', 'Manage Server is required.'));
    const payload = encode(store.backupGuildConfig(interaction.guildId));
    await replySlash(interaction, makeEmbed('<:draven_utility:1477349327092322377> Backup Config', `Copy this backup string:\n\`\`\`${payload.slice(0, 900)}\`\`\``));
  },
};
