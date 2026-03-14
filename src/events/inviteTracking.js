const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { makeEmbed } = require('../utils/embed');
const { sendDravenLog } = require('../utils/dravenlogs');
const { EMBED_COLOR } = require('../config/constants');

const DEFAULT_WELCOME_IMAGE = 'https://cdn.discordapp.com/attachments/1477335850332192918/1477874327549382707/Purple_and_Blue_Fluid_Welcome_Banner_Horizontal_1.png?ex=69a65939&is=69a507b9&hm=cf7ae3d4b86e3a3365a798cccf177e9b39fb564967e444c6983ae684f9cbae1e';

function snapshotFromInvites(invites) {
  const out = {};
  invites.forEach((invite) => {
    out[invite.code] = {
      uses: Number(invite.uses || 0),
      inviterId: invite.inviter?.id || null,
    };
  });
  return out;
}

async function refreshGuildInviteSnapshot(store, guild) {
  if (!guild?.members?.me?.permissions?.has(PermissionFlagsBits.ManageGuild)) return;
  const invites = await guild.invites.fetch().catch(() => null);
  if (!invites) return;
  store.setInviteSnapshot(guild.id, snapshotFromInvites(invites));
}

function pickFallbackChannel(guild) {
  if (guild.systemChannel) return guild.systemChannel;
  return guild.channels.cache.find((c) => c.type === ChannelType.GuildText && c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages)) || null;
}

function pickInviteChannel(guild, store) {
  const configuredId = store.getInviteTrackingChannel(guild.id);
  if (configuredId) {
    const configured = guild.channels.cache.get(configuredId);
    if (configured) return configured;
  }
  const welcomeCfg = store.getWelcomeConfig(guild.id);
  if (welcomeCfg?.channelId) {
    const welcomeChannel = guild.channels.cache.get(welcomeCfg.channelId);
    if (welcomeChannel) return welcomeChannel;
  }
  return pickFallbackChannel(guild);
}

async function announceInviteJoin(member, store, inviteCode, inviterId) {
  const channel = pickInviteChannel(member.guild, store);
  if (!channel) return;

  const inviterText = inviterId ? `<@${inviterId}>` : 'Unknown user';
  const total = inviterId ? store.incrementInviterCount(member.guild.id, inviterId) : 0;

  const cfg = store.getWelcomeConfig(member.guild.id);
  if (cfg?.roleId) {
    const role = member.guild.roles.cache.get(cfg.roleId);
    if (role) await member.roles.add(role).catch(() => null);
  }
  const embed = makeEmbed(
    cfg?.title || '<:draven_security:1477349313482063912> New Member Joined',
    `${(cfg?.description || `Welcome ${member} to **${member.guild.name}**!`).replace('{user}', `${member}`)}\n\nThis user was invited by ${inviterText}.`
  );
  embed.setColor(cfg?.color || EMBED_COLOR);
  embed.setThumbnail(member.user.displayAvatarURL({ extension: 'png', size: 256 }));
  if (cfg?.image) embed.setImage(cfg.image);
  else embed.setImage(DEFAULT_WELCOME_IMAGE);

  await channel.send({ embeds: [embed] }).catch(() => null);

  await sendDravenLog(member.guild, store, 'INVITE_TRACKED_JOIN', `Member: <@${member.id}>\nInvited by: ${inviterText}\nInvite code: ${inviteCode || 'unknown'}\nInviter total: ${inviterId ? total : 'unknown'}`);
}

function registerInviteTracking(client, store) {
  client.on('ready', async () => {
    for (const guild of client.guilds.cache.values()) {
      await refreshGuildInviteSnapshot(store, guild);
    }
  });

  client.on('inviteCreate', async (invite) => {
    if (!invite.guild) return;
    await refreshGuildInviteSnapshot(store, invite.guild);
  });

  client.on('inviteDelete', async (invite) => {
    if (!invite.guild) return;
    await refreshGuildInviteSnapshot(store, invite.guild);
  });

  client.on('guildMemberAdd', async (member) => {
    const before = store.getInviteSnapshot(member.guild.id);
    const currentInvites = await member.guild.invites.fetch().catch(() => null);
    if (!currentInvites) return;

    let matchedCode = null;
    let matchedInviterId = null;

    let bestDelta = 0;
    currentInvites.forEach((invite) => {
      const prev = before.get(invite.code);
      const prevUses = Number(prev?.uses || 0);
      const nowUses = Number(invite.uses || 0);
      const delta = nowUses - prevUses;
      if (delta > bestDelta) {
        bestDelta = delta;
        matchedCode = invite.code;
        matchedInviterId = invite.inviter?.id || prev?.inviterId || null;
      }
    });

    if (!matchedCode) {
      const fallbackInvite = [...currentInvites.values()].sort((a, b) => Number(b.uses || 0) - Number(a.uses || 0))[0];
      if (fallbackInvite) {
        matchedCode = fallbackInvite.code;
        matchedInviterId = fallbackInvite.inviter?.id || null;
      }
    }

    store.setInviteSnapshot(member.guild.id, snapshotFromInvites(currentInvites));
    await announceInviteJoin(member, store, matchedCode, matchedInviterId);
  });
}

module.exports = { registerInviteTracking };
