const { byName } = require('../commands');
const { replySlash } = require('../utils/respond');
const { makeEmbed } = require('../utils/embed');
const { moduleMap } = require('../ui/helpMenu');
const { sendDravenLog } = require('../utils/dravenlogs');
const { hasManageGuild } = require('../utils/permissions');
const { buildAutomodEmbed, buildAutomodComponents } = require('../commands/automod');
const { buildWelcomeMainButtons, buildWelcomeChangesButtons } = require('../ui/welcomeMenu');

const welcomeChangeSnapshots = new Map();

async function sendWelcomeTemp(channel, text) {
  const msg = await channel?.send({ embeds: [makeEmbed('<:draven_events:1477349264077095125> Welcome Builder', text)] }).catch(() => null);
  if (msg?.delete) setTimeout(() => msg.delete().catch(() => null), 3000);
}

const AUTOMOD_RULE_FIELDS = [
  'inviteFilter',
  'linkFilter',
  'mentionFilter',
  'emojiFilter',
  'stickerFilter',
  'banWordsFilter',
  'wallTextFilter',
  'capsFilter',
  'spoilerFilter',
];

const AUTOMOD_TOGGLE_ACTIONS = {
  toggle_invite: { field: 'inviteFilter', label: 'Invite Filter' },
  toggle_link: { field: 'linkFilter', label: 'Link Filter' },
  toggle_mentions: { field: 'mentionFilter', label: 'Mention Filter' },
  toggle_emoji: { field: 'emojiFilter', label: 'Emoji Filter' },
  toggle_sticker: { field: 'stickerFilter', label: 'Sticker Filter' },
  toggle_banwords: { field: 'banWordsFilter', label: 'Ban Words Filter' },
  toggle_walltext: { field: 'wallTextFilter', label: 'Wall Text Filter' },
  toggle_caps: { field: 'capsFilter', label: 'Caps Filter' },
  toggle_spoiler: { field: 'spoilerFilter', label: 'Spoiler Filter' },
};

async function sendAutomodAlert(interaction, text) {
  const msg = await interaction.channel?.send({ embeds: [makeEmbed('<:draven_security:1477349313482063912> Automod Update', text)] }).catch(() => null);
  if (msg?.delete) setTimeout(() => msg.delete().catch(() => null), 2000);
}

async function updateAutomodPanel(interaction, store) {
  return interaction.update({ embeds: [buildAutomodEmbed(store, interaction.guildId, interaction.user.tag)], components: buildAutomodComponents() });
}

async function updateWelcomePreview(interaction, store, ui, patch) {
  const draft = store.setWelcomeDraft(interaction.guildId, interaction.user.id, patch);
  return interaction.update({ embeds: [ui.buildWelcomePreview(draft, interaction.guild)], components: interaction.message.components });
}

function beginWelcomePrompt(interaction, store, field, hint) {
  const prompt = {
    field,
    channelId: interaction.channelId,
    messageId: interaction.message?.id || null,
    view: interaction.message?.components?.some((row) => row.components?.some((c) => String(c.customId || '').includes('change_'))) ? 'changes' : 'main',
    expiresAt: Date.now() + (10 * 60 * 1000),
  };
  store.setWelcomePrompt(interaction.guildId, interaction.user.id, prompt);
  setTimeout(async () => {
    const active = store.getWelcomePrompt(interaction.guildId, interaction.user.id);
    if (!active || active.field !== field) return;
    if (Date.now() < Number(active.expiresAt || 0)) return;
    store.clearWelcomePrompt(interaction.guildId, interaction.user.id);
    const channel = interaction.guild?.channels?.cache?.get(active.channelId);
    await sendWelcomeTemp(channel, '10 mins timeout reached, try again.');
  }, 10 * 60 * 1000 + 1000);
  return sendWelcomeTemp(interaction.channel, hint).then(() => interaction.deferUpdate().catch(() => null));
}

