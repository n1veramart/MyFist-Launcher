const { sendDravenLog } = require('./dravenlogs');

async function syncLevelRoles(guild, member, store) {
  if (!guild || !member) return;

  const fullMember = member.roles?.add ? member : await guild.members.fetch(member.id).catch(() => null);
  if (!fullMember) return;

  const profile = store.getLevel(guild.id, fullMember.id);
  const rules = store.getLevelRoles(guild.id);
  for (const rule of rules) {
    if (profile.xp < rule.requiredXp) continue;
    if (fullMember.roles.cache.has(rule.roleId)) continue;

    const role = guild.roles.cache.get(rule.roleId);
    if (!role) continue;

    await fullMember.roles.add(rule.roleId).catch(() => null);
    await sendDravenLog(guild, store, 'ROLE ASSIGNED', `User: <@${fullMember.id}>\nRole: <@&${rule.roleId}>\nReason: reached ${rule.requiredXp} XP`);
  }
}

module.exports = { syncLevelRoles };
