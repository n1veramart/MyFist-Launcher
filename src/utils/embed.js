const { EmbedBuilder } = require('discord.js');
const { EMBED_COLOR } = require('../config/constants');

function makeEmbed(title, description, sections = []) {
  const embed = new EmbedBuilder().setColor(EMBED_COLOR).setTitle(title).setDescription(description);
  sections.forEach(([name, value]) => embed.addFields({ name, value, inline: false }));
  return embed;
}

module.exports = { makeEmbed };
