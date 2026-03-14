const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { hasManageGuild } = require('../utils/permissions');
const { REVIVER_MIN_INACTIVITY_MINUTES } = require('../config/constants');
const { sendDravenLog } = require('../utils/dravenlogs');

module.exports = {
  name: 'setupreviver',
  async prefix({ message, store, args }) {
    if (!hasManageGuild(message.member)) return;
    const channel = message.mentions.channels.first();
    const role = message.mentions.roles.first();
    const mins = Number(args.find((x) => /^\d+$/.test(x)));
    if (!channel || !mins) return replyPrefix(message, makeEmbed('<:draven_chart:1477349258054340813> Reviver Config', `Use: setupreviver #channel <minutes> [@role] (minimum ${REVIVER_MIN_INACTIVITY_MINUTES} minutes)`));
    if (mins < REVIVER_MIN_INACTIVITY_MINUTES) {
      return replyPrefix(message, makeEmbed('<:draven_chart:1477349258054340813> Reviver Config', `Minimum inactivity is **${REVIVER_MIN_INACTIVITY_MINUTES} minutes**. Configuration not saved.`));
    }
    await store.setReviver(message.guild.id, channel.id, mins, role?.id || null);
    await sendDravenLog(message.guild, store, 'REVIVER CONFIG UPDATED', `By <@${message.author.id}>\nChannel: <#${channel.id}>\nMinutes: ${mins}\nRole ping: ${role ? `<@&${role.id}>` : 'Off'}`);
    await replyPrefix(message, makeEmbed('<:draven_chart:1477349258054340813> Reviver Config', `Channel: <#${channel.id}>\nInactivity: ${mins} minutes\nRole ping: ${role ? `<@&${role.id}>` : 'Off'}`));
  },
  async slash({ interaction, store }) {
    if (!hasManageGuild(interaction.memberPermissions)) return replySlash(interaction, makeEmbed('<:draven_no_permission:1477349273535385776> Permission Denied', 'Manage Server is required.'));
    const channel = interaction.options.getChannel('channel', true);
    const mins = interaction.options.getInteger('inactivity_minutes', true);
    const role = interaction.options.getRole('role');
    if (mins < REVIVER_MIN_INACTIVITY_MINUTES) {
      return replySlash(interaction, makeEmbed('<:draven_chart:1477349258054340813> Reviver Config', `Minimum inactivity is **${REVIVER_MIN_INACTIVITY_MINUTES} minutes**. Configuration not saved.`));
    }
    await store.setReviver(interaction.guildId, channel.id, mins, role?.id || null);
    await sendDravenLog(interaction.guild, store, 'REVIVER CONFIG UPDATED', `By <@${interaction.user.id}>\nChannel: <#${channel.id}>\nMinutes: ${mins}\nRole ping: ${role ? `<@&${role.id}>` : 'Off'}`);
    await replySlash(interaction, makeEmbed('<:draven_chart:1477349258054340813> Reviver Config', `Channel: <#${channel.id}>\nInactivity: ${mins} minutes\nRole ping: ${role ? `<@&${role.id}>` : 'Off'}`));
  },
};
