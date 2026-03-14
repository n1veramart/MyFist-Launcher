const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { progressBar } = require('../utils/progress');

function build(user, guildId, store) {
  const lvl = store.getLevel(guildId, user.id);
  return makeEmbed('<:draven_profile:1477349290853798080> Profile', `Overview for <@${user.id}>`, [['<:draven_chart:1477349258054340813> XP Progress', progressBar(lvl.xp)], ['<:draven_xp:1477349339499204770> Total XP', `${lvl.xp}`], ['<:draven_checkmark:1477349260730175712> Quests', `${lvl.quests}`]]);
}

module.exports = {
  name: 'profile',
  async prefix({ message, store }) {
    const target = message.mentions.users.first() || message.author;
    await replyPrefix(message, build(target, message.guild.id, store));
  },
  async slash({ interaction, store }) {
    const user = interaction.options.getUser('user') || interaction.user;
    await replySlash(interaction, build(user, interaction.guildId, store));
  },
};
