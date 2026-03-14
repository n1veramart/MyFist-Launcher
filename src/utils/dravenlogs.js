const { makeEmbed } = require('./embed');

function normalizeAction(action) {
  return String(action || 'EVENT').replace(/_/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
}

async function sendDravenLog(guild, store, action, details) {
  try {
    if (!guild) return;
    const channelId = store.getDravenLogsChannel(guild.id);
    if (!channelId) return;
    const channel = guild.channels.cache.get(channelId);
    if (!channel?.isTextBased()) return;
    await channel.send({ embeds: [makeEmbed('<:draven_logs:1477349271438098657> Draven Logs', `**Action:** ${normalizeAction(action)}\n${details}`)] });
  } catch {
    // keep silent
  }
}

module.exports = { sendDravenLog, normalizeAction };
