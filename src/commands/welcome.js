const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { hasManageGuild } = require('../utils/permissions');
const { buildWelcomeMainButtons } = require('../ui/welcomeMenu');
const { EMBED_COLOR } = require('../config/constants');

const DEFAULT_IMAGE = 'https://cdn.discordapp.com/attachments/1477335850332192918/1477874327549382707/Purple_and_Blue_Fluid_Welcome_Banner_Horizontal_1.png?ex=69a65939&is=69a507b9&hm=cf7ae3d4b86e3a3365a798cccf177e9b39fb564967e444c6983ae684f9cbae1e';

function buildWelcomePreview(cfg, guild) {
  const embed = makeEmbed('<:draven_events:1477349264077095125> Welcome Builder', 'Use the buttons below to adjust the settings.');
  embed.setColor(cfg.color || EMBED_COLOR);
  const botAvatar = guild.members.me?.displayAvatarURL({ extension: 'png', size: 256 }) || null;
  if (botAvatar) embed.setThumbnail(botAvatar);
  embed.setTitle(cfg.title || 'Welcome to the server!');
  embed.setDescription(cfg.description || 'Please read the rules and enjoy your stay.');
  embed.setImage(cfg.image || DEFAULT_IMAGE);
  return embed;
}

module.exports = {
  name: 'welcome',
  async prefix({ message, args, store }) {
    if (!hasManageGuild(message.member)) return;
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.channel;
    store.setWelcomeConfig(message.guild.id, { enabled: true, channelId: channel.id });
    const draft = store.setWelcomeDraft(message.guild.id, message.author.id, { channelId: channel.id });
    await replyPrefix(message, buildWelcomePreview(draft, message.guild), buildWelcomeMainButtons(), { autoDelete: false });
  },
  async slash({ interaction, store }) {
    if (!hasManageGuild(interaction.memberPermissions)) return replySlash(interaction, makeEmbed('<:draven_no_permission:1477349273535385776> Permission Denied', 'Manage Server is required.'));
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    store.setWelcomeConfig(interaction.guildId, { enabled: true, channelId: channel.id });
    const draft = store.setWelcomeDraft(interaction.guildId, interaction.user.id, { channelId: channel.id });
    await replySlash(interaction, buildWelcomePreview(draft, interaction.guild), buildWelcomeMainButtons(), { ephemeral: false, autoDelete: false });
  },
  ui: { buildWelcomePreview, DEFAULT_IMAGE },
};
