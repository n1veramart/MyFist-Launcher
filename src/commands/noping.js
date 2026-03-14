const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { hasManageGuild } = require('../utils/permissions');

function normalizeTarget(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;
  if (text === '@everyone' || text === '@here') return text;
  const role = text.match(/^<@&(\d+)>$/);
  if (role) return `role:${role[1]}`;
  const user = text.match(/^<@!?(\d+)>$/);
  if (user) return `user:${user[1]}`;
  if (/^role:\d+$/.test(text) || /^user:\d+$/.test(text)) return text;
  return null;
}

function formatTarget(t) {
  if (t.startsWith('role:')) return `<@&${t.split(':')[1]}>`;
  if (t.startsWith('user:')) return `<@${t.split(':')[1]}>`;
  return t;
}

function listEmbed(store, guildId) {
  const list = store.getNoPingTargets(guildId);
  return makeEmbed('<:draven_noping:1477359694749368632> NoPing', list.length ? list.map((v, i) => `${i + 1}. ${formatTarget(v)}`).join('\n').slice(0, 3900) : 'No prohibited pings configured.');
}

module.exports = {
  name: 'noping',
  async prefix({ message, store, args }) {
    if (!hasManageGuild(message.member)) return;
    const mode = String(args[0] || 'list').toLowerCase();
    const target = normalizeTarget(args.slice(1).join(' '));

    if (mode === 'list') return replyPrefix(message, listEmbed(store, message.guild.id), [], { autoDelete: false });
    if (mode === 'add') {
      if (!target) return replyPrefix(message, makeEmbed('<:draven_noping:1477359694749368632> NoPing', 'Use: `noping add <@user|@role|@everyone|@here>`'));
      await store.addNoPingTarget(message.guild.id, target);
      return replyPrefix(message, makeEmbed('<:draven_noping:1477359694749368632> NoPing', `Added: **${formatTarget(target)}**`));
    }
    if (mode === 'remove') {
      if (!target) return replyPrefix(message, makeEmbed('<:draven_noping:1477359694749368632> NoPing', 'Use: `noping remove <@user|@role|@everyone|@here>`'));
      await store.removeNoPingTarget(message.guild.id, target);
      return replyPrefix(message, makeEmbed('<:draven_noping:1477359694749368632> NoPing', `Removed: **${formatTarget(target)}**`));
    }
    return replyPrefix(message, makeEmbed('<:draven_noping:1477359694749368632> NoPing', 'Use: `noping <list|add|remove> [target]`'));
  },
  async slash({ interaction, store }) {
    if (!hasManageGuild(interaction.memberPermissions)) return replySlash(interaction, makeEmbed('<:draven_no_permission:1477349273535385776> Permission Denied', 'Manage Server is required.'));
    const mode = interaction.options.getSubcommand();
    const raw = interaction.options.getString('target') || '';
    const target = normalizeTarget(raw);

    if (mode === 'list') return replySlash(interaction, listEmbed(store, interaction.guildId), [], { ephemeral: true, autoDelete: false });
    if (mode === 'add') {
      if (!target) return replySlash(interaction, makeEmbed('<:draven_noping:1477359694749368632> NoPing', 'Target must be @user, @role, @everyone, or @here.'));
      await store.addNoPingTarget(interaction.guildId, target);
      return replySlash(interaction, makeEmbed('<:draven_noping:1477359694749368632> NoPing', `Added: **${formatTarget(target)}**`));
    }
    if (mode === 'remove') {
      if (!target) return replySlash(interaction, makeEmbed('<:draven_noping:1477359694749368632> NoPing', 'Target must be @user, @role, @everyone, or @here.'));
      await store.removeNoPingTarget(interaction.guildId, target);
      return replySlash(interaction, makeEmbed('<:draven_noping:1477359694749368632> NoPing', `Removed: **${formatTarget(target)}**`));
    }
    return replySlash(interaction, makeEmbed('<:draven_noping:1477359694749368632> NoPing', 'Use subcommands: list/add/remove'));
  },
};
