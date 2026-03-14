const { makeEmbed } = require('../utils/embed');
const { REVIVER_MIN_INACTIVITY_MINUTES, TRIVIA_TIMEOUT_MS } = require('../config/constants');
const { sendDravenLog } = require('../utils/dravenlogs');

class ReviverService {
  constructor(client, store, ai) {
    this.client = client;
    this.store = store;
    this.ai = ai;
  }

  async pickPrompt() {
    const aiPrompt = await this.ai.randomReviverPrompt('inactive discord channel revival');
    if (aiPrompt) return aiPrompt;
    const prompts = [
      'What tool has saved you most time this month?',
      'What is one goal for this week?',
      'Share one useful resource you found recently.',
      'What is one workflow you improved lately?',
      'What is a challenge you solved this week?',
    ];
    return prompts[Math.floor(Math.random() * prompts.length)];
  }

  start() {
    setInterval(async () => {
      for (const [guildId, cfg] of this.store.reviverConfig.entries()) {
        if (cfg.paused) continue;

        const guild = this.client.guilds.cache.get(guildId);
        const channel = guild?.channels?.cache?.get(cfg.channelId);
        if (!channel?.isTextBased()) continue;

        const last = this.store.lastActivity.get(channel.id) || new Date(0);
        const cfgMinutes = Number(cfg.inactivityMinutes || REVIVER_MIN_INACTIVITY_MINUTES);
        const effectiveMinutes = Math.max(cfgMinutes, REVIVER_MIN_INACTIVITY_MINUTES);
        const thresholdMs = effectiveMinutes * 60000;

        if (cfg.lastPosted && Date.now() - cfg.lastPosted < TRIVIA_TIMEOUT_MS) continue;

        if (Date.now() - last.getTime() >= thresholdMs) {
          const prompt = await this.pickPrompt();
          const content = cfg.roleId ? `<@&${cfg.roleId}>` : undefined;
          await channel.send({ content, embeds: [makeEmbed('<:draven_chart:1477349258054340813> Discussion Starter', prompt)] }).catch(() => null);

          cfg.lastPosted = Date.now();
          const nextUnix = Math.floor((cfg.lastPosted + thresholdMs) / 1000);
          await sendDravenLog(
            guild,
            this.store,
            'REVIVER POSTED',
            `Channel: <#${channel.id}>\nPrompt: ${prompt}\nNext eligible post: <t:${nextUnix}:F> (<t:${nextUnix}:R>)`
          );
        }
      }
    }, 60000);
  }
}

module.exports = { ReviverService };
