const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');

module.exports = {
  name: 'afk',
  async prefix({ message, store, args }) {
    const mode = String(args[0] || '').toLowerCase();
    if (mode === 'set') {
      const reason = args.slice(1).join(' ').trim() || 'AFK';
      store.setAfk(message.author.id, reason);
      return replyPrefix(message, makeEmbed('<:draven_afk:1477349255747469462> AFK Set', `You are now AFK.\nReason: **${reason}**`));
    }
    if (mode === 'clear') {
      store.clearAfk(message.author.id);
      return replyPrefix(message, makeEmbed('<:draven_afk:1477349255747469462> AFK Cleared', 'Your global AFK status has been cleared.'));
    }
    return replyPrefix(message, makeEmbed('<:draven_afk:1477349255747469462> AFK', 'Use: `afk set <reason>` or `afk clear`'));
  },
  async slash({ interaction, store }) {
    const mode = interaction.options.getSubcommand();
    if (mode === 'set') {
      const reason = interaction.options.getString('reason', true);
      store.setAfk(interaction.user.id, reason);
      return replySlash(interaction, makeEmbed('<:draven_afk:1477349255747469462> AFK Set', `You are now AFK.\nReason: **${reason}**`));
    }

    store.clearAfk(interaction.user.id);
    return replySlash(interaction, makeEmbed('<:draven_afk:1477349255747469462> AFK Cleared', 'Your global AFK status has been cleared.'));
  },
};
