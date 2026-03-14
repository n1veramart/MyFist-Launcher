const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const { makeEmbed } = require('../utils/embed');

const PAGE_SIZE = 25;

function clampPage(page) {
  const p = Number(page) || 0;
  return Math.max(0, Math.min(3, p));
}

function ruleLabel(rule, idx) {
  const icon = rule.enabled ? '🟢' : '⚪';
  return `${icon} #${idx + 1} ${rule.name || `Rule ${idx + 1}`}`.slice(0, 100);
}

function safeValue(v, fallback) {
  const out = String(v || '').trim();
  return out || fallback;
}

function buildAutomodEmbed(store, guildId, page = 0, selectedIndex = 0) {
  const rules = store.getAutomodRules(guildId);
  const currentPage = clampPage(page);
  const start = currentPage * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const selected = Math.max(start, Math.min(end - 1, Number(selectedIndex) || start));
  const rule = rules[selected];
  const enabledCount = rules.filter((r) => r.enabled).length;

  return makeEmbed(
    '🛡️ AutoMod Configuration',
    'Permanent control panel for guild AutoMod. Configure up to **100** fully customizable rules.',
    [
      ['<:draven_chart:1477349258054340813> Overview', `Enabled: **${enabledCount}/100**\nPage: **${currentPage + 1}/4**\nSelected: **Rule #${selected + 1}**`],
      ['<:draven_tag:1477359687702679603> Rule Name', safeValue(rule?.name, `Rule ${selected + 1}`)],
      ['<:draven_target:1477349317726699551> Pattern', safeValue(rule?.pattern, '(empty — disabled behavior)')],
      ['<:draven_progress:1477349293063934103> Match Type', safeValue(rule?.matchType, 'contains')],
      ['<:draven_status:1477349315461644308> Action', safeValue(rule?.action, 'delete')],
      ['<:draven_age:1477359697559425218> Timeout Minutes', `${Number(rule?.timeoutMinutes || 10)}`],
      ['<:draven_checkmark:1477349260730175712> Enabled', rule?.enabled ? 'Yes' : 'No'],
      ['<:draven_pin:1477349275343126664> How to Use', '1) Select a rule\n2) Toggle enable\n3) Edit fields via modal\nRules run on every message in this guild.'],
    ]
  );
}

function buildAutomodComponents(store, guildId, page = 0, selectedIndex = 0) {
  const rules = store.getAutomodRules(guildId);
  const currentPage = clampPage(page);
  const start = currentPage * PAGE_SIZE;
  const pageRules = rules.slice(start, start + PAGE_SIZE);
  const selected = Math.max(start, Math.min(start + PAGE_SIZE - 1, Number(selectedIndex) || start));

  const select = new StringSelectMenuBuilder()
    .setCustomId(`automod:select:${currentPage}`)
    .setPlaceholder('Select AutoMod rule')
    .addOptions(pageRules.map((r, i) => ({
      label: ruleLabel(r, start + i),
      value: String(start + i),
      description: `${r.matchType || 'contains'} • ${r.action || 'delete'}`.slice(0, 100),
      default: (start + i) === selected,
    })));

  const nav = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`automod:page:${Math.max(0, currentPage - 1)}:${selected}`).setLabel('◀ Prev').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`automod:page:${Math.min(3, currentPage + 1)}:${selected}`).setLabel('Next ▶').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`automod:refresh:${currentPage}:${selected}`).setLabel('Refresh').setStyle(ButtonStyle.Primary)
  );

  const actions = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`automod:toggle:${currentPage}:${selected}`).setLabel('Enable/Disable').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`automod:edit:${currentPage}:${selected}`).setLabel('Edit Rule').setStyle(ButtonStyle.Primary)
  );

  return [new ActionRowBuilder().addComponents(select), nav, actions];
}

function buildAutomodModal(ruleIndex, page, rule) {
  return new ModalBuilder()
    .setCustomId(`automod:modal:${page}:${ruleIndex}`)
    .setTitle(`Edit AutoMod Rule #${ruleIndex + 1}`)
    .addComponents(
      new ActionRowBuilder().addComponents(new TextInputBuilder()
        .setCustomId('name')
        .setLabel('Rule name')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(80)
        .setValue(safeValue(rule?.name, `Rule ${ruleIndex + 1}`))),
      new ActionRowBuilder().addComponents(new TextInputBuilder()
        .setCustomId('pattern')
        .setLabel('Pattern (text or regex body)')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setMaxLength(800)
        .setValue(String(rule?.pattern || ''))),
      new ActionRowBuilder().addComponents(new TextInputBuilder()
        .setCustomId('matchType')
        .setLabel('Match type: contains|equals|startsWith|endsWith|regex')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(20)
        .setValue(safeValue(rule?.matchType, 'contains'))),
      new ActionRowBuilder().addComponents(new TextInputBuilder()
        .setCustomId('action')
        .setLabel('Action: delete|warn|timeout|log')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(20)
        .setValue(safeValue(rule?.action, 'delete'))),
      new ActionRowBuilder().addComponents(new TextInputBuilder()
        .setCustomId('timeoutMinutes')
        .setLabel('Timeout minutes (for timeout action)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(4)
        .setValue(String(Number(rule?.timeoutMinutes || 10))))
    );
}

module.exports = {
  PAGE_SIZE,
  buildAutomodEmbed,
  buildAutomodComponents,
  buildAutomodModal,
  clampPage,
};
