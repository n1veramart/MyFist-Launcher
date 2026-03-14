const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { hasManageGuild } = require('../utils/permissions');
const { sendDravenLog } = require('../utils/dravenlogs');

module.exports = {
  name: 'dravenlogs',
  async prefix({ message, store }) {
    if (!hasManageGuild(message.member)) return;
    const channel = message.mentions.channels.first();
    if (!channel) return replyPrefix(message, makeEmbed('<:draven_logs:1477349271438098657> Draven Logs', 'Use: dravenlogs #channel'));
    await store.setDravenLogsChannel(message.guild.id, channel.id);
    await sendDravenLog(message.guild, store, 'DRAVEN LOGS UPDATED', `By: <@${message.author.id}>\nChannel: <#${channel.id}>`);
    await replyPrefix(message, makeEmbed('<:draven_logs:1477349271438098657> Draven Logs', `Draven logs channel set to ${channel}.`));
  },
  async slash({ interaction, store }) {
    if (!hasManageGuild(interaction.memberPermissions)) return replySlash(interaction, makeEmbed('<:draven_no_permission:1477349273535385776> Permission Denied', 'Manage Server is required.'));
    const channel = interaction.options.getChannel('channel', true);
    await store.setDravenLogsChannel(interaction.guildId, channel.id);
    await sendDravenLog(interaction.guild, store, 'DRAVEN LOGS UPDATED', `By: <@${interaction.user.id}>\nChannel: <#${channel.id}>`);
    await replySlash(interaction, makeEmbed('<:draven_logs:1477349271438098657> Draven Logs', `Draven logs channel set to ${channel}.`));
  },
};
