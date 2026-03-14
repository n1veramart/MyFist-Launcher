const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');

function build(guildId, store) {
  const cfg = store.getReviverStatus(guildId);
  if (!cfg) return makeEmbed('<:draven_status:1477349315461644308> Reviver Status', 'Reviver is not configured.');
  const nextTs = cfg.lastPosted ? Math.floor((Number(cfg.lastPosted) + Number(cfg.inactivityMinutes) * 60000) / 1000) : null;
  return makeEmbed('<:draven_status:1477349315461644308> Reviver Status', 'Current reviver configuration.', [
    ['<:draven_pin:1477349275343126664> Channel', `<#${cfg.channelId}>`],
    ['<:draven_age:1477359697559425218> Inactivity Threshold', `${cfg.inactivityMinutes} minutes`],
    ['<:draven_tag:1477359687702679603> Role Ping', cfg.roleId ? `<@&${cfg.roleId}>` : 'Off'],
    ['<:draven_rev_pandr:1477349306078855188> Pause State', cfg.paused ? 'Paused' : 'Running'],
    ['<:draven_age:1477359697559425218> Next Eligible', nextTs ? `<t:${nextTs}:F> (<t:${nextTs}:R>)` : 'After next post'],
  ]);
}

module.exports = {
  name: 'reviverstatus',
  async prefix({ message, store }) { await replyPrefix(message, build(message.guild.id, store)); },
  async slash({ interaction, store }) { await replySlash(interaction, build(interaction.guildId, store)); },
};
