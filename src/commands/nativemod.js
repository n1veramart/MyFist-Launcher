const { makeEmbed } = require('../utils/embed');
const { replySlash } = require('../utils/respond');
const { hasManageGuild } = require('../utils/permissions');

const CUSTOM_BLOCK_MESSAGE = 'Blocked by Draven AutoMod. Please keep our community safe!';
const LOADER_DURATION_MS = 3000;

function progressBar(percent) {
  const width = 20;
  const filled = Math.round((Math.max(0, Math.min(100, percent)) / 100) * width);
  return `${'█'.repeat(filled)}${'░'.repeat(width - filled)}`;
}

function buildLoaderEmbed(percent) {
  return makeEmbed(
    '<:draven_loading:1477349269122973716> Native AutoMod Loading',
    `Deploying community safety rules...\n\n[${progressBar(percent)}] **${percent}%**`
  );
}

const RULE_BLUEPRINTS = [
  {
    name: 'Native Protection A',
    eventType: 1,
    triggerType: 1,
    triggerMetadata: { keywordFilter: ['discord.gg/', 'discord.com/invite/'], allowList: [], regexPatterns: [] },
  },
  {
    name: 'Native Protection B',
    eventType: 1,
    triggerType: 1,
    triggerMetadata: { keywordFilter: ['free nitro', 'steam gift'], allowList: [], regexPatterns: [] },
  },
  {
    name: 'Native Protection C',
    eventType: 1,
    triggerType: 1,
    triggerMetadata: { keywordFilter: ['raider', 'raid incoming'], allowList: [], regexPatterns: [] },
  },
  {
    name: 'Native Protection D',
    eventType: 1,
    triggerType: 1,
    triggerMetadata: { keywordFilter: ['go kill yourself', 'kys'], allowList: [], regexPatterns: [] },
  },
  {
    name: 'Native Protection E',
    eventType: 1,
    triggerType: 1,
    triggerMetadata: { keywordFilter: ['nigger', 'faggot'], allowList: [], regexPatterns: [] },
  },
  {
    name: 'Native Protection F',
    eventType: 1,
    triggerType: 1,
    triggerMetadata: { keywordFilter: ['join my server now', '@everyone raid'], allowList: [], regexPatterns: [] },
  },
  {
    name: 'Native Spam Shield',
    eventType: 1,
    triggerType: 3,
    triggerMetadata: {},
  },
  {
    name: 'Native Profanity Filter',
    eventType: 1,
    triggerType: 4,
    triggerMetadata: { presets: [1], allowList: [] },
  },
  {
    name: 'Native Mention Guard',
    eventType: 1,
    triggerType: 5,
    triggerMetadata: { mentionTotalLimit: 5, mentionRaidProtectionEnabled: true },
  },
];

function action(custom = true) {
  return custom
    ? [{ type: 1, metadata: { customMessage: CUSTOM_BLOCK_MESSAGE } }]
    : [{ type: 1 }];
}

async function upsertRule(guild, existingRule, blueprint) {
  if (existingRule) {
    const baseEdit = {
      name: blueprint.name,
      triggerMetadata: blueprint.triggerMetadata,
      enabled: true,
    };
    try {
      await existingRule.edit({ ...baseEdit, actions: action(true) });
      return true;
    } catch {
      await existingRule.edit({ ...baseEdit, actions: action(false) });
      return true;
    }
  }

  try {
    await guild.autoModerationRules.create({
      name: blueprint.name,
      eventType: blueprint.eventType,
      triggerType: blueprint.triggerType,
      triggerMetadata: blueprint.triggerMetadata,
      actions: action(true),
      enabled: true,
    });
    return true;
  } catch {
    await guild.autoModerationRules.create({
      name: blueprint.name,
      eventType: blueprint.eventType,
      triggerType: blueprint.triggerType,
      triggerMetadata: blueprint.triggerMetadata,
      actions: action(false),
      enabled: true,
    });
    return true;
  }
}

