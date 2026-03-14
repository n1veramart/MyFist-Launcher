const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');

function build(guildId, store) {
  const s = store.getTriviaStats(guildId);
  const winners = s.topWinners.length
    ? s.topWinners.map(([id, wins]) => `<@${id}>: ${wins}`).join('\n')
    : 'No winners yet';
  return makeEmbed('<:draven_chart:1477349258054340813> Trivia Stats', 'Last 30 days style overview (runtime window).', [
    ['<:draven_checkmark:1477349260730175712> Total Questions Answered', `${s.total}`],
    ['<:draven_progression:1477349295157153976> Fastest Correct Answer', s.fastestMs ? `${Math.round(s.fastestMs / 1000)}s` : 'N/A'],
    ['<:draven_trophy:1477349320171983069> Top Winners', winners],
  ]);
}

module.exports = {
  name: 'triviastats',
  async prefix({ message, store }) { await replyPrefix(message, build(message.guild.id, store)); },
  async slash({ interaction, store }) { await replySlash(interaction, build(interaction.guildId, store)); },
};
