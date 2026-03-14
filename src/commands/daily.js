const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { syncLevelRoles } = require('../utils/levelRoles');

function cooldownText(dailyAt) {
  const left = 86400000 - (Date.now() - new Date(dailyAt).getTime());
  return `Come back in ${Math.floor(left / 3600000)}h ${Math.floor((left % 3600000) / 60000)}m.`;
}

module.exports = {
  name: 'daily',
  async prefix({ message, store }) {
    const lvl = store.getLevel(message.guild.id, message.author.id);
    if (lvl.dailyAt && Date.now() - new Date(lvl.dailyAt).getTime() < 86400000) return replyPrefix(message, makeEmbed('<:draven_rewards:1477349309023256797> Daily Reward', cooldownText(lvl.dailyAt)));
    const rates = store.getXpRates(message.guild.id);
    lvl.xp += rates.dailyXp;
    lvl.quests += 1;
    lvl.dailyAt = new Date().toISOString();
    await store.saveLevel(message.guild.id, message.author.id);
    await syncLevelRoles(message.guild, message.member, store);
    await replyPrefix(message, makeEmbed('<:draven_rewards:1477349309023256797> Daily Reward', `Claimed +${rates.dailyXp} XP and +1 quest completion.`));
  },
  async slash({ interaction, store }) {
    const lvl = store.getLevel(interaction.guildId, interaction.user.id);
    if (lvl.dailyAt && Date.now() - new Date(lvl.dailyAt).getTime() < 86400000) return replySlash(interaction, makeEmbed('<:draven_rewards:1477349309023256797> Daily Reward', cooldownText(lvl.dailyAt)));
    const rates = store.getXpRates(interaction.guildId);
    lvl.xp += rates.dailyXp;
    lvl.quests += 1;
    lvl.dailyAt = new Date().toISOString();
    await store.saveLevel(interaction.guildId, interaction.user.id);
    await syncLevelRoles(interaction.guild, interaction.member, store);
    await replySlash(interaction, makeEmbed('<:draven_rewards:1477349309023256797> Daily Reward', `Claimed +${rates.dailyXp} XP and +1 quest completion.`));
  },
};
