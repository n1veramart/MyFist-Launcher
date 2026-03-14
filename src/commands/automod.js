const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { hasManageGuild } = require('../utils/permissions');

function boolDot(v) {
  return v ? '`Enabled`' : '`Disabled`';
}

function buildAutomodEmbed(store, guildId, requester = '') {
  const cfg = store.getAutomodConfig(guildId);
  return makeEmbed('<:draven_security:1477349313482063912> Automod', 'Interactive guild-wide automod panel.', [
    ['Enabled', `**${cfg.enabled}**`],
    ['Discord Invite Filter', boolDot(cfg.inviteFilter)],
    ['Link Filter', boolDot(cfg.linkFilter)],
    ['Spam Mention Filter Threshold', cfg.mentionFilter ? `**${cfg.mentionThreshold}**` : '`Disabled`'],
    ['Spam Emoji Filter Threshold', cfg.emojiFilter ? `**${cfg.emojiThreshold}**` : '`Disabled`'],
    ['Sticker Filter', boolDot(cfg.stickerFilter)],
    ['Ban Words Filter', boolDot(cfg.banWordsFilter)],
    ['Wall Text Filter', boolDot(cfg.wallTextFilter)],
    ['Caps Filter', boolDot(cfg.capsFilter)],
    ['Spoiler Filter', boolDot(cfg.spoilerFilter)],
    ['Ignored Channels', 'None'],
    ['Ignored Roles', 'None'],
    ['Ignored Users', 'None'],
    ['Warning threshold', `${cfg.warningThreshold}`],
    ['Punishment timeout', `${cfg.timeoutMinutes} minutes`],
    ['Requested by', requester || 'Admin'],
  ]);
}

function buildAutomodComponents() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('automod:enable').setLabel('Enable').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('automod:disable').setLabel('Disable').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('automod:enable_all').setLabel('Enable All Rules').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('automod:disable_all').setLabel('Disable All Rules').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('automod:exit').setLabel('Exit').setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('automod:action')
        .setPlaceholder('Make a selection')
        .addOptions([
          { label: 'Toggle Invite Filter', value: 'toggle_invite' },
          { label: 'Toggle Link Filter', value: 'toggle_link' },
          { label: 'Toggle Mention Filter', value: 'toggle_mentions' },
          { label: 'Toggle Emoji Filter', value: 'toggle_emoji' },
          { label: 'Toggle Sticker Filter', value: 'toggle_sticker' },
          { label: 'Toggle Ban Words Filter', value: 'toggle_banwords' },
          { label: 'Toggle Wall Text Filter', value: 'toggle_walltext' },
          { label: 'Toggle Caps Filter', value: 'toggle_caps' },
          { label: 'Toggle Spoiler Filter', value: 'toggle_spoiler' },
          { label: 'Mention Threshold +1', value: 'mention_up' },
          { label: 'Mention Threshold -1', value: 'mention_down' },
          { label: 'Emoji Threshold +1', value: 'emoji_up' },
          { label: 'Emoji Threshold -1', value: 'emoji_down' },
          { label: 'Timeout +1 minute', value: 'timeout_up' },
          { label: 'Timeout -1 minute', value: 'timeout_down' },
        ])
    ),
  ];
}

module.exports = {
  name: 'automod',
  buildAutomodEmbed,
  buildAutomodComponents,
  async prefix({ message, store }) {
    if (!hasManageGuild(message.member)) return;
    await message.delete().catch(() => null);
    await message.channel.send({
      embeds: [buildAutomodEmbed(store, message.guild.id, message.author.tag)],
      components: buildAutomodComponents(),
    });
  },
  async slash({ interaction, store }) {
    if (!hasManageGuild(interaction.memberPermissions)) {
      return replySlash(interaction, makeEmbed('<:draven_no_permission:1477349273535385776> Permission Denied', 'Manage Server is required.'));
    }
    await interaction.reply({
      embeds: [buildAutomodEmbed(store, interaction.guildId, interaction.user.tag)],
      components: buildAutomodComponents(),
      ephemeral: false,
    });
  },
};
