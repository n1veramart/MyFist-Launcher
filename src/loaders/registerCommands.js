const { REVIVER_MIN_INACTIVITY_MINUTES } = require('../config/constants');

async function registerCommands(client) {
  const defs = [
    { name: 'help', description: 'Open command center' },
    { name: 'ping', description: 'Bot latency' },
    { name: 'changelog', description: 'Show latest bot updates' },
    { name: 'digest', description: 'Generate the weekly activity visual digest' },

    { name: 'check', description: 'View trust score', options: [{ name: 'user', description: 'Target user', type: 6, required: true }] },
    { name: 'securitystats', description: 'Weekly trust/report summary for this guild' },
    { name: 'securityfeed', description: 'Recent security activity feed and patterns' },
    { name: 'report', description: 'Report a user or link', options: [{ name: 'user', description: 'Reported user', type: 6 }, { name: 'link', description: 'Suspicious link', type: 3 }] },
    { name: 'guard', description: 'Enable or disable protection', options: [{ name: 'mode', description: 'on or off', type: 3, required: true }] },
    { name: 'dravenlogs', description: 'Set Draven logs channel', options: [{ name: 'channel', description: 'Logs channel', type: 7, required: true }] },
    { name: 'purge', description: 'Bulk delete recent messages in this channel', options: [{ name: 'amount', description: 'Number of recent messages to delete (1-100)', type: 4, required: true }] },
    { name: 'automod', description: 'Open strict guild-wide automod policy panel' },
    { name: 'nativemod', description: 'Deploy native Discord AutoMod enrollment rules' },
    { name: 'setinvite', description: 'Set invite tracking announcement channel', options: [{ name: 'channel', description: 'Channel for invite tracking alerts', type: 7, required: true }] },
    { name: 'banwords', description: 'Manage banned words list', options: [
      { name: 'list', description: 'List banned words', type: 1 },
      { name: 'add', description: 'Add a banned word', type: 1, options: [{ name: 'word', description: 'Word to add', type: 3, required: true }] },
      { name: 'remove', description: 'Remove a banned word', type: 1, options: [{ name: 'word', description: 'Word to remove', type: 3, required: true }] }
    ] },
    { name: 'noping', description: 'Manage prohibited pings (users/roles)', options: [
      { name: 'list', description: 'List noping targets', type: 1 },
      { name: 'add', description: 'Add noping target', type: 1, options: [{ name: 'target', description: 'Mention or target (@user/@role/@everyone/@here)', type: 3, required: true }] },
      { name: 'remove', description: 'Remove noping target', type: 1, options: [{ name: 'target', description: 'Mention or target (@user/@role/@everyone/@here)', type: 3, required: true }] }
    ] },

    { name: 'daily', description: 'Claim daily rewards' },
    { name: 'quests', description: 'Daily question challenge', options: [{ name: 'answer', description: 'Optional answer', type: 3 }] },
    { name: 'profile', description: 'View profile', options: [{ name: 'user', description: 'Target user', type: 6 }] },
    { name: 'rankcard', description: 'Show compact rank card', options: [{ name: 'user', description: 'Target user', type: 6 }] },
    { name: 'leaderboard', description: 'Top 10 users' },
    { name: 'setlevelrole', description: 'Set XP required for role unlock', options: [{ name: 'required_xp', description: 'Required XP', type: 4, required: true }, { name: 'role', description: 'Role to unlock', type: 8, required: true }] },
    { name: 'levelroles', description: 'List XP unlock roles' },
    { name: 'xprewards', description: 'Show XP reward thresholds' },
    { name: 'unlockrole', description: 'Unlock role if your XP meets requirement', options: [{ name: 'role', description: 'Role to unlock', type: 8, required: true }] },
    { name: 'setxprate', description: 'Set XP rates for messages/daily/quest', options: [{ name: 'message_xp', description: 'Message XP gain', type: 4, required: true }, { name: 'daily_xp', description: 'Daily command XP gain', type: 4, required: true }, { name: 'quest_xp', description: 'Quest completion XP gain', type: 4, required: true }] },

    { name: 'prefix', description: 'Set guild prefix', options: [{ name: 'new_prefix', description: 'New prefix', type: 3, required: true }] },
    { name: 'config', description: 'Admin configuration snapshot for this guild' },
    { name: 'backupconfig', description: 'Export guild bot config backup' },
    { name: 'restoreconfig', description: 'Import guild bot config backup', options: [{ name: 'payload', description: 'Backup string', type: 3, required: true }] },

    { name: 'topic', description: 'Post a starter if inactive' },
    { name: 'trivia', description: 'Post one trivia question (once every 4 hours per channel)' },
    { name: 'settriviareward', description: 'Set trivia XP reward', options: [{ name: 'xp', description: 'Reward XP', type: 4, required: true }] },
    { name: 'triviastats', description: 'Show trivia winners and fastest answers' },
    { name: 'triviahistory', description: 'Show recent trivia rounds and winners' },
    { name: 'setupreviver', description: `Configure reviver (minimum inactivity ${REVIVER_MIN_INACTIVITY_MINUTES} minutes)`, options: [{ name: 'channel', description: 'Target channel', type: 7, required: true }, { name: 'inactivity_minutes', description: 'Inactivity threshold', type: 4, required: true }, { name: 'role', description: 'Optional role ping', type: 8 }] },
    { name: 'reviverstatus', description: 'Show current reviver configuration and next timing' },
    { name: 'reviverpause', description: 'Pause or resume automated reviver', options: [{ name: 'mode', description: 'on to pause, off to resume', type: 3, required: true }] },

    { name: 'learn', description: 'Store FAQ entry', options: [{ name: 'question', description: 'Question', type: 3, required: true }, { name: 'answer', description: 'Answer', type: 3, required: true }] },
    { name: 'learnbulk', description: 'Bulk import FAQ entries', options: [{ name: 'entries', description: 'question | answer per line', type: 3, required: true }] },
    { name: 'faq', description: 'List FAQ entries' },
    { name: 'faqdelete', description: 'Delete FAQ by index or exact question', options: [{ name: 'index', description: '1-based FAQ index', type: 4 }, { name: 'question', description: 'Exact question text', type: 3 }] },
    { name: 'afk', description: 'Set or clear your global AFK status', options: [
      { name: 'set', description: 'Set AFK with reason', type: 1, options: [{ name: 'reason', description: 'AFK reason', type: 3, required: true }] },
      { name: 'clear', description: 'Clear AFK status', type: 1 }
    ] },
    { name: 'welcome', description: 'Open interactive welcome system builder', options: [{ name: 'channel', description: 'Welcome channel', type: 7 }] },
  ];
  await client.application.commands.set(defs);
}

module.exports = { registerCommands };
