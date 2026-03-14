const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { hasManageGuild } = require('../utils/permissions');

function build(guildId, store) {
  const settings = store.getGuildSettings(guildId);
  const xp = store.getXpRates(guildId);
  const reviver = store.getReviverStatus(guildId);
  return makeEmbed('<:draven_utility:1477349327092322377> Config Snapshot', 'Current guild configuration snapshot.', [
    ['<:draven_prefix:1477349285489283113> Prefix', settings.prefix],
    ['<:draven_security:1477349313482063912> Guard', settings.guardEnabled ? 'On' : 'Off'],
    ['<:draven_xp:1477349339499204770> XP Rates', `Message: ${xp.messageXp} | Daily: ${xp.dailyXp} | Quest: ${xp.questXp}`],
    ['<:draven_chart:1477349258054340813> Reviver', reviver ? `Channel: <#${reviver.channelId}> | Minutes: ${reviver.inactivityMinutes} | Paused: ${reviver.paused ? 'Yes' : 'No'}` : 'Not configured'],
    ['<:draven_rewards:1477349309023256797> Trivia Reward', `${store.getTriviaReward(guildId)} XP`],
    ['<:draven_logs:1477349271438098657> Logs Channel', settings.dravenLogsChannelId ? `<#${settings.dravenLogsChannelId}>` : 'Not set'],
    ['<:draven_security:1477349313482063912> AutoMod', `Strict 5-rule mode active across all channels`],
    ['<:draven_banwords:1477359702714355742> Banwords', `${store.getBanWords(guildId).length} custom`],
    ['<:draven_noping:1477359694749368632> NoPing', `${store.getNoPingTargets(guildId).length} targets`],
  ]);
}

module.exports = {
  name: 'config',
  async prefix({ message, store }) {
    if (!hasManageGuild(message.member)) return;
    await replyPrefix(message, build(message.guild.id, store));
  },
  async slash({ interaction, store }) {
    if (!hasManageGuild(interaction.memberPermissions)) return replySlash(interaction, makeEmbed('<:draven_no_permission:1477349273535385776> Permission Denied', 'Manage Server is required.'));
    await replySlash(interaction, build(interaction.guildId, store));
  },
};
