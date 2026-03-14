const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');

function build(guildId, store) {
  const lines = store.leaderboard(guildId).map(([uid, data], i) => `${i + 1}. <@${uid}> — ${data.xp} XP`);
  return makeEmbed('<:draven_rewards:1477349309023256797> Leaderboard', lines.join('\n') || 'No data yet.');
}

module.exports = {
  name: 'leaderboard',
  async prefix({ message, store }) { await replyPrefix(message, build(message.guild.id, store)); },
  async slash({ interaction, store }) { await replySlash(interaction, build(interaction.guildId, store)); },
};
