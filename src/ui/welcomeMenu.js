const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function buildWelcomeMainButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('welcome:title').setLabel('Title').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('welcome:description').setLabel('Description').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('welcome:color').setLabel('Color').setStyle(ButtonStyle.Primary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('welcome:image').setLabel('Image').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('welcome:role').setLabel('Role').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('welcome:test').setLabel('Test').setStyle(ButtonStyle.Success)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('welcome:make_changes').setLabel('Make Changes').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('welcome:save').setLabel('Save Embed').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('welcome:exit').setLabel('Exit').setStyle(ButtonStyle.Danger)
    ),
  ];
}

function buildWelcomeChangesButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('welcome:change_description').setLabel('Change Description').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('welcome:change_title').setLabel('Change Title').setStyle(ButtonStyle.Primary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('welcome:change_role').setLabel('Change Role').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('welcome:change_color').setLabel('Change Color').setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('welcome:save_changes').setLabel('Save Changes').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('welcome:back').setLabel('Back').setStyle(ButtonStyle.Danger)
    ),
  ];
}

module.exports = { buildWelcomeMainButtons, buildWelcomeChangesButtons };
