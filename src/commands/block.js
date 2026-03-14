const { PermissionsBitField } = require('discord.js');
const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { hasManageGuild } = require('../utils/permissions');
const { sendDravenLog } = require('../utils/dravenlogs');

function parseDuration(raw) {
  const m = String(raw || '').trim().match(/^(\d+)(m|h|d)$/i);
  if (!m) return null;
  const n = Number(m[1]);
  const u = m[2].toLowerCase();
  if (u === 'm') return n * 60000;
  if (u === 'h') return n * 3600000;
  return n * 86400000;
}

async function ensureRestrictedRole(guild) {
  let role = guild.roles.cache.find((r) => r.name === 'Draven Blocked');
  if (!role) {
    role = await guild.roles.create({
      name: 'Draven Blocked',
      permissions: [PermissionsBitField.Flags.ViewChannel],
      reason: 'Temporary restricted role for blocked users',
    }).catch(() => null);

    if (role) {
      const channels = guild.channels.cache.filter((c) => c.isTextBased());
      for (const channel of channels.values()) {
        await channel.permissionOverwrites.edit(role.id, {
          SendMessages: false,
          AddReactions: false,
          CreatePublicThreads: false,
          CreatePrivateThreads: false,
        }).catch(() => null);
      }
    }
  }
  return role;
}

async function run(guild, member, durationRaw, reason, actorId, store) {
  const ms = parseDuration(durationRaw);
  if (!ms) return makeEmbed('🛡️ Block User', 'Duration format: `<number><m|h|d>` (example: `30m`, `4h`, `2d`).');

  const role = await ensureRestrictedRole(guild);
  if (!role) return makeEmbed('🛡️ Block User', 'Failed to create/find restricted role.');

  await member.roles.add(role.id).catch(() => null);
  const expiresAt = Date.now() + ms;
  await store.addBlockedUser(guild.id, member.id, role.id, expiresAt, reason || 'No reason provided', actorId);
  await store.addSecurityEvent(guild.id, 'BLOCK', reason || 'No reason provided', member.id);
  return makeEmbed('🛡️ Block User', `Blocked <@${member.id}> until <t:${Math.floor(expiresAt / 1000)}:F>.\nReason: ${reason || 'No reason provided'}`);
}

module.exports = {
  name: 'block',
  async prefix({ message, store, args }) {
    if (!hasManageGuild(message.member)) return;
    const target = message.mentions.members.first();
    const durationRaw = args.find((x) => /^\d+[mhd]$/i.test(x));
    const reason = args.filter((x) => !x.includes('<@') && x !== durationRaw).join(' ').trim();
    if (!target || !durationRaw) return replyPrefix(message, makeEmbed('🛡️ Block User', 'Use: block @user <duration> [reason]'));
    const embed = await run(message.guild, target, durationRaw, reason, message.author.id, store);
    await sendDravenLog(message.guild, store, 'BLOCK APPLIED', `Target: <@${target.id}>\nDuration: ${durationRaw}\nBy: <@${message.author.id}>`);
    await replyPrefix(message, embed);
  },
  async slash({ interaction, store }) {
    if (!hasManageGuild(interaction.memberPermissions)) return replySlash(interaction, makeEmbed('🔐 Permission Denied', 'Manage Server is required.'));
    const target = interaction.options.getMember('user', true);
    const durationRaw = interaction.options.getString('duration', true);
    const reason = interaction.options.getString('reason') || '';
    const embed = await run(interaction.guild, target, durationRaw, reason, interaction.user.id, store);
    await sendDravenLog(interaction.guild, store, 'BLOCK APPLIED', `Target: <@${target.id}>\nDuration: ${durationRaw}\nBy: <@${interaction.user.id}>`);
    await replySlash(interaction, embed);
  },
};
