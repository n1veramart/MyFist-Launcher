const help = require('./help');
const ping = require('./ping');
const changelog = require('./changelog');
const digest = require('./digest');

const check = require('./check');
const securitystats = require('./securitystats');
const securityfeed = require('./securityfeed');
const report = require('./report');
const guard = require('./guard');
const dravenlogs = require('./dravenlogs');
const purge = require('./purge');
const automod = require('./automod');
const banwords = require('./banwords');
const noping = require('./noping');
const nativemod = require('./nativemod');
const setinvite = require('./setinvite');

const daily = require('./daily');
const quests = require('./quests');
const profile = require('./profile');
const rankcard = require('./rankcard');
const leaderboard = require('./leaderboard');
const setLevelRole = require('./setLevelRole');
const levelRoles = require('./levelRoles');
const xprewards = require('./xprewards');
const unlockrole = require('./unlockrole');
const setxprate = require('./setxprate');

const prefix = require('./prefix');
const config = require('./config');
const backupconfig = require('./backupconfig');
const restoreconfig = require('./restoreconfig');

const topic = require('./topic');
const trivia = require('./trivia');
const triviaReward = require('./triviaReward');
const triviastats = require('./triviastats');
const triviahistory = require('./triviahistory');
const setupReviver = require('./setupReviver');
const reviverstatus = require('./reviverstatus');
const reviverpause = require('./reviverpause');

const learn = require('./learn');
const learnbulk = require('./learnbulk');
const faq = require('./faq');
const faqdelete = require('./faqdelete');
const afk = require('./afk');
const welcome = require('./welcome');

const commands = [
  help, ping, changelog, digest,
  check, securitystats, securityfeed, report, guard, dravenlogs, purge, automod, banwords, noping, nativemod, setinvite,
  daily, quests, profile, rankcard, leaderboard, setLevelRole, levelRoles, xprewards, unlockrole, setxprate,
  prefix, config, backupconfig, restoreconfig,
  topic, trivia, triviaReward, triviastats, triviahistory, setupReviver, reviverstatus, reviverpause,
  learn, learnbulk, faq, faqdelete, afk, welcome,
];

const byName = new Map(commands.map((c) => [c.name, c]));

module.exports = { commands, byName };
