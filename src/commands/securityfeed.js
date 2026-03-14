const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');

function build(guildId, store) {
  const feed = store.getSecurityFeed(guildId);
  const perDay = Object.entries(feed.reportsPerDay).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7)
    .map(([day, count]) => `${day}: ${count}`).join('\n') || 'No report activity';
  const targets = feed.topTargets.map(([id, count]) => `<@${id}>: ${count}`).join('\n') || 'No flagged users';
  const keywords = feed.topKeywords.map(([key, count]) => `${key}: ${count}`).join('\n') || 'No recurring keywords';
  const recent = feed.recentEvents
    .map((e) => `• ${e.type} — <t:${Math.floor(new Date(e.createdAt).getTime() / 1000)}:R>`)
    .slice(0, 5)
    .join('\n') || 'No recent events';

  return makeEmbed('<:draven_security:1477349313482063912> Security Feed', 'Recent security activity and signals.', [
    ['<:draven_report:1477359692203425915> Reports per Day', perDay],
    ['<:draven_reported_user:1477349304224976936> Top Flagged Users', targets],
    ['<:draven_tag:1477359687702679603> Top Keywords', keywords],
    ['<:draven_events:1477349264077095125> Recent Events', recent],
  ]);
}

module.exports = {
  name: 'securityfeed',
  async prefix({ message, store }) { await replyPrefix(message, build(message.guild.id, store)); },
  async slash({ interaction, store }) { await replySlash(interaction, build(interaction.guildId, store)); },
};