async function enrollNativeRules(guild) {
  const existing = await guild.autoModerationRules.fetch();
  const existingByName = new Map(existing.map((rule) => [rule.name, rule]));

  let failed = 0;
  for (const blueprint of RULE_BLUEPRINTS) {
    try {
      const current = existingByName.get(blueprint.name) || null;
      await upsertRule(guild, current, blueprint);
    } catch {
      failed += 1;
    }
  }

  const refreshed = await guild.autoModerationRules.fetch();
  const enabledCount = RULE_BLUEPRINTS.filter((bp) => {
    const rule = refreshed.find((r) => r.name === bp.name);
    const hasBlockAction = Array.isArray(rule?.actions) && rule.actions.some((a) => Number(a.type) === 1);
    return !!rule?.enabled && hasBlockAction;
  }).length;

  return { enabledCount, failed };
}

async function runLoaderUntilReady(messageLike, job) {
  const start = Date.now();
  let pct = 10;
  let done = false;

  const timer = setInterval(() => {
    if (done) return;
    pct = Math.min(95, pct + 7);
    messageLike.edit({ embeds: [buildLoaderEmbed(pct)] }).catch(() => null);
  }, 350);

  await messageLike.edit({ embeds: [buildLoaderEmbed(pct)] }).catch(() => null);

  try {
    const result = await job();
    const elapsed = Date.now() - start;
    if (elapsed < LOADER_DURATION_MS) await new Promise((r) => setTimeout(r, LOADER_DURATION_MS - elapsed));
    done = true;
    clearInterval(timer);
    await messageLike.edit({ embeds: [buildLoaderEmbed(100)] }).catch(() => null);
    return result;
  } finally {
    done = true;
    clearInterval(timer);
  }
}

function buildResultEmbed(enabledCount, failed) {
  const healthy = enabledCount === RULE_BLUEPRINTS.length && failed === 0;
  const status = healthy
    ? 'All rules active with custom community responses.'
    : 'Some rules could not be activated. Check bot permissions and AutoMod limits.';
  return makeEmbed(
    '<:draven_security:1477349313482063912> Native AutoMod Enrollment',
    `Rules Deployed: ${enabledCount}/${RULE_BLUEPRINTS.length} Successful\n\nStatus: ${status}`
  );
}

module.exports = {
  name: 'nativemod',
  async prefix({ message }) {
    if (!hasManageGuild(message.member)) return;
    await message.delete().catch(() => null);
    const loading = await message.channel.send({ embeds: [buildLoaderEmbed(10)] });
    try {
      const { enabledCount, failed } = await runLoaderUntilReady(loading, async () => enrollNativeRules(message.guild));
      await loading.edit({ embeds: [buildResultEmbed(enabledCount, failed)] });
    } catch {
      await loading.edit({ embeds: [makeEmbed('<:draven_no_permission:1477349273535385776> Error', 'Native AutoMod deployment failed. Please try again.')] }).catch(() => null);
    }
  },
  async slash({ interaction }) {
    if (!hasManageGuild(interaction.memberPermissions)) {
      return replySlash(interaction, makeEmbed('<:draven_no_permission:1477349273535385776> Permission Denied', 'Manage Server is required.'));
    }

    await interaction.deferReply({ ephemeral: true });
    const loadingMessage = { edit: (payload) => interaction.editReply(payload) };

    try {
      const { enabledCount, failed } = await runLoaderUntilReady(loadingMessage, async () => enrollNativeRules(interaction.guild));
      await interaction.editReply({ embeds: [buildResultEmbed(enabledCount, failed)] });
    } catch {
      await interaction.editReply({ embeds: [makeEmbed('<:draven_no_permission:1477349273535385776> Error', 'Native AutoMod deployment failed. Please try again.')] }).catch(() => null);
    }
  },
};
