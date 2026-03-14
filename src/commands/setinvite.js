const { ChannelType } = require('discord.js');
const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { hasManageGuild } = require('../utils/permissions');

function okEmbed(channel) {
  return makeEmbed(
    '<:draven_checkmark:1477349260730175712> Invite Tracking Configured',
    `Invite tracking announcements will be posted in ${channel}.`
  );
}

module.exports = {
  name: 'setinvite',
  async prefix({ message, args, store }) {
    if (!hasManageGuild(message.member)) return;
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
    if (!channel || channel.type !== ChannelType.GuildText) {
      return replyPrefix(message, makeEmbed('<:draven_no_permission:1477349273535385776> Set Invite', 'Usage: `=setinvite #channel` (text channel only).'));
    }
    store.setInviteTrackingChannel(message.guild.id, channel.id);
    return replyPrefix(message, okEmbed(channel), [], { autoDelete: true });
  },
  async slash({ interaction, store }) {
    if (!hasManageGuild(interaction.memberPermissions)) return replySlash(interaction, makeEmbed('<:draven_no_permission:1477349273535385776> Permission Denied', 'Manage Server is required.'));
    const channel = interaction.options.getChannel('channel', true);
    if (channel.type !== ChannelType.GuildText) {
      return replySlash(interaction, makeEmbed('<:draven_no_permission:1477349273535385776> Set Invite', 'Please choose a text channel.'), [], { ephemeral: true });
    }
    store.setInviteTrackingChannel(interaction.guildId, channel.id);
    return replySlash(interaction, okEmbed(channel), [], { ephemeral: false, autoDelete: true });
  },
};
