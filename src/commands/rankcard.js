const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { progressBar } = require('../utils/progress');

function levelFromXp(xp) {
  return Math.floor(Number(xp || 0) / 100) + 1;
}

function build(user, guildId, store) {
  const p = store.getLevel(guildId, user.id);
  const level = levelFromXp(p.xp);
  const nextLevelXp = level * 100;
  const nextRole = store.getLevelRoles(guildId).find((x) => Number(x.requiredXp) > p.xp);
  return makeEmbed('<:draven_rank_card:1477349302069362873> Rank Card', `Compact rank card for <@${user.id}>`, [
    ['<:draven_xp:1477349339499204770> Level', `${level}`],
    ['<:draven_chart:1477349258054340813> XP', `${p.xp}/${nextLevelXp}`],
    ['<:draven_progress:1477349293063934103> Progress', progressBar(p.xp)],
    ['<:draven_target:1477349317726699551> Next Role', nextRole ? `<@&${nextRole.roleId}> at ${nextRole.requiredXp} XP` : 'All configured roles unlocked'],
  ]);
}

module.exports = {
  name: 'rankcard',
  async prefix({ message, store }) {
    const target = message.mentions.users.first() || message.author;
    await replyPrefix(message, build(target, message.guild.id, store));
  },
  async slash({ interaction, store }) {
    const user = interaction.options.getUser('user') || interaction.user;
    await replySlash(interaction, build(user, interaction.guildId, store));
  },
};
