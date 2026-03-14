const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { hasManageGuild } = require('../utils/permissions');

module.exports = {
  name: 'settriviareward',
  async prefix({ message, store, args }) {
    if (!hasManageGuild(message.member)) return;
    const reward = Number(args[0]);
    if (!reward || reward < 1) return replyPrefix(message, makeEmbed('<:draven_chart:1477349258054340813> Trivia Reward', 'Provide an XP reward amount greater than 0.'));
    await store.setTriviaReward(message.guild.id, reward);
    await replyPrefix(message, makeEmbed('<:draven_chart:1477349258054340813> Trivia Reward', `Trivia reward set to **${reward} XP**.`));
  },
  async slash({ interaction, store }) {
    if (!hasManageGuild(interaction.memberPermissions)) return replySlash(interaction, makeEmbed('<:draven_no_permission:1477349273535385776> Permission Denied', 'Manage Server is required.'));
    const reward = interaction.options.getInteger('xp', true);
    await store.setTriviaReward(interaction.guildId, reward);
    await replySlash(interaction, makeEmbed('<:draven_chart:1477349258054340813> Trivia Reward', `Trivia reward set to **${reward} XP**.`));
  },
};
