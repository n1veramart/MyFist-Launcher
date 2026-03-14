const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');

function build(stats) {
  const patterns = stats.topPatterns.length
    ? stats.topPatterns.map(([k, v]) => `${k}: ${v}`).join('\n')
    : 'No recurring patterns yet';
  return makeEmbed('🛡️ Security Stats', 'Weekly guild security summary.', [
    ['📦 Total Events', `${stats.totalEvents}`],
    ['🚨 Reports', `${stats.reports}`],
    ['🔗 Checked Links', `${stats.checkedLinks}`],
    ['👤 Reported Users', `${stats.reportedUsers}`],
    ['🏷️ Top Scam Patterns', patterns],
  ]);
}

module.exports = {
  name: 'securitystats',
  async prefix({ message, store }) { await replyPrefix(message, build(store.getWeeklySecurityStats(message.guild.id))); },
  async slash({ interaction, store }) { await replySlash(interaction, build(store.getWeeklySecurityStats(interaction.guildId))); },
};
