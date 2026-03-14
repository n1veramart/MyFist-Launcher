const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { verdict } = require('../utils/risk');

function build(user, store) {
  const data = store.trustData(user.id, user.createdAt);
  return makeEmbed('<:draven_security:1477349313482063912> Trust Report', `Risk verdict: **${verdict(data.score)}**`, [
    ['<:draven_score:1477349311280054413> Trust Score', `${data.score}/100`],
    ['<:draven_age:1477359697559425218> Account Age', `${data.ageDays} days`],
    ['<:draven_report:1477359692203425915> Known Reports', `${data.reports}`],
  ]);
}

module.exports = {
  name: 'check',
  async prefix({ message, store }) {
    const target = message.mentions.users.first();
    if (!target) return replyPrefix(message, makeEmbed('<:draven_trust_report:1477349322545955048> Trust Report', 'Mention a user to check.'));
    await replyPrefix(message, build(target, store));
  },
  async slash({ interaction, store }) {
    const user = interaction.options.getUser('user', true);
    await replySlash(interaction, build(user, store));
  },
};
