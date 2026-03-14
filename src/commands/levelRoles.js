const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');

function build(guildId, store) {
  const lines = store.getLevelRoles(guildId).map((x) => `<@&${x.roleId}> → ${x.requiredXp} XP`);
  return makeEmbed('<:draven_xp:1477349339499204770> Level Roles', lines.join('\n') || 'No level roles configured.');
}

module.exports = {
  name: 'levelroles',
  async prefix({ message, store }) { await replyPrefix(message, build(message.guild.id, store)); },
  async slash({ interaction, store }) { await replySlash(interaction, build(interaction.guildId, store)); },
};
