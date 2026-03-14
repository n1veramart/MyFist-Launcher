const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { hasManageGuild } = require('../utils/permissions');

const entries = [
  'Full release v1.0 shipped with Native AutoMod enrollment and we achieved the Uses AutoMod badge target.',
  'Invite tracking now identifies inviter + code + running invite totals on member join.',
  'Weekly digest upgraded with professional dark theme visuals and in-memory chart attachment flow.',
  'New community features: role-based coffee pairing card, keyword-matched Ghostly Guide FAQ trigger, and interactive welcome builder.',
];

function build() {
  return makeEmbed(
    '<:draven_logs:1477349271438098657> Changelog',
    '**Title:** Draven Full Release v1.0\n**Date Updated:** Current Build',
    [['Changelogs', entries.map((x, i) => `${i + 1}. ${x}`).join('\n')]]
  );
}

module.exports = {
  name: 'changelog',
  async prefix({ message }) {
    if (!hasManageGuild(message.member)) return;
    await replyPrefix(message, build());
  },
  async slash({ interaction }) {
    if (!hasManageGuild(interaction.memberPermissions)) return replySlash(interaction, makeEmbed('<:draven_report:1477359692203425915> Permission Denied', 'Manage Server is required.'));
    await replySlash(interaction, build());
  },
};
