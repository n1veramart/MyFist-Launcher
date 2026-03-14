const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { hasManageGuild } = require('../utils/permissions');

function listEmbed(store, guildId) {
  const words = store.getBanWords(guildId);
  return makeEmbed('<:draven_banwords:1477359702714355742> Banwords', words.length ? words.map((w, i) => `${i + 1}. ${w}`).join('\n').slice(0, 3900) : 'No custom banned words configured.');
}

module.exports = {
  name: 'banwords',
  async prefix({ message, store, args }) {
    if (!hasManageGuild(message.member)) return;
    const mode = String(args[0] || 'list').toLowerCase();
    const word = args.slice(1).join(' ').trim().toLowerCase();

    if (mode === 'list') return replyPrefix(message, listEmbed(store, message.guild.id), [], { autoDelete: false });
    if (mode === 'add') {
      if (!word) return replyPrefix(message, makeEmbed('<:draven_banwords:1477359702714355742> Banwords', 'Use: `banwords add <word>`'));
      await store.addBanWord(message.guild.id, word);
      return replyPrefix(message, makeEmbed('<:draven_banwords:1477359702714355742> Banwords', `Added: **${word}**`));
    }
    if (mode === 'remove') {
      if (!word) return replyPrefix(message, makeEmbed('<:draven_banwords:1477359702714355742> Banwords', 'Use: `banwords remove <word>`'));
      await store.removeBanWord(message.guild.id, word);
      return replyPrefix(message, makeEmbed('<:draven_banwords:1477359702714355742> Banwords', `Removed: **${word}**`));
    }
    return replyPrefix(message, makeEmbed('<:draven_banwords:1477359702714355742> Banwords', 'Use: `banwords <list|add|remove> [word]`'));
  },
  async slash({ interaction, store }) {
    if (!hasManageGuild(interaction.memberPermissions)) return replySlash(interaction, makeEmbed('<:draven_no_permission:1477349273535385776> Permission Denied', 'Manage Server is required.'));
    const mode = interaction.options.getSubcommand();
    const word = (interaction.options.getString('word') || '').trim().toLowerCase();

    if (mode === 'list') return replySlash(interaction, listEmbed(store, interaction.guildId), [], { ephemeral: true, autoDelete: false });
    if (mode === 'add') {
      if (!word) return replySlash(interaction, makeEmbed('<:draven_banwords:1477359702714355742> Banwords', 'Word is required.'));
      await store.addBanWord(interaction.guildId, word);
      return replySlash(interaction, makeEmbed('<:draven_banwords:1477359702714355742> Banwords', `Added: **${word}**`));
    }
    if (mode === 'remove') {
      if (!word) return replySlash(interaction, makeEmbed('<:draven_banwords:1477359702714355742> Banwords', 'Word is required.'));
      await store.removeBanWord(interaction.guildId, word);
      return replySlash(interaction, makeEmbed('<:draven_banwords:1477359702714355742> Banwords', `Removed: **${word}**`));
    }
    return replySlash(interaction, makeEmbed('<:draven_banwords:1477359702714355742> Banwords', 'Use subcommands: list/add/remove'));
  },
};