function registerOnInteractionCreate(client, store, ai) {
  client.on('interactionCreate', async (interaction) => {
    try {
      if (interaction.isButton()) {
        if (interaction.customId === 'help-mode-slash') {
          return replySlash(interaction, makeEmbed('<:draven_utility:1477349327092322377> Slash Commands Guide', 'Use `/command` style. Slash responses are private and clean by default.'));
        }
        if (interaction.customId === 'help-mode-prefix') {
          return replySlash(interaction, makeEmbed('<:draven_utility:1477349327092322377> Prefix Commands Guide', 'Use `=command` style. Prefix commands remove invocation and keep channel clean.'));
        }

        if (interaction.customId.startsWith('welcome:')) {
          if (!hasManageGuild(interaction.memberPermissions)) return replySlash(interaction, makeEmbed('<:draven_no_permission:1477349273535385776> Permission Denied', 'Manage Server is required.'));
          const ui = byName.get('welcome')?.ui;
          if (!ui) return;
          const draft = store.getWelcomeDraft(interaction.guildId, interaction.user.id);
          const snapKey = `${interaction.guildId}:${interaction.user.id}`;

          if (interaction.customId === 'welcome:title' || interaction.customId === 'welcome:change_title') return beginWelcomePrompt(interaction, store, 'title', 'Type the **title** in chat within 10 minutes.');
          if (interaction.customId === 'welcome:description' || interaction.customId === 'welcome:change_description') return beginWelcomePrompt(interaction, store, 'description', 'Type the **description** in chat within 10 minutes.');
          if (interaction.customId === 'welcome:color' || interaction.customId === 'welcome:change_color') return beginWelcomePrompt(interaction, store, 'color', 'Type the **color hex** in chat within 10 minutes (example `#FF8C00`).');
          if (interaction.customId === 'welcome:image') return beginWelcomePrompt(interaction, store, 'image', 'Type the **image URL** in chat within 10 minutes.');
          if (interaction.customId === 'welcome:role' || interaction.customId === 'welcome:change_role') return beginWelcomePrompt(interaction, store, 'role', 'Type or mention the **role** in chat within 10 minutes (e.g. `@Member`).');
          if (interaction.customId === 'welcome:test') {
            const channel = interaction.guild.channels.cache.get(draft.channelId) || interaction.channel;
            const preview = ui.buildWelcomePreview(draft, interaction.guild);
            preview.setTitle(draft.title || 'Test Welcome Message');
            preview.setDescription((draft.description || 'Welcome {user}!').replace('{user}', `${interaction.user}`));
            await channel.send({ embeds: [preview] }).catch(() => null);
            await sendWelcomeTemp(interaction.channel, `Test message sent to ${channel}.`);
            return interaction.deferUpdate().catch(() => null);
          }
          if (interaction.customId === 'welcome:make_changes') {
            welcomeChangeSnapshots.set(snapKey, { ...draft });
            return interaction.update({ embeds: [ui.buildWelcomePreview(draft, interaction.guild)], components: buildWelcomeChangesButtons() });
          }
          if (interaction.customId === 'welcome:save_changes') {
            store.saveWelcomeDraft(interaction.guildId, interaction.user.id);
            welcomeChangeSnapshots.delete(snapKey);
            const next = store.getWelcomeDraft(interaction.guildId, interaction.user.id);
            return interaction.update({ embeds: [ui.buildWelcomePreview(next, interaction.guild)], components: buildWelcomeMainButtons() });
          }
          if (interaction.customId === 'welcome:back') {
            const snap = welcomeChangeSnapshots.get(snapKey);
            if (snap) store.setWelcomeDraft(interaction.guildId, interaction.user.id, snap);
            welcomeChangeSnapshots.delete(snapKey);
            const next = store.getWelcomeDraft(interaction.guildId, interaction.user.id);
            return interaction.update({ embeds: [ui.buildWelcomePreview(next, interaction.guild)], components: buildWelcomeMainButtons() });
          }
          if (interaction.customId === 'welcome:save') {
            store.saveWelcomeDraft(interaction.guildId, interaction.user.id);
            await interaction.update({ components: [] });
            return interaction.followUp({ embeds: [makeEmbed('<:draven_checkmark:1477349260730175712> Welcome Saved', 'Welcome configuration has been saved and enabled.')], ephemeral: true });
          }
          if (interaction.customId === 'welcome:exit') return interaction.update({ components: [] });
        }

        if (interaction.customId.startsWith('automod:')) {
          if (!hasManageGuild(interaction.memberPermissions)) return replySlash(interaction, makeEmbed('<:draven_no_permission:1477349273535385776> Permission Denied', 'Manage Server is required.'));
          if (interaction.customId === 'automod:enable') {
            await store.setAutomodConfig(interaction.guildId, { enabled: true });
            await sendAutomodAlert(interaction, 'Rule updated: **Automod Enabled**.');
          }
          if (interaction.customId === 'automod:disable') {
            await store.setAutomodConfig(interaction.guildId, { enabled: false });
            await sendAutomodAlert(interaction, 'Rule updated: **Automod Disabled**.');
          }
          if (interaction.customId === 'automod:enable_all') {
            const patch = Object.fromEntries(AUTOMOD_RULE_FIELDS.map((field) => [field, true]));
            await store.setAutomodConfig(interaction.guildId, patch);
            await sendAutomodAlert(interaction, 'All automod rules are now **Enabled**.');
          }
          if (interaction.customId === 'automod:disable_all') {
            const patch = Object.fromEntries(AUTOMOD_RULE_FIELDS.map((field) => [field, false]));
            await store.setAutomodConfig(interaction.guildId, patch);
            await sendAutomodAlert(interaction, 'All automod rules are now **Disabled**.');
          }
          if (interaction.customId === 'automod:exit') return interaction.update({ components: [] });
          return updateAutomodPanel(interaction, store);
        }
      }

      if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'help-module') {
          const selected = moduleMap[interaction.values[0]];
          if (selected) await replySlash(interaction, makeEmbed(selected.title, 'Available commands in this module.', [['—', `\`\`\`${selected.body}\`\`\``]]));
          return;
        }

        if (interaction.customId === 'faq-select') {
          const entries = store.faq(interaction.guildId);
          const raw = interaction.values[0];
          if (raw === 'faq-none') return replySlash(interaction, makeEmbed('<:draven_utility:1477349327092322377> FAQ', 'No entries available.'));
          const idx = Number(raw.replace('faq-', ''));
          const entry = entries[idx];
          if (!entry) return replySlash(interaction, makeEmbed('<:draven_utility:1477349327092322377> FAQ', 'Entry not found.'));
          return replySlash(interaction, makeEmbed('<:draven_utility:1477349327092322377> FAQ', entry.answer, [['Question', entry.question]]));
        }

        if (interaction.customId === 'automod:action') {
          if (!hasManageGuild(interaction.memberPermissions)) return replySlash(interaction, makeEmbed('<:draven_no_permission:1477349273535385776> Permission Denied', 'Manage Server is required.'));
          const choice = interaction.values[0];
          const cfg = store.getAutomodConfig(interaction.guildId);
          let alertText = `Rule updated: **${choice.replace(/_/g, ' ')}**.`;
          const toggle = AUTOMOD_TOGGLE_ACTIONS[choice];
          if (toggle) {
            const nextValue = !cfg[toggle.field];
            await store.setAutomodConfig(interaction.guildId, { [toggle.field]: nextValue });
            alertText = `Rule updated: **${toggle.label} ${nextValue ? 'Enabled' : 'Disabled'}**.`;
          }
          if (choice === 'mention_up') {
            const next = cfg.mentionThreshold + 1;
            await store.setAutomodConfig(interaction.guildId, { mentionThreshold: next });
            alertText = `Rule updated: **Mention Threshold ${next}**.`;
          }
          if (choice === 'mention_down') {
            const next = cfg.mentionThreshold - 1;
            await store.setAutomodConfig(interaction.guildId, { mentionThreshold: next });
            alertText = `Rule updated: **Mention Threshold ${next}**.`;
          }
          if (choice === 'emoji_up') {
            const next = cfg.emojiThreshold + 1;
            await store.setAutomodConfig(interaction.guildId, { emojiThreshold: next });
            alertText = `Rule updated: **Emoji Threshold ${next}**.`;
          }
          if (choice === 'emoji_down') {
            const next = cfg.emojiThreshold - 1;
            await store.setAutomodConfig(interaction.guildId, { emojiThreshold: next });
            alertText = `Rule updated: **Emoji Threshold ${next}**.`;
          }
          if (choice === 'timeout_up') {
            const next = cfg.timeoutMinutes + 1;
            await store.setAutomodConfig(interaction.guildId, { timeoutMinutes: next });
            alertText = `Rule updated: **Timeout ${next} minutes**.`;
          }
          if (choice === 'timeout_down') {
            const next = cfg.timeoutMinutes - 1;
            await store.setAutomodConfig(interaction.guildId, { timeoutMinutes: next });
            alertText = `Rule updated: **Timeout ${next} minutes**.`;
          }
          await sendAutomodAlert(interaction, alertText);
          return updateAutomodPanel(interaction, store);
        }
      }

      if (!interaction.isChatInputCommand()) return;
      if (!interaction.guildId) return replySlash(interaction, makeEmbed('<:draven_no_permission:1477349273535385776> Server Only', 'This command can only be used inside a server.'));

      const cmd = byName.get(interaction.commandName);
      if (!cmd?.slash) return;

      await sendDravenLog(interaction.guild, store, 'COMMAND SLASH EXECUTED', `User: <@${interaction.user.id}>\nCommand: /${interaction.commandName}`);
      await cmd.slash({ interaction, store, ai, client });
    } catch {
      if (interaction.isRepliable()) await replySlash(interaction, makeEmbed('<:draven_no_permission:1477349273535385776> Error', 'Unable to complete command.')).catch(() => null);
      if (interaction.guild) await sendDravenLog(interaction.guild, store, 'COMMAND SLASH FAILED', `User: <@${interaction.user.id}>\nCommand: /${interaction.commandName || 'unknown'}`);
    }
  });
}

module.exports = { registerOnInteractionCreate };
