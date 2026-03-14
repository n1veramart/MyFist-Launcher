const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');

function localPrompt() {
  const arr = [
    'What small habit improved your workflow?',
    'What would you automate next?',
    'What is one community challenge worth solving?',
    'Share one lesson learned this week.',
    'What tiny change boosted your productivity this week?',
    'Which quick ritual helps you start mornings with momentum?',
    'What tiny change cut your email load this week?',
    'What 5-minute routine helps you reset after meetings?',
    'Which micro-habit reduces procrastination the most?',
    'What’s a short manual task you automate to save time?',
    'Which app feature made collaboration smoother recently?',
    'What’s a small habit that improved your focus during deep work?',
    'What quick hack helps you remember important details?',
    'Which tiny act boosted your energy in the afternoon?',
    'What’s a 2-minute maintenance task you perform daily?',
    'Which habit helps you declutter your digital workspace?',
    'What small change made planning easier this month?',
    'Which 3-step checklist keeps you on track?',
    'What’s a quick way to gather feedback from teammates?',
    'Which mini-routine helps you switch contexts effectively?',
    'What’s a tiny stretch you do to reset your posture?',
    'Which habit helps you wind down and sleep better?',
    'What’s a short mindset shift that changed your day?',
  ];
  return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = {
  name: 'topic',
  async prefix({ message, store, ai }) {
    const cfg = store.reviverConfig.get(message.guild.id);
    if (!cfg || cfg.channelId !== message.channel.id) return replyPrefix(message, makeEmbed('<:draven_chart:1477349258054340813> Topic', 'Reviver is not configured for this channel.'));
    const last = store.lastActivity.get(message.channel.id) || new Date();
    if (Date.now() - last.getTime() < cfg.inactivityMinutes * 60000) return replyPrefix(message, makeEmbed('<:draven_chart:1477349258054340813> Topic', 'Channel is active. Topic withheld.'));
    const prompt = await ai.randomReviverPrompt('discord community engagement') || localPrompt();
    await replyPrefix(message, makeEmbed('<:draven_chart:1477349258054340813> Discussion Starter', prompt), [], { autoDelete: false });
  },
  async slash({ interaction, store, ai }) {
    const cfg = store.reviverConfig.get(interaction.guildId);
    if (!cfg || cfg.channelId !== interaction.channelId) return replySlash(interaction, makeEmbed('<:draven_chart:1477349258054340813> Topic', 'Reviver is not configured for this channel.'));
    const last = store.lastActivity.get(interaction.channelId) || new Date();
    if (Date.now() - last.getTime() < cfg.inactivityMinutes * 60000) return replySlash(interaction, makeEmbed('<:draven_chart:1477349258054340813> Topic', 'Channel is active. Topic withheld.'));
    const prompt = await ai.randomReviverPrompt('discord community engagement') || localPrompt();
    await replySlash(interaction, makeEmbed('<:draven_chart:1477349258054340813> Discussion Starter', prompt), [], { ephemeral: false, autoDelete: false });
  },
};
