const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { sendDravenLog } = require('../utils/dravenlogs');

function findRule(store, guildId, roleId) {
  return store.getLevelRoles(guildId).find((x) => String(x.roleId) === String(roleId));
}

async function unlock(guild, member, role, store) {
  const rule = findRule(store, guild.id, role.id);
  if (!rule) return makeEmbed('<:draven_xp:1477349339499204770> Unlock Role', 'This role is not configured as an XP unlock role.');
  if (member.roles.cache.has(role.id)) return makeEmbed('<:draven_xp:1477349339499204770> Unlock Role', `You already have ${role}.`);

  const profile = store.getLevel(guild.id, member.id);
  if (profile.xp < rule.requiredXp) {
    return makeEmbed('<:draven_xp:1477349339499204770> Unlock Role', `You need **${rule.requiredXp} XP** but currently have **${profile.xp} XP**.`);
  }

  await member.roles.add(role.id).catch(() => null);
  return makeEmbed('<:draven_xp:1477349339499204770> Unlock Role', `Unlocked ${role} at **${rule.requiredXp} XP**.`);
}

module.exports = {
  name: 'unlockrole',
  async prefix({ message, store }) {
    const role = message.mentions.roles.first();
    if (!role) return replyPrefix(message, makeEmbed('<:draven_xp:1477349339499204770> Unlock Role', 'Use: unlockrole @role'));
    const embed = await unlock(message.guild, message.member, role, store);
    await sendDravenLog(message.guild, store, 'ROLE UNLOCK ATTEMPT', `User: <@${message.author.id}>\nRole: <@&${role.id}>`);
    await replyPrefix(message, embed);
  },
  async slash({ interaction, store }) {
    const role = interaction.options.getRole('role', true);
    const embed = await unlock(interaction.guild, interaction.member, role, store);
    await sendDravenLog(interaction.guild, store, 'ROLE UNLOCK ATTEMPT', `User: <@${interaction.user.id}>\nRole: <@&${role.id}>`);
    await replySlash(interaction, embed);
  },
};
