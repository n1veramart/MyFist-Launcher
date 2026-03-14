const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { hasManageGuild } = require('../utils/permissions');

module.exports = {
  name: 'prefix',
  async prefix({ message, store, argText }) {
    if (!hasManageGuild(message.member)) return;
    const updated = await store.setPrefix(message.guild.id, argText);
    await replyPrefix(message, makeEmbed('<:draven_prefix:1477349285489283113> Prefix Updated', `New prefix: \`${updated}\``));
  },
  async slash({ interaction, store }) {
    if (!hasManageGuild(interaction.memberPermissions)) return replySlash(interaction, makeEmbed('<:draven_no_permission:1477349273535385776> Permission Denied', 'Manage Server is required.'));
    const newPrefix = interaction.options.getString('new_prefix', true);
    const updated = await store.setPrefix(interaction.guildId, newPrefix);
    await replySlash(interaction, makeEmbed('<:draven_prefix:1477349285489283113> Prefix Updated', `New prefix: \`${updated}\``));
  },
};
