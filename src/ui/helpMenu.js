const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const moduleMap = {
  security: {
    title: '<:draven_security:1477349313482063912> Security Commands',
    body: '/check and =check — inspect user trust score\n/securitystats and =securitystats — weekly security summary\n/securityfeed and =securityfeed — recent security events feed\n/report and =report — report suspicious user/link\n/guard and =guard — toggle server protection\n/dravenlogs and =dravenlogs — set logs channel\n/purge and =purge — bulk delete recent messages\n/automod and =automod — strict guild-wide automod rules panel\n/nativemod and =nativemod — deploy native Discord AutoMod rules\n/setinvite and =setinvite — set invite tracking channel\n/banwords and =banwords — list/add/remove banned words\n/noping and =noping — list/add/remove prohibited pings',
  },
  economy: {
    title: '<:draven_progression:1477349295157153976> Progression Commands',
    body: '/daily and =daily — claim daily XP\n/quests and =quests — answer daily XP quest\n/profile and =profile — view XP profile\n/rankcard and =rankcard — compact rank overview\n/leaderboard and =leaderboard — top XP users\n/setlevelrole and =setlevelrole — set XP role threshold\n/levelroles and =levelroles — list XP role thresholds\n/xprewards and =xprewards — show XP reward map\n/unlockrole and =unlockrole — unlock eligible role\n/setxprate and =setxprate — set XP gain rates',
  },
  utility: {
    title: '<:draven_utility:1477349327092322377> Utility Commands',
    body: '/prefix and =prefix — update guild prefix\n/config and =config — full admin config snapshot\n/backupconfig and =backupconfig — export config backup\n/restoreconfig and =restoreconfig — import config backup\n/ping and =ping — check bot latency\n/changelog and =changelog — view release notes\n/welcome and =welcome — interactive welcome builder',
  },
  engagement: {
    title: '<:draven_chart:1477349258054340813> Engagement Commands',
    body: '/digest and =digest — weekly visual activity digest\n/topic and =topic — post starter if inactive\n/trivia and =trivia — launch timed trivia question\n/settriviareward and =settriviareward — set trivia XP reward\n/triviastats and =triviastats — winners/fastest summary\n/triviahistory and =triviahistory — recent rounds + winners\n/setupreviver and =setupreviver — configure auto reviver\n/reviverstatus and =reviverstatus — view reviver config\n/reviverpause and =reviverpause — pause/resume reviver',
  },
  productivity: {
    title: '<:draven_utility:1477349327092322377> Productivity Commands',
    body: '/learn and =learn — save one FAQ entry\n/learnbulk and =learnbulk — bulk import FAQ entries\n/faq and =faq — browse stored FAQs\n/faqdelete and =faqdelete — delete FAQ by index/question\n/afk and =afk — set or clear global AFK status',
  },
};

function buildHelpMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('help-module')
      .setPlaceholder('Choose a module')
      .addOptions([
        { label: 'Security', value: 'security', emoji: '<:draven_security:1477349313482063912>' },
        { label: 'Progression', value: 'economy', emoji: '<:draven_progression:1477349295157153976>' },
        { label: 'Utility', value: 'utility', emoji: '<:draven_utility:1477349327092322377>' },
        { label: 'Engagement', value: 'engagement', emoji: '<:draven_chart:1477349258054340813>' },
        { label: 'Productivity', value: 'productivity', emoji: '<:draven_productivity:1477349287796146216>' },
      ])
  );
}

function buildHelpModeButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('help-mode-slash').setLabel('Slash Guide').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('help-mode-prefix').setLabel('Prefix Guide').setStyle(ButtonStyle.Secondary)
  );
}

module.exports = { moduleMap, buildHelpMenu, buildHelpModeButtons };
