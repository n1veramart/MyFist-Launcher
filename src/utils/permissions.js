const { PermissionsBitField } = require('discord.js');

function hasManageGuild(memberOrPermissions) {
  if (!memberOrPermissions) return false;
  if (memberOrPermissions.has) return memberOrPermissions.has(PermissionsBitField.Flags.ManageGuild);
  if (memberOrPermissions.permissions?.has) return memberOrPermissions.permissions.has(PermissionsBitField.Flags.ManageGuild);
  return false;
}

module.exports = { hasManageGuild };
