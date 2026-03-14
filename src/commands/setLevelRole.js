const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { hasManageGuild } = require('../utils/permissions');

module.exports = {
  name: 'setlevelrole',
  async prefix({ message, store, args }) {
    if (!hasManageGuild(message.member)) return;
    const requiredXp = Number(args.find((x) => /^\d+$/.test(x)));
    const role = message.mentions.roles.first();
    if (!requiredXp || !role) return replyPrefix(message, makeEmbed('<:draven_xp:1477349339499204770> Level Role', 'Use: setlevelrole <required_xp> @role'));
    await store.setLevelRole(message.guild.id, requiredXp, role.id);
    await replyPrefix(message, makeEmbed('<:draven_xp:1477349339499204770> Level Role', `${role} now unlocks at **${requiredXp} XP**.`));
  },
  async slash({ interaction, store }) {
    if (!hasManageGuild(interaction.memberPermissions)) return replySlash(interaction, makeEmbed('<:draven_no_permission:1477349273535385776> Permission Denied', 'Manage Server is required.'));
    const requiredXp = interaction.options.getInteger('required_xp', true);
    const role = interaction.options.getRole('role', true);
    await store.setLevelRole(interaction.guildId, requiredXp, role.id);
    await replySlash(interaction, makeEmbed('<:draven_xp:1477349339499204770> Level Role', `${role} now unlocks at **${requiredXp} XP**.`));
  },
};
