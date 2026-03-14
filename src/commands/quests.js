const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { syncLevelRoles } = require('../utils/levelRoles');

const QUEST_BANK = [
  { q: 'What color is the sky on a clear day?', a: 'blue' },
  { q: 'How many days are in a week?', a: '7' },
  { q: 'What do bees make?', a: 'honey' },
  { q: 'What is 5 + 5?', a: '10' },
  { q: 'What planet do humans live on?', a: 'earth' },
  { q: 'What is the chemical symbol for water?', a: 'h2o' },
  { q: 'What gas do plants primarily inhale during photosynthesis?', a: 'carbon dioxide' },
  { q: 'What is the largest planet in our solar system?', a: 'jupiter' },
  { q: 'What is the capital city of Japan?', a: 'tokyo' },
  { q: 'What gas do humans need to breathe to live?', a: 'oxygen' },
  { q: 'Who painted the Mona Lisa?', a: 'da vinci' },
  { q: 'What is the chemical formula for table salt?', a: 'nacl' },
  { q: 'In what year did the World War II end?', a: '1945' },
  { q: 'What is the hardest natural substance on Earth?', a: 'diamond' },
  { q: 'Who is known as the father of modern physics?', a: 'einstein' },
  { q: 'What is the largest ocean on Earth?', a: 'pacific' },
  { q: 'What is the smallest country in the world by land area?', a: 'vatican city' },
  { q: 'What is the chemical symbol for gold?', a: 'au' },
  { q: 'In computing, what does CPU stand for?', a: 'central processing unit' },
  { q: 'What is the main language spoken in Mexico?', a: 'spanish' },
  { q: 'Who wrote the play "Hamlet"?', a: 'shakespeare' },
  { q: 'What is the reincarnation cycle in Hinduism called?', a: 'samsara' },
  { q: 'Which planet is known as the Red Planet?', a: 'mars' },
  { q: 'What is the square root of 144?', a: '12' },
  { q: 'What is the chemical symbol for iron?', a: 'fe' },
  { q: 'In music, how many notes are in a standard octave?', a: '8' },
  { q: 'What is the tallest land animal?', a: 'giraffe' },
  { q: 'What is the main ingredient in guacamole?', a: 'avocado' },
];

function state(store, guildId, userId) {
  const profile = store.getLevel(guildId, userId);
  if (!profile.questState) profile.questState = { lastCompletedAt: null, pending: null };
  return profile.questState;
}

function cooldown(lastCompletedAt) {
  if (!lastCompletedAt) return 0;
  return 86400000 - (Date.now() - new Date(lastCompletedAt).getTime());
}

function chooseQuest() { return QUEST_BANK[Math.floor(Math.random() * QUEST_BANK.length)]; }
function normalize(text) { return String(text || '').trim().toLowerCase(); }

async function getRandomQuest(ai) {
  const generated = await ai.randomQuestChallenge();
  if (generated) return { q: generated.question, a: generated.answer };
  return chooseQuest();
}

function progressBar(percent) {
  const width = 24;
  const filled = Math.round((Math.max(0, Math.min(100, percent)) / 100) * width);
  return `${'█'.repeat(filled)}${'░'.repeat(width - filled)}`;
}

function buildQuestLoader(percent) {
  return makeEmbed(
    '<:draven_loading:1477349269122973716> Quest Loading',
    `Generating your randomized daily quest...\n\n[${progressBar(percent)}] **${percent}%**`
  );
}

async function runLoaderUntilReady(messageLike, job) {
  let pct = 10;
  let done = false;

  const timer = setInterval(() => {
    if (done) return;
    pct = Math.min(95, pct + 5);
    messageLike.edit({ embeds: [buildQuestLoader(pct)] }).catch(() => null);
  }, 450);

  await messageLike.edit({ embeds: [buildQuestLoader(pct)] }).catch(() => null);

  try {
    const result = await job();
    done = true;
    clearInterval(timer);
    await messageLike.edit({ embeds: [buildQuestLoader(100)] }).catch(() => null);
    return result;
  } finally {
    done = true;
    clearInterval(timer);
  }
}

async function runQuest(guildId, userId, givenAnswer, store, ai) {
  const questState = state(store, guildId, userId);
  const left = cooldown(questState.lastCompletedAt);
  const rates = store.getXpRates(guildId);

  if (!givenAnswer) {
    if (left > 0) return makeEmbed('<:draven_quests:1477349299632472114> Daily Quest', `You already completed today’s quest. Come back in ${Math.floor(left / 3600000)}h ${Math.floor((left % 3600000) / 60000)}m.`);
    const quest = await getRandomQuest(ai);
    questState.pending = { question: quest.q, answer: quest.a, createdAt: new Date().toISOString() };
    return makeEmbed('<:draven_quests:1477349299632472114> Daily Quest', `${quest.q}\n\nReply with \`quests <answer>\` (or /quests answer:<text>) to submit. Reward: **+${rates.questXp} XP**.`);
  }

  if (!questState.pending) return makeEmbed('<:draven_quests:1477349299632472114> Daily Quest', 'No active quest. Run quests without an answer to receive today’s question.');
  if (normalize(givenAnswer) !== normalize(questState.pending.answer)) return makeEmbed('<:draven_quests:1477349299632472114> Daily Quest', 'Incorrect answer. Try again.');

  const profile = store.getLevel(guildId, userId);
  profile.xp += rates.questXp;
  profile.quests += 1;
  questState.lastCompletedAt = new Date().toISOString();
  questState.pending = null;
  await store.saveLevel(guildId, userId);
  return makeEmbed('<:draven_quests:1477349299632472114> Daily Quest', `Correct! You earned **+${rates.questXp} XP**.`);
}

module.exports = {
  name: 'quests',
  async prefix({ message, store, argText, ai }) {
    if (!argText) {
      await message.delete().catch(() => null);
      const loadingMessage = await message.channel.send({ embeds: [buildQuestLoader(10)] });
      const embed = await runLoaderUntilReady(loadingMessage, async () => runQuest(message.guild.id, message.author.id, argText, store, ai));
      await syncLevelRoles(message.guild, message.member, store);
      await loadingMessage.edit({ embeds: [embed] }).catch(() => null);
      return;
    }

    const embed = await runQuest(message.guild.id, message.author.id, argText, store, ai);
    await syncLevelRoles(message.guild, message.member, store);
    await replyPrefix(message, embed);
  },
  async slash({ interaction, store, ai }) {
    const answer = interaction.options.getString('answer');
    if (!answer) {
      await interaction.deferReply({ ephemeral: true });
      const loadingMessage = await interaction.editReply({ embeds: [buildQuestLoader(10)] });
      const embed = await runLoaderUntilReady(loadingMessage, async () => runQuest(interaction.guildId, interaction.user.id, answer, store, ai));
      await syncLevelRoles(interaction.guild, interaction.member, store);
      await interaction.editReply({ embeds: [embed] }).catch(() => null);
      return;
    }

    const embed = await runQuest(interaction.guildId, interaction.user.id, answer, store, ai);
    await syncLevelRoles(interaction.guild, interaction.member, store);
    await replySlash(interaction, embed);
  },
};
