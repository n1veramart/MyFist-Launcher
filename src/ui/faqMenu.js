const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

function buildFaqMenu(entries) {
  const options = (entries || []).slice(0, 25).map((e, idx) => ({ label: e.question.slice(0, 100), value: `faq-${idx}` }));
  if (!options.length) options.push({ label: 'No FAQ entries', value: 'faq-none' });
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId('faq-select').setPlaceholder('Select FAQ').addOptions(options)
  );
}

module.exports = { buildFaqMenu };
