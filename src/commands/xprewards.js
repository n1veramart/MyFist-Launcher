const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');

function build(guildId, store) {
  const list = store.getLevelRoles(guildId);
  const lines = list.length ? list.map((x) => `<@&${x.roleId}> → ${x.requiredXp} XP`).join('\n') : 'No XP rewards configured.';
  return makeEmbed('<:draven_xp:1477349339499204770> XP Rewards', lines);
}

module.exports = {
  name: 'xprewards',
  async prefix({ message, store }) { await replyPrefix(message, build(message.guild.id, store)); },
  async slash({ interaction, store }) { await replySlash(interaction, build(interaction.guildId, store)); },
};
