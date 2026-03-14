const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { buildFaqMenu } = require('../ui/faqMenu');

module.exports = {
  name: 'faq',
  async prefix({ message, store }) {
    const entries = store.faq(message.guild.id).slice(0, 10);
    const lines = entries.map((f, idx) => `${idx + 1}. **Q:** ${f.question}\n**A:** ${f.answer}`);
    await replyPrefix(message, makeEmbed('<:draven_productivity:1477349287796146216> FAQ', lines.join('\n\n') || 'No FAQ entries.'));
  },
  async slash({ interaction, store }) {
    const entries = store.faq(interaction.guildId);
    await replySlash(interaction, makeEmbed('<:draven_productivity:1477349287796146216> FAQ', 'Select a question to view the answer.'), [buildFaqMenu(entries)]);
  },
};
