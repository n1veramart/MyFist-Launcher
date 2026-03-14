const { PermissionsBitField } = require('discord.js');
const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');

function canManageMessages(memberOrPermissions) {
  if (!memberOrPermissions) return false;
  if (memberOrPermissions.permissions?.has) return memberOrPermissions.permissions.has(PermissionsBitField.Flags.ManageMessages);
  if (memberOrPermissions.has) return memberOrPermissions.has(PermissionsBitField.Flags.ManageMessages);
  return false;
}

function parseAmount(raw) {
  const amount = Number(raw);
  if (!Number.isFinite(amount)) return null;
  return Math.floor(amount);
}

async function runPurge(channel, amount) {
  const fetched = await channel.messages.fetch({ limit: amount });
  const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
  const fresh = fetched.filter((m) => m.createdTimestamp > twoWeeksAgo);
  if (!fresh.size) return { removed: 0, skipped: fetched.size };
  const removed = await channel.bulkDelete(fresh, true);
  return { removed: removed.size, skipped: fetched.size - removed.size };
}

module.exports = {
  name: 'purge',
  async prefix({ message, args }) {
    if (!canManageMessages(message.member)) return;
    const amount = parseAmount(args[0]);
    if (!amount || amount < 1 || amount > 100) {
      return replyPrefix(message, makeEmbed('<:draven_purge:1477349297610559671> Purge', 'Use: `purge <1-100>` and ensure messages are less than 14 days old.'));
    }
    const result = await runPurge(message.channel, amount);
    const detail = `Deleted **${result.removed}** message(s).${result.skipped > 0 ? ` Skipped **${result.skipped}** older message(s).` : ''}`;
    await replyPrefix(message, makeEmbed('<:draven_purge:1477349297610559671> Purge', detail));
  },
  async slash({ interaction }) {
    if (!canManageMessages(interaction.memberPermissions)) {
      return replySlash(interaction, makeEmbed('<:draven_no_permission:1477349273535385776> Permission Denied', 'Manage Messages permission is required.'));
    }
    const amount = parseAmount(interaction.options.getInteger('amount', true));
    if (!amount || amount < 1 || amount > 100) {
      return replySlash(interaction, makeEmbed('<:draven_purge:1477349297610559671> Purge', 'Amount must be between 1 and 100.'));
    }
    await interaction.deferReply({ ephemeral: true });
    const result = await runPurge(interaction.channel, amount);
    const detail = `Deleted **${result.removed}** message(s).${result.skipped > 0 ? ` Skipped **${result.skipped}** older message(s).` : ''}`;
    await replySlash(interaction, makeEmbed('<:draven_purge:1477349297610559671> Purge', detail));
  },
};
