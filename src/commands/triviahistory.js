const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');

function build(guildId, store) {
  const rows = store.getTriviaHistory(guildId).slice(0, 10);
  const lines = rows.length
    ? rows.map((r, i) => `${i + 1}. Q: ${r.question}\nWinner: <@${r.winnerId}> | Time: ${Math.round(r.responseMs / 1000)}s | Channel: <#${r.channelId}>`).join('\n\n')
    : 'No trivia rounds have been completed yet.';
  return makeEmbed('<:draven_chart:1477349258054340813> Trivia History', lines);
}

module.exports = {
  name: 'triviahistory',
  async prefix({ message, store }) { await replyPrefix(message, build(message.guild.id, store)); },
  async slash({ interaction, store }) { await replySlash(interaction, build(interaction.guildId, store)); },
};
