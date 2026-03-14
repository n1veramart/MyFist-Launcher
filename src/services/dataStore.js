const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = require('../config/env');
const { normalizePrefix } = require('../utils/prefix');
const { DEFAULT_PREFIX } = require('../config/constants');
const { log } = require('../utils/logger');

class DataStore {
  constructor() {
    this.sb = null;
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      try {
        this.sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        log('Supabase connected');
      } catch (e) {
        log('Supabase unavailable, falling back to memory', e.message);
      }
    }
    this.guildSettings = new Map();
    this.userLevels = new Map();
    this.trustScores = new Map();
    this.scamReports = [];
    this.securityEvents = [];
    this.reviverConfig = new Map();
    this.faqEntries = new Map();
    this.levelRoles = new Map();
    this.activeTrivia = new Map();
    this.triviaCooldown = new Map();
    this.triviaStats = new Map();
    this.triviaHistory = new Map();
    this.lastActivity = new Map();
    this.automodRules = new Map();
    this.banWords = new Map();
    this.noPingTargets = new Map();
    this.automodConfig = new Map();
    this.usedTriviaQuestions = new Map();
    this.afkStatus = new Map();
    this.inviteCache = new Map();
    this.inviterCounts = new Map();
    this.dailyMessageCounts = new Map();
    this.inviteTrackingChannels = new Map();
    this.welcomeConfig = new Map();
    this.welcomeDraft = new Map();
    this.welcomePrompts = new Map();
    this.memberLastActiveAt = new Map();
  }

  key(guildId, userId) { return `${guildId}:${userId}`; }

  defaultGuildSettings() {
    return {
      prefix: DEFAULT_PREFIX,
      triviaRewardXp: 25,
      dravenLogsChannelId: null,
      messageXp: 2,
      dailyXp: 50,
      questXp: 20,
      guardEnabled: false,
    };
  }

  async upsert(table, payload, onConflict) {
    if (!this.sb) return;
    try {
      const q = onConflict ? this.sb.from(table).upsert(payload, { onConflict }) : this.sb.from(table).upsert(payload);
      await q;
    } catch (e) { log(`DB upsert failed ${table}`, e.message); }
  }

  async insert(table, payload) {
    if (!this.sb) return;
    try { await this.sb.from(table).insert(payload); } catch (e) { log(`DB insert failed ${table}`, e.message); }
  }

  async warmCache() {
    if (!this.sb) return;
    try {
      const { data: guildRows } = await this.sb
        .from('guild_settings')
        .select('guild_id,prefix,trivia_xp_reward,trivia_reward,draven_logs_channel_id,message_xp,daily_xp,quest_xp,guard_enabled');
      (guildRows || []).forEach((r) => {
        const defaults = this.defaultGuildSettings();
        this.guildSettings.set(r.guild_id, {
          ...defaults,
          prefix: normalizePrefix(r.prefix || defaults.prefix),
          triviaRewardXp: Number(r.trivia_xp_reward || r.trivia_reward || defaults.triviaRewardXp),
          dravenLogsChannelId: r.draven_logs_channel_id || null,
          messageXp: Number(r.message_xp || defaults.messageXp),
          dailyXp: Number(r.daily_xp || defaults.dailyXp),
          questXp: Number(r.quest_xp || defaults.questXp),
          guardEnabled: !!r.guard_enabled,
        });
      });

      const { data: reviverRows } = await this.sb
        .from('reviver_config')
        .select('guild_id,channel_id,inactivity_minutes,role_id,paused');
      (reviverRows || []).forEach((r) => this.reviverConfig.set(r.guild_id, {
        channelId: r.channel_id,
        inactivityMinutes: r.inactivity_minutes,
        roleId: r.role_id || null,
        paused: !!r.paused,
        lastPosted: null,
      }));

      const { data: faqRows } = await this.sb.from('faq_entries').select('guild_id,question,answer');
      (faqRows || []).forEach((r) => {
        const current = this.faqEntries.get(r.guild_id) || [];
        current.push({ question: r.question, answer: r.answer });
        this.faqEntries.set(r.guild_id, current);
      });

      const { data: levelRoleRows } = await this.sb.from('level_roles').select('guild_id,required_xp,level,role_id');

      const { data: levelRows } = await this.sb.from('user_levels').select('guild_id,user_id,xp,quests,daily_at');
      (levelRows || []).forEach((r) => {
        this.userLevels.set(this.key(r.guild_id, r.user_id), {
          xp: Number(r.xp || 0),
          quests: Number(r.quests || 0),
          dailyAt: r.daily_at || null,
        });
      });

      const { data: automodRows } = await this.sb.from('automod_rules').select('guild_id,rule_index,name,enabled,pattern,match_type,action,timeout_minutes');
      (automodRows || []).forEach((r) => {
        const current = this.getAutomodRules(r.guild_id);
        const idx = Math.max(0, Math.min(99, Number(r.rule_index || 0)));
        current[idx] = {
          index: idx,
          name: r.name || `Rule ${idx + 1}`,
          enabled: !!r.enabled,
          pattern: r.pattern || '',
          matchType: r.match_type || 'contains',
          action: r.action || 'delete',
          timeoutMinutes: Number(r.timeout_minutes || 10),
        };
        this.automodRules.set(r.guild_id, current);
      });

      (levelRoleRows || []).forEach((r) => {
        const list = this.levelRoles.get(r.guild_id) || [];
        list.push({ requiredXp: Number(r.required_xp || r.level), roleId: r.role_id });
        this.levelRoles.set(r.guild_id, list);
      });

      const { data: banRows } = await this.sb.from('ban_words').select('guild_id,word');
      (banRows || []).forEach((r) => {
        const list = this.getBanWords(r.guild_id);
        if (!list.includes(String(r.word || '').toLowerCase())) list.push(String(r.word || '').toLowerCase());
        this.banWords.set(r.guild_id, list);
      });

      const { data: noPingRows } = await this.sb.from('no_ping_targets').select('guild_id,target');
      (noPingRows || []).forEach((r) => {
        const list = this.getNoPingTargets(r.guild_id);
        if (!list.includes(String(r.target || '').toLowerCase())) list.push(String(r.target || '').toLowerCase());
        this.noPingTargets.set(r.guild_id, list);
      });

      const { data: automodCfgRows } = await this.sb.from('automod_config').select('guild_id,enabled,invite_filter,link_filter,mention_filter,mention_threshold,banwords_filter,emoji_filter,emoji_threshold,sticker_filter,wall_text_filter,spoiler_filter,caps_filter,warning_threshold,timeout_minutes');
      (automodCfgRows || []).forEach((r) => {
        this.automodConfig.set(r.guild_id, {
          enabled: !!r.enabled,
          inviteFilter: !!r.invite_filter,
          linkFilter: !!r.link_filter,
          mentionFilter: !!r.mention_filter,
          mentionThreshold: Number(r.mention_threshold || 5),
          banWordsFilter: !!r.banwords_filter,
          emojiFilter: !!r.emoji_filter,
          emojiThreshold: Number(r.emoji_threshold || 10),
          stickerFilter: !!r.sticker_filter,
          wallTextFilter: !!r.wall_text_filter,
          spoilerFilter: !!r.spoiler_filter,
          capsFilter: !!r.caps_filter,
          warningThreshold: Number(r.warning_threshold || 5),
          timeoutMinutes: Number(r.timeout_minutes || 5),
        });
      });

      const { data: usedTriviaRows } = await this.sb.from('trivia_used_questions').select('guild_id,question');
      (usedTriviaRows || []).forEach((r) => {
        const set = this.getUsedTriviaQuestions(r.guild_id);
        set.add(String(r.question || '').toLowerCase());
      });

      const { data: afkRows } = await this.sb.from('afk_status').select('user_id,reason,started_at,active');
      (afkRows || []).forEach((r) => {
        if (!r.active) return;
        this.afkStatus.set(String(r.user_id), {
          reason: String(r.reason || 'AFK'),
          startedAt: r.started_at || new Date().toISOString(),
        });
      });

      log('Cache warmed from DB');
    } catch (e) { log('Failed warming cache', e.message); }
  }

  getGuildSettings(guildId) {
    if (!this.guildSettings.has(guildId)) this.guildSettings.set(guildId, this.defaultGuildSettings());
    return this.guildSettings.get(guildId);
  }

  async getPrefix(guildId) {
    const cached = this.getGuildSettings(guildId);
    if (cached?.prefix) return cached.prefix;
    return DEFAULT_PREFIX;
  }

  async setPrefix(guildId, prefix) {
    const normalized = normalizePrefix(prefix);
    const current = this.getGuildSettings(guildId);
    this.guildSettings.set(guildId, { ...current, prefix: normalized });
    await this.upsert('guild_settings', { guild_id: guildId, prefix: normalized }, 'guild_id');
    return normalized;
  }

  getGuardEnabled(guildId) {
    return !!this.getGuildSettings(guildId).guardEnabled;
  }

  getXpRates(guildId) {
    const s = this.getGuildSettings(guildId);
    return { messageXp: Number(s.messageXp || 2), dailyXp: Number(s.dailyXp || 50), questXp: Number(s.questXp || 20) };
  }

  async setXpRates(guildId, messageXp, dailyXp, questXp) {
    const current = this.getGuildSettings(guildId);
    this.guildSettings.set(guildId, { ...current, messageXp: Number(messageXp), dailyXp: Number(dailyXp), questXp: Number(questXp) });
    await this.upsert('guild_settings', {
      guild_id: guildId,
      message_xp: Number(messageXp),
      daily_xp: Number(dailyXp),
      quest_xp: Number(questXp),
    }, 'guild_id');
  }

  getTriviaReward(guildId) {
    return Number(this.getGuildSettings(guildId).triviaRewardXp || 25);
  }

  async setTriviaReward(guildId, rewardXp) {
    const current = this.getGuildSettings(guildId);
    this.guildSettings.set(guildId, { ...current, triviaRewardXp: Number(rewardXp) });
    await this.upsert('guild_settings', { guild_id: guildId, trivia_xp_reward: Number(rewardXp) }, 'guild_id');
  }

  getDravenLogsChannel(guildId) {
    return this.getGuildSettings(guildId).dravenLogsChannelId || null;
  }

  async setDravenLogsChannel(guildId, channelId) {
    const current = this.getGuildSettings(guildId);
    this.guildSettings.set(guildId, { ...current, dravenLogsChannelId: channelId });
    await this.upsert('guild_settings', { guild_id: guildId, draven_logs_channel_id: channelId }, 'guild_id');
  }

  getTriviaNextAllowedAt(channelId) {
    return this.triviaCooldown.get(channelId) || 0;
  }

  setTriviaCooldown(channelId, nextAllowedAt) {
    this.triviaCooldown.set(channelId, nextAllowedAt);
  }

  async setGuard(guildId, enabled) {
    const current = this.getGuildSettings(guildId);
    this.guildSettings.set(guildId, { ...current, guardEnabled: !!enabled });
    await this.upsert('guild_settings', { guild_id: guildId, guard_enabled: !!enabled }, 'guild_id');
  }

  getLevel(guildId, userId) {
    const k = this.key(guildId, userId);
    if (!this.userLevels.has(k)) this.userLevels.set(k, { xp: 0, quests: 0, dailyAt: null });
    return this.userLevels.get(k);
  }

  async saveLevel(guildId, userId) {
    const r = this.getLevel(guildId, userId);
    await this.upsert('user_levels', { guild_id: guildId, user_id: userId, xp: r.xp, quests: r.quests, daily_at: r.dailyAt }, 'guild_id,user_id');
  }

  leaderboard(guildId) {
    return [...this.userLevels.entries()]
      .filter(([k]) => k.startsWith(`${guildId}:`))
      .map(([k, v]) => [k.split(':')[1], v])
      .sort((a, b) => b[1].xp - a[1].xp)
      .slice(0, 10);
  }

  trustData(userId, createdAt) {
    if (this.trustScores.has(userId)) return this.trustScores.get(userId);
    const reports = this.scamReports.filter((r) => r.targetId === userId).length;
    const ageDays = Math.max(Math.floor((Date.now() - createdAt.getTime()) / 86400000), 1);
    const score = Math.max(0, Math.min(100, 100 - reports * 15 - (ageDays < 14 ? 30 : 0)));
    const data = { score, reports, ageDays };
    this.trustScores.set(userId, data);
    this.upsert('trust_scores', { user_id: userId, trust_score: score, reports }, 'user_id');
    return data;
  }

  async addReport(guildId, reporterId, targetId, payload) {
    const row = { guildId, reporterId, targetId: targetId || null, payload, createdAt: new Date().toISOString() };
    this.scamReports.push(row);
    await this.insert('scam_reports', { guild_id: guildId, reporter_id: reporterId, target_id: targetId || null, payload, created_at: row.createdAt });
    await this.addSecurityEvent(guildId, 'REPORT', payload, targetId || null);
  }

  async addSecurityEvent(guildId, type, payload, targetId = null) {
    const row = { guildId, type, payload, targetId, createdAt: new Date().toISOString() };
    this.securityEvents.push(row);
    await this.insert('security_events', {
      guild_id: guildId,
      event_type: type,
      payload,
      target_id: targetId,
      created_at: row.createdAt,
    });
  }

  getWeeklySecurityStats(guildId) {
    const since = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const events = this.securityEvents.filter((x) => x.guildId === guildId && new Date(x.createdAt).getTime() >= since);
    const reports = events.filter((x) => x.type === 'REPORT');
    const targets = new Set(reports.map((x) => x.targetId).filter(Boolean));
    const topPatterns = {};
    events.forEach((e) => {
      const text = String(e.payload || '').toLowerCase();
      ['gift', 'nitro', 'airdrop', 'verify', 'wallet', 'login'].forEach((key) => {
        if (text.includes(key)) topPatterns[key] = (topPatterns[key] || 0) + 1;
      });
    });
    const ranked = Object.entries(topPatterns).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { totalEvents: events.length, reports: reports.length, checkedLinks: 0, reportedUsers: targets.size, topPatterns: ranked };
  }

  getSecurityFeed(guildId) {
    const since = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const events = this.securityEvents
      .filter((x) => x.guildId === guildId && new Date(x.createdAt).getTime() >= since)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const reportsPerDay = {};
    const targets = {};
    const keywords = {};

    events.forEach((e) => {
      if (e.type === 'REPORT') {
        const day = new Date(e.createdAt).toISOString().slice(0, 10);
        reportsPerDay[day] = (reportsPerDay[day] || 0) + 1;
        if (e.targetId) targets[e.targetId] = (targets[e.targetId] || 0) + 1;
      }
      const text = String(e.payload || '').toLowerCase();
      ['gift', 'nitro', 'airdrop', 'verify', 'wallet', 'login', 'free', 'claim'].forEach((key) => {
        if (text.includes(key)) keywords[key] = (keywords[key] || 0) + 1;
      });
    });

    const topTargets = Object.entries(targets).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topKeywords = Object.entries(keywords).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return {
      recentEvents: events.slice(0, 10),
      reportsPerDay,
      topTargets,
      topKeywords,
    };
  }

  async setReviver(guildId, channelId, inactivityMinutes, roleId = null) {
    const current = this.reviverConfig.get(guildId) || { paused: false };
    this.reviverConfig.set(guildId, { ...current, channelId, inactivityMinutes, roleId: roleId || null, lastPosted: null });
    await this.upsert('reviver_config', {
      guild_id: guildId,
      channel_id: channelId,
      inactivity_minutes: inactivityMinutes,
      role_id: roleId || null,
      paused: !!current.paused,
    }, 'guild_id');
  }

  async setReviverPaused(guildId, paused) {
    const cfg = this.reviverConfig.get(guildId);
    if (!cfg) return;
    cfg.paused = !!paused;
    this.reviverConfig.set(guildId, cfg);
    await this.upsert('reviver_config', { guild_id: guildId, paused: !!paused }, 'guild_id');
  }

  getReviverStatus(guildId) {
    return this.reviverConfig.get(guildId) || null;
  }

  async learnFaq(guildId, question, answer) {
    const list = this.faqEntries.get(guildId) || [];
    list.push({ question, answer });
    this.faqEntries.set(guildId, list);
    await this.insert('faq_entries', { guild_id: guildId, question, answer });
  }

  faq(guildId) { return this.faqEntries.get(guildId) || []; }

  async deleteFaqByIndex(guildId, index) {
    const list = this.faqEntries.get(guildId) || [];
    if (index < 0 || index >= list.length) return null;
    const [removed] = list.splice(index, 1);
    this.faqEntries.set(guildId, list);
    if (this.sb) {
      try {
        await this.sb.from('faq_entries').delete().eq('guild_id', guildId).eq('question', removed.question).eq('answer', removed.answer).limit(1);
      } catch (e) { log('DB delete faq by index failed', e.message); }
    }
    return removed;
  }

  async deleteFaqByQuestion(guildId, questionText) {
    const list = this.faqEntries.get(guildId) || [];
    const idx = list.findIndex((x) => String(x.question).toLowerCase() === String(questionText).toLowerCase());
    if (idx < 0) return null;
    return this.deleteFaqByIndex(guildId, idx);
  }

  async setLevelRole(guildId, requiredXp, roleId) {
    const list = this.levelRoles.get(guildId) || [];
    const filtered = list.filter((x) => x.roleId !== roleId);
    filtered.push({ requiredXp: Number(requiredXp), roleId });
    filtered.sort((a, b) => a.requiredXp - b.requiredXp);
    this.levelRoles.set(guildId, filtered);
    await this.upsert('level_roles', { guild_id: guildId, required_xp: Number(requiredXp), role_id: roleId }, 'guild_id,role_id');
  }

  getLevelRoles(guildId) {
    return (this.levelRoles.get(guildId) || []).slice().sort((a, b) => a.requiredXp - b.requiredXp);
  }

  recordTriviaWin(guildId, userId, responseMs) {
    const current = this.triviaStats.get(guildId) || { total: 0, wins: {}, fastestMs: null };
    current.total += 1;
    current.wins[userId] = (current.wins[userId] || 0) + 1;
    if (responseMs && (current.fastestMs === null || responseMs < current.fastestMs)) current.fastestMs = responseMs;
    this.triviaStats.set(guildId, current);
  }

  recordTriviaRound(guildId, round) {
    const arr = this.triviaHistory.get(guildId) || [];
    arr.unshift(round);
    this.triviaHistory.set(guildId, arr.slice(0, 20));
  }

  getTriviaStats(guildId) {
    const current = this.triviaStats.get(guildId) || { total: 0, wins: {}, fastestMs: null };
    const topWinners = Object.entries(current.wins).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { total: current.total, topWinners, fastestMs: current.fastestMs };
  }

  getTriviaHistory(guildId) {
    return this.triviaHistory.get(guildId) || [];
  }



  defaultAutomodConfig() {
    return {
      enabled: true,
      inviteFilter: true,
      linkFilter: true,
      mentionFilter: true,
      mentionThreshold: 5,
      banWordsFilter: true,
      emojiFilter: false,
      emojiThreshold: 10,
      stickerFilter: false,
      wallTextFilter: false,
      spoilerFilter: false,
      capsFilter: false,
      warningThreshold: 5,
      timeoutMinutes: 5,
    };
  }

  getAutomodConfig(guildId) {
    if (!this.automodConfig.has(guildId)) this.automodConfig.set(guildId, this.defaultAutomodConfig());
    return this.automodConfig.get(guildId);
  }

  async setAutomodConfig(guildId, patch) {
    const cur = this.getAutomodConfig(guildId);
    const next = {
      ...cur,
      ...patch,
      mentionThreshold: Math.max(1, Math.min(20, Number((patch.mentionThreshold ?? cur.mentionThreshold ?? 5)))),
      emojiThreshold: Math.max(1, Math.min(30, Number((patch.emojiThreshold ?? cur.emojiThreshold ?? 10)))),
      warningThreshold: Math.max(1, Math.min(20, Number((patch.warningThreshold ?? cur.warningThreshold ?? 5)))),
      timeoutMinutes: Math.max(1, Math.min(1440, Number((patch.timeoutMinutes ?? cur.timeoutMinutes ?? 5)))),
      enabled: !!(patch.enabled ?? cur.enabled),
      inviteFilter: !!(patch.inviteFilter ?? cur.inviteFilter),
      linkFilter: !!(patch.linkFilter ?? cur.linkFilter),
      mentionFilter: !!(patch.mentionFilter ?? cur.mentionFilter),
      banWordsFilter: !!(patch.banWordsFilter ?? cur.banWordsFilter),
      emojiFilter: !!(patch.emojiFilter ?? cur.emojiFilter),
      stickerFilter: !!(patch.stickerFilter ?? cur.stickerFilter),
      wallTextFilter: !!(patch.wallTextFilter ?? cur.wallTextFilter),
      spoilerFilter: !!(patch.spoilerFilter ?? cur.spoilerFilter),
      capsFilter: !!(patch.capsFilter ?? cur.capsFilter),
    };
    this.automodConfig.set(guildId, next);
    await this.upsert('automod_config', {
      guild_id: guildId,
      enabled: next.enabled,
      invite_filter: next.inviteFilter,
      link_filter: next.linkFilter,
      mention_filter: next.mentionFilter,
      mention_threshold: next.mentionThreshold,
      banwords_filter: next.banWordsFilter,
      emoji_filter: next.emojiFilter,
      emoji_threshold: next.emojiThreshold,
      sticker_filter: next.stickerFilter,
      wall_text_filter: next.wallTextFilter,
      spoiler_filter: next.spoilerFilter,
      caps_filter: next.capsFilter,
      warning_threshold: next.warningThreshold,
      timeout_minutes: next.timeoutMinutes,
    }, 'guild_id');
    return next;
  }

  getUsedTriviaQuestions(guildId) {
    if (!this.usedTriviaQuestions.has(guildId)) this.usedTriviaQuestions.set(guildId, new Set());
    return this.usedTriviaQuestions.get(guildId);
  }

  async markTriviaQuestionUsed(guildId, question) {
    const q = String(question || '').trim().toLowerCase();
    if (!q) return;
    this.getUsedTriviaQuestions(guildId).add(q);
    await this.upsert('trivia_used_questions', { guild_id: guildId, question: q }, 'guild_id,question');
  }

  getBanWords(guildId) {
    if (!this.banWords.has(guildId)) this.banWords.set(guildId, []);
    return this.banWords.get(guildId);
  }

  async addBanWord(guildId, word) {
    const normalized = String(word || '').trim().toLowerCase();
    if (!normalized) return;
    const list = this.getBanWords(guildId);
    if (!list.includes(normalized)) list.push(normalized);
    this.banWords.set(guildId, list);
    await this.upsert('ban_words', { guild_id: guildId, word: normalized }, 'guild_id,word');
  }

  async removeBanWord(guildId, word) {
    const normalized = String(word || '').trim().toLowerCase();
    const list = this.getBanWords(guildId).filter((w) => w !== normalized);
    this.banWords.set(guildId, list);
    if (this.sb) {
      try { await this.sb.from('ban_words').delete().eq('guild_id', guildId).eq('word', normalized); } catch (e) { log('DB delete ban word failed', e.message); }
    }
  }

  getNoPingTargets(guildId) {
    if (!this.noPingTargets.has(guildId)) this.noPingTargets.set(guildId, []);
    return this.noPingTargets.get(guildId);
  }

  async addNoPingTarget(guildId, target) {
    const normalized = String(target || '').trim().toLowerCase();
    if (!normalized) return;
    const list = this.getNoPingTargets(guildId);
    if (!list.includes(normalized)) list.push(normalized);
    this.noPingTargets.set(guildId, list);
    await this.upsert('no_ping_targets', { guild_id: guildId, target: normalized }, 'guild_id,target');
  }

  async removeNoPingTarget(guildId, target) {
    const normalized = String(target || '').trim().toLowerCase();
    const list = this.getNoPingTargets(guildId).filter((x) => x !== normalized);
    this.noPingTargets.set(guildId, list);
    if (this.sb) {
      try { await this.sb.from('no_ping_targets').delete().eq('guild_id', guildId).eq('target', normalized); } catch (e) { log('DB delete no ping failed', e.message); }
    }
  }

  defaultAutomodRules() {
    return Array.from({ length: 100 }, (_, idx) => ({
      index: idx,
      name: `Rule ${idx + 1}`,
      enabled: false,
      pattern: '',
      matchType: 'contains',
      action: 'delete',
      timeoutMinutes: 10,
    }));
  }

  getAutomodRules(guildId) {
    if (!this.automodRules.has(guildId)) this.automodRules.set(guildId, this.defaultAutomodRules());
    return this.automodRules.get(guildId);
  }

  getAutomodRule(guildId, index) {
    const rules = this.getAutomodRules(guildId);
    const idx = Math.max(0, Math.min(99, Number(index || 0)));
    return rules[idx];
  }

  async setAutomodRule(guildId, index, patch) {
    const rules = this.getAutomodRules(guildId);
    const idx = Math.max(0, Math.min(99, Number(index || 0)));
    const current = rules[idx] || this.defaultAutomodRules()[idx];
    const next = {
      ...current,
      ...patch,
      index: idx,
      name: String((patch.name ?? current.name) || `Rule ${idx + 1}`).slice(0, 80),
      enabled: !!(patch.enabled ?? current.enabled),
      pattern: String((patch.pattern ?? current.pattern) || '').slice(0, 800),
      matchType: String((patch.matchType ?? current.matchType) || 'contains'),
      action: String((patch.action ?? current.action) || 'delete'),
      timeoutMinutes: Math.max(1, Math.min(1440, Number((patch.timeoutMinutes ?? current.timeoutMinutes ?? 10)))),
    };
    rules[idx] = next;
    this.automodRules.set(guildId, rules);
    await this.upsert('automod_rules', {
      guild_id: guildId,
      rule_index: idx,
      name: next.name,
      enabled: next.enabled,
      pattern: next.pattern,
      match_type: next.matchType,
      action: next.action,
      timeout_minutes: next.timeoutMinutes,
    }, 'guild_id,rule_index');
    return next;
  }

  matchAutomodRule(guildId, content) {
    const text = String(content || '');
    if (!text) return null;
    const rules = this.getAutomodRules(guildId);
    for (const rule of rules) {
      if (!rule.enabled || !rule.pattern) continue;
      const source = String(rule.pattern);
      const haystack = text.toLowerCase();
      const needle = source.toLowerCase();
      let ok = false;
      if (rule.matchType === 'equals') ok = haystack === needle;
      else if (rule.matchType === 'startsWith') ok = haystack.startsWith(needle);
      else if (rule.matchType === 'endsWith') ok = haystack.endsWith(needle);
      else if (rule.matchType === 'regex') {
        try { ok = new RegExp(source, 'i').test(text); } catch { ok = false; }
      } else ok = haystack.includes(needle);
      if (ok) return rule;
    }
    return null;
  }

  setAfk(userId, reason = 'AFK') {
    const id = String(userId);
    const row = { reason: String(reason || 'AFK').slice(0, 220), startedAt: new Date().toISOString() };
    this.afkStatus.set(id, row);
    this.upsert('afk_status', { user_id: id, reason: row.reason, started_at: row.startedAt, active: true }, 'user_id');
    return row;
  }

  clearAfk(userId) {
    const id = String(userId);
    this.afkStatus.delete(id);
    this.upsert('afk_status', { user_id: id, active: false, reason: null, started_at: null }, 'user_id');
  }

  getAfk(userId) {
    return this.afkStatus.get(String(userId)) || null;
  }

  backupGuildConfig(guildId) {
    return {
      guildId,
      settings: this.getGuildSettings(guildId),
      reviver: this.reviverConfig.get(guildId) || null,
      levelRoles: this.getLevelRoles(guildId),
      automodRules: this.getAutomodRules(guildId),
      banWords: this.getBanWords(guildId),
      noPingTargets: this.getNoPingTargets(guildId),
      automodConfig: this.getAutomodConfig(guildId),
    };
  }

  async restoreGuildConfig(guildId, data) {
    if (data.settings) {
      this.guildSettings.set(guildId, { ...this.defaultGuildSettings(), ...data.settings });
      await this.upsert('guild_settings', {
        guild_id: guildId,
        prefix: data.settings.prefix || DEFAULT_PREFIX,
        trivia_xp_reward: Number(data.settings.triviaRewardXp || 25),
        draven_logs_channel_id: data.settings.dravenLogsChannelId || null,
        message_xp: Number(data.settings.messageXp || 2),
        daily_xp: Number(data.settings.dailyXp || 50),
        quest_xp: Number(data.settings.questXp || 20),
        guard_enabled: !!data.settings.guardEnabled,
      }, 'guild_id');
    }

    if (data.reviver) {
      await this.setReviver(guildId, data.reviver.channelId, Number(data.reviver.inactivityMinutes), data.reviver.roleId || null);
      await this.setReviverPaused(guildId, !!data.reviver.paused);
    }

    if (Array.isArray(data.levelRoles)) {
      for (const r of data.levelRoles) {
        await this.setLevelRole(guildId, Number(r.requiredXp), r.roleId);
      }
    }

    if (Array.isArray(data.banWords)) {
      for (const w of data.banWords) await this.addBanWord(guildId, w);
    }

    if (Array.isArray(data.noPingTargets)) {
      for (const t of data.noPingTargets) await this.addNoPingTarget(guildId, t);
    }

    if (data.automodConfig) {
      await this.setAutomodConfig(guildId, data.automodConfig);
    }
  }

  setInviteSnapshot(guildId, snapshot) {
    this.inviteCache.set(String(guildId), new Map(Object.entries(snapshot || {})));
  }

  getInviteSnapshot(guildId) {
    if (!this.inviteCache.has(String(guildId))) this.inviteCache.set(String(guildId), new Map());
    return this.inviteCache.get(String(guildId));
  }

  incrementInviterCount(guildId, inviterId) {
    const key = `${guildId}:${inviterId}`;
    const next = Number(this.inviterCounts.get(key) || 0) + 1;
    this.inviterCounts.set(key, next);
    return next;
  }

  getInviterCount(guildId, inviterId) {
    return Number(this.inviterCounts.get(`${guildId}:${inviterId}`) || 0);
  }

  incrementDailyMessageCount(guildId, dateKey = null) {
    const day = dateKey || new Date().toISOString().slice(0, 10);
    const key = `${guildId}:${day}`;
    const next = Number(this.dailyMessageCounts.get(key) || 0) + 1;
    this.dailyMessageCounts.set(key, next);
    return next;
  }

  recordMemberActivity(guildId, userId) {
    const key = `${guildId}:${userId}`;
    this.memberLastActiveAt.set(key, Date.now());
  }

  getActiveMembersCount(guildId, days = 7) {
    const threshold = Date.now() - (Number(days) * 24 * 60 * 60 * 1000);
    let count = 0;
    const prefix = `${guildId}:`;
    for (const [key, lastAt] of this.memberLastActiveAt.entries()) {
      if (key.startsWith(prefix) && Number(lastAt) >= threshold) count += 1;
    }
    return count;
  }

  getDailyMessageCount(guildId, dateKey) {
    return Number(this.dailyMessageCounts.get(`${guildId}:${dateKey}`) || 0);
  }

  getLast7DayMessageSeries(guildId) {
    const labels = [];
    const values = [];
    const now = new Date();
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setUTCDate(now.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
      values.push(this.getDailyMessageCount(guildId, key));
    }
    return { labels, values };
  }

  setInviteTrackingChannel(guildId, channelId) {
    this.inviteTrackingChannels.set(String(guildId), String(channelId));
  }

  getInviteTrackingChannel(guildId) {
    return this.inviteTrackingChannels.get(String(guildId)) || null;
  }

  defaultWelcomeConfig() {
    return {
      enabled: false,
      channelId: null,
      title: 'Welcome to the server!',
      description: 'Please read the rules and enjoy your stay.',
      color: '#5865F2',
      image: null,
      thumbnail: null,
      roleId: null,
    };
  }

  getWelcomeConfig(guildId) {
    const gid = String(guildId);
    if (!this.welcomeConfig.has(gid)) this.welcomeConfig.set(gid, this.defaultWelcomeConfig());
    return this.welcomeConfig.get(gid);
  }

  setWelcomeConfig(guildId, patch = {}) {
    const gid = String(guildId);
    const cur = this.getWelcomeConfig(gid);
    const next = { ...cur, ...patch };
    this.welcomeConfig.set(gid, next);
    return next;
  }

  getWelcomeDraft(guildId, userId) {
    const key = `${guildId}:${userId}`;
    if (!this.welcomeDraft.has(key)) this.welcomeDraft.set(key, { ...this.getWelcomeConfig(guildId) });
    return this.welcomeDraft.get(key);
  }

  setWelcomeDraft(guildId, userId, patch = {}) {
    const key = `${guildId}:${userId}`;
    const cur = this.getWelcomeDraft(guildId, userId);
    const next = { ...cur, ...patch };
    this.welcomeDraft.set(key, next);
    return next;
  }

  saveWelcomeDraft(guildId, userId) {
    const draft = this.getWelcomeDraft(guildId, userId);
    return this.setWelcomeConfig(guildId, draft);
  }

  setWelcomePrompt(guildId, userId, prompt) {
    this.welcomePrompts.set(`${guildId}:${userId}`, { ...prompt });
  }

  getWelcomePrompt(guildId, userId) {
    return this.welcomePrompts.get(`${guildId}:${userId}`) || null;
  }

  clearWelcomePrompt(guildId, userId) {
    this.welcomePrompts.delete(`${guildId}:${userId}`);
  }

}

module.exports = { DataStore };
