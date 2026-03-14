const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { buildHelpMenu, buildHelpModeButtons } = require('../ui/helpMenu');

function baseEmbed() {
  return makeEmbed(
    '<:draven_cmd:1477359689980313824> Draven Command Center',
    'Professional command hub with 5 categorized modules. Pick your command style, then select a module to view complete command coverage.',
    [
      ['<:draven_cmd:1477359689980313824> Slash Mode', 'Use `/command` for clean, discoverable interactions and quick option prompts.'],
      ['<:draven_prefix:1477349285489283113> Prefix Mode', 'Use `=command` for fast text workflows in active channels.'],
    ]
  );
}

module.exports = {
  name: 'help',
  async prefix({ message }) {
    await replyPrefix(message, baseEmbed(), [buildHelpModeButtons(), buildHelpMenu()]);
  },
  async slash({ interaction }) {
    await replySlash(interaction, baseEmbed(), [buildHelpModeButtons(), buildHelpMenu()]);
  },
};
