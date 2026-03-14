const { parsePrefixCommand } = require('../utils/parse');
const { byName } = require('../commands');
const { makeEmbed } = require('../utils/embed');
const { sendDravenLog } = require('../utils/dravenlogs');
const { syncLevelRoles } = require('../utils/levelRoles');
const { buildWelcomeMainButtons, buildWelcomeChangesButtons } = require('../ui/welcomeMenu');

const DEFAULT_BANWORDS = ['bitch', 'faggot', 'nigger', 'retard'];
const RULE2_KEYWORDS = ['free nitro', 'discord.gg/', '.ru', 'gift'];
const SPAM_WINDOW_MS = 20000;
const recentMessages = new Map();

const faqCooldown = new Map();

function tokenize(text) {
  return String(text || '').toLowerCase().split(/[^a-z0-9]+/g).filter((t) => t.length >= 3);
}

function faqKeywordMatch(question, content) {
  const qTokens = [...new Set(tokenize(question))];
  if (qTokens.length < 3) return false;
  const cSet = new Set(tokenize(content));
  const matched = qTokens.filter((token) => cSet.has(token)).length;
  return matched >= 3 && matched / qTokens.length >= 0.7;
}

async function maybeSendFaqGuide(message, store) {
  const key = `${message.guild.id}:${message.author.id}`;
  const now = Date.now();
  if (now - Number(faqCooldown.get(key) || 0) < 20000) return;

  const entries = store.faq(message.guild.id);
  const hit = entries.find((entry) => faqKeywordMatch(entry.question, message.content));
  if (!hit) return;

  const embed = makeEmbed('<:draven_quests:1477349299632472114> Ghostly Guide', hit.answer, [['Matched FAQ', hit.question]]);
  const imageMatch = String(hit.answer || '').match(/https?:\/\/\S+\.(?:png|jpe?g|gif|webp)/i);
  if (imageMatch) embed.setImage(imageMatch[0]);
  await message.channel.send({ embeds: [embed] }).catch(() => null);
  faqCooldown.set(key, now);
}

async function maybeCaptureWelcomePromptInput(message, store) {
  const pending = store.getWelcomePrompt(message.guild.id, message.author.id);
  if (!pending) return false;
  if (Date.now() > Number(pending.expiresAt || 0)) {
    store.clearWelcomePrompt(message.guild.id, message.author.id);
    const timeoutMsg = await message.channel.send({ embeds: [makeEmbed('<:draven_no_permission:1477349273535385776> Welcome Builder', '10 mins timeout reached, try again.')] }).catch(() => null);
    if (timeoutMsg?.delete) setTimeout(() => timeoutMsg.delete().catch(() => null), 3000);
    return true;
  }

  const content = String(message.content || '').trim();
  const patch = {};
  if (pending.field === 'title') patch.title = content.slice(0, 256);
  if (pending.field === 'description') patch.description = content.slice(0, 4000);
  if (pending.field === 'color') patch.color = /^#?[0-9a-f]{6}$/i.test(content) ? (content.startsWith('#') ? content : `#${content}`) : null;
  if (pending.field === 'image') patch.image = /^https?:\/\//i.test(content) ? content : null;
  if (pending.field === 'role') {
    const match = content.match(/<@&(\d+)>/) || content.match(/^(\d{16,22})$/);
    patch.roleId = match ? match[1] : null;
  }

  if ((pending.field === 'color' || pending.field === 'image' || pending.field === 'role') && !Object.values(patch)[0]) {
    const invalidMsg = await message.channel.send({ embeds: [makeEmbed('<:draven_no_permission:1477349273535385776> Welcome Builder', 'Invalid input format. Please click the button again and retry.')] }).catch(() => null);
    if (invalidMsg?.delete) setTimeout(() => invalidMsg.delete().catch(() => null), 3000);
    store.clearWelcomePrompt(message.guild.id, message.author.id);
    return true;
  }

  const draft = store.setWelcomeDraft(message.guild.id, message.author.id, patch);
  const ui = byName.get('welcome')?.ui;
  if (ui && pending.messageId) {
    const panelChannel = message.guild.channels.cache.get(pending.channelId) || message.channel;
    const panelMessage = await panelChannel.messages.fetch(pending.messageId).catch(() => null);
    if (panelMessage) {
      const components = pending.view === 'changes' ? buildWelcomeChangesButtons() : buildWelcomeMainButtons();
      await panelMessage.edit({ embeds: [ui.buildWelcomePreview(draft, message.guild)], components }).catch(() => null);
    }
  }
  store.clearWelcomePrompt(message.guild.id, message.author.id);
  const doneMsg = await message.channel.send({ embeds: [makeEmbed('<:draven_checkmark:1477349260730175712> Welcome Draft Updated', `Updated **${pending.field}** successfully.`)] }).catch(() => null);
  if (doneMsg?.delete) setTimeout(() => doneMsg.delete().catch(() => null), 3000);
  return true;
}

function fmtDuration(ms) {
  const total = Math.max(1, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

async function maybeNotifyAfk(message, store) {
  const targetIds = new Set(message.mentions.users.map((u) => u.id));
  if (message.reference?.messageId) {
    const replied = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
    if (replied?.author?.id) targetIds.add(replied.author.id);
  }

  for (const userId of targetIds) {
    const afk = store.getAfk(userId);
    if (!afk) continue;
    const since = fmtDuration(Date.now() - new Date(afk.startedAt).getTime());
    await message.channel.send({
      embeds: [makeEmbed('<:draven_afk:1477349255747469462> User AFK', `<@${userId}> is currently AFK.`, [
        ['Reason', afk.reason || 'AFK'],
        ['Since', `${since} ago`],
      ])],
    }).catch(() => null);
  }
}

async function checkTriviaAnswer(message, store) {
  const active = store.activeTrivia.get(message.channel.id);
  if (!active || active.claimed) return;

  const answerText = message.content.toLowerCase().trim();
  const normalized = active.answer.toLowerCase();
  const ok = answerText === normalized || answerText.includes(normalized);
  if (!ok) return;

  active.claimed = true;
  const profile = store.getLevel(message.guild.id, message.author.id);
  profile.xp += Number(active.rewardXp || 25);
  profile.quests += 1;
  await store.saveLevel(message.guild.id, message.author.id);
  await syncLevelRoles(message.guild, message.member, store);

  const responseMs = Date.now() - Number(active.askedAt || Date.now());
  store.recordTriviaWin(message.guild.id, message.author.id, responseMs);
  store.recordTriviaRound(message.guild.id, {
    question: active.question || 'Unknown question',
    winnerId: message.author.id,
    channelId: message.channel.id,
    responseMs,
    createdAt: new Date().toISOString(),
  });

  await message.channel.send({ embeds: [makeEmbed('<:draven_trophy:1477349320171983069> Trivia Winner', `<@${message.author.id}> answered correctly and earned **${active.rewardXp} XP**.`)] }).catch(() => null);
  await sendDravenLog(message.guild, store, 'TRIVIA ANSWERED', `Winner: <@${message.author.id}>\nReward XP: ${active.rewardXp}\nResponse time: ${Math.round(responseMs / 1000)}s\nChannel: <#${message.channel.id}>`);

  store.activeTrivia.delete(message.channel.id);
}

function hasNoPingViolation(message, store) {
  const targets = store.getNoPingTargets(message.guild.id);
  if (!targets.length) return false;
  const set = new Set(targets.map((x) => String(x).toLowerCase()));
  if (set.has('@everyone') && message.mentions.everyone) return true;
  if (set.has('@here') && /@here/i.test(message.content || '')) return true;
  for (const id of message.mentions.users.keys()) if (set.has(`user:${id}`)) return true;
  for (const id of message.mentions.roles.keys()) if (set.has(`role:${id}`)) return true;
  return false;
}

function looksLikeSpam(userId, text) {
  const now = Date.now();
  const key = String(userId);
  const arr = recentMessages.get(key) || [];
  const next = arr.filter((x) => now - x.at < SPAM_WINDOW_MS);
  next.push({ text, at: now });
  recentMessages.set(key, next);

  const repeatedSame = next.filter((x) => x.text === text).length >= 3;
  const repeatedChars = /(.)\1{8,}/i.test(text);
  const allCapsBurst = text.length > 30 && text === text.toUpperCase();
  return repeatedSame || repeatedChars || allCapsBurst;
}

function emojiCount(text) {
  const unicode = (text.match(/[\p{Extended_Pictographic}]/gu) || []).length;
  const custom = (text.match(/<a?:\w+:\d+>/g) || []).length;
  return unicode + custom;
}

async function applyStrictAutomod(message, store) {
  const cfg = store.getAutomodConfig(message.guild.id);
  if (!cfg.enabled) return false;

  const content = String(message.content || '');
  const text = content.toLowerCase();

  if (cfg.banWordsFilter) {
    const customBanWords = store.getBanWords(message.guild.id);
    const rule1 = [...DEFAULT_BANWORDS, ...customBanWords].find((w) => text.includes(w));
    if (rule1) {
      await message.delete().catch(() => null);
      await sendDravenLog(message.guild, store, 'AUTOMOD_RULE_1', `User: <@${message.author.id}>\nMatched word: ${rule1}\nChannel: <#${message.channel.id}>`);
      return true;
    }
  }

  if (cfg.inviteFilter) {
    const rule2 = RULE2_KEYWORDS.find((w) => text.includes(w));
    if (rule2) {
      await message.delete().catch(() => null);
      await sendDravenLog(message.guild, store, 'AUTOMOD_RULE_2', `User: <@${message.author.id}>\nMatched keyword: ${rule2}\nChannel: <#${message.channel.id}>`);
      return true;
    }
  }

  if (cfg.linkFilter && /https?:\/\//i.test(content)) {
    await message.delete().catch(() => null);
    await sendDravenLog(message.guild, store, 'AUTOMOD_RULE_3', `User: <@${message.author.id}>\nReason: link blocked\nChannel: <#${message.channel.id}>`);
    return true;
  }

  const mentionCount = message.mentions.users.size + message.mentions.roles.size + (message.mentions.everyone ? 1 : 0);
  if ((cfg.mentionFilter && mentionCount > cfg.mentionThreshold) || hasNoPingViolation(message, store)) {
    await message.delete().catch(() => null);
    await sendDravenLog(message.guild, store, 'AUTOMOD_RULE_4', `User: <@${message.author.id}>\nReason: prohibited mentions\nCount: ${mentionCount}\nChannel: <#${message.channel.id}>`);
    return true;
  }

  if (cfg.emojiFilter && emojiCount(content) > cfg.emojiThreshold) {
    await message.delete().catch(() => null);
    await sendDravenLog(message.guild, store, 'AUTOMOD_RULE_EMOJI', `User: <@${message.author.id}>\nReason: emoji spam\nChannel: <#${message.channel.id}>`);
    return true;
  }

  if (cfg.stickerFilter && message.stickers?.size) {
    await message.delete().catch(() => null);
    await sendDravenLog(message.guild, store, 'AUTOMOD_RULE_STICKER', `User: <@${message.author.id}>\nReason: sticker blocked\nChannel: <#${message.channel.id}>`);
    return true;
  }

  if (cfg.wallTextFilter && content.length > 800) {
    await message.delete().catch(() => null);
    await sendDravenLog(message.guild, store, 'AUTOMOD_RULE_WALLTEXT', `User: <@${message.author.id}>\nReason: wall text\nChannel: <#${message.channel.id}>`);
    return true;
  }

  if (cfg.spoilerFilter && /\|\|.*\|\|/.test(content)) {
    await message.delete().catch(() => null);
    await sendDravenLog(message.guild, store, 'AUTOMOD_RULE_SPOILER', `User: <@${message.author.id}>\nReason: spoiler blocked\nChannel: <#${message.channel.id}>`);
    return true;
  }

  if (looksLikeSpam(message.author.id, text) || (cfg.capsFilter && text.length > 30 && text === text.toUpperCase())) {
    await message.delete().catch(() => null);
    await sendDravenLog(message.guild, store, 'AUTOMOD_RULE_5', `User: <@${message.author.id}>\nReason: spam-like content\nChannel: <#${message.channel.id}>`);
    return true;
  }

  return false;
}

function registerOnMessageCreate(client, store, ai) {
  client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;

    store.lastActivity.set(message.channel.id, new Date());
    store.incrementDailyMessageCount(message.guild.id);
    store.recordMemberActivity(message.guild.id, message.author.id);

    const captured = await maybeCaptureWelcomePromptInput(message, store);
    if (captured) return;

    await maybeNotifyAfk(message, store);
    await checkTriviaAnswer(message, store);
    await maybeSendFaqGuide(message, store);

    const blocked = await applyStrictAutomod(message, store);
    if (blocked) return;

    const profile = store.getLevel(message.guild.id, message.author.id);
    const rates = store.getXpRates(message.guild.id);
    profile.xp += rates.messageXp;
    await store.saveLevel(message.guild.id, message.author.id);
    await syncLevelRoles(message.guild, message.member, store);

    const prefix = await store.getPrefix(message.guild.id);
    if (!message.content.startsWith(prefix)) return;

    const parsed = parsePrefixCommand(message.content, prefix);
    const cmd = byName.get(parsed.name);
    if (!cmd?.prefix) return;

    await sendDravenLog(message.guild, store, 'COMMAND PREFIX EXECUTED', `User: <@${message.author.id}>\nCommand: ${parsed.name}\nArgs: ${parsed.argText || '(none)'}`);

    try {
      await cmd.prefix({ message, store, ai, client, ...parsed });
    } catch {
      await sendDravenLog(message.guild, store, 'COMMAND PREFIX FAILED', `User: <@${message.author.id}>\nCommand: ${parsed.name}`);
    }
  });
}

module.exports = { registerOnMessageCreate };
