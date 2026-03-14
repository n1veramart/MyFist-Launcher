const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');
const { TRIVIA_TIMEOUT_MS } = require('../config/constants');
const { sendDravenLog } = require('../utils/dravenlogs');

function qa(excluded = new Set()) {
  const arr = [
    ['What does CPU stand for?', 'central processing unit'],
    ['What protocol secures web traffic?', 'https'],
    ['What does RAM stand for?', 'random access memory'],
    ['What number is a dozen?', '12'],
    ['What is the capital of France?', 'paris'],
    ['What does HDMI stand for?', 'high-definition multimedia interface'],
    ['What planet is known as the Red Planet?', 'mars'],
    ['What does LED stand for?', 'light-emitting diode'],
    ['What is the chemical symbol for gold?', 'au'],
    ['What is the largest ocean on Earth?', 'pacific ocean'],
    ['What does GPS stand for?', 'global positioning system'],
    ['Which country shouted “Eureka” when discovering a property of density?', 'greece'],
    ['What is the square root of 144?', '12'],
    ['What gas do plants primarily absorb for photosynthesis?', 'carbon dioxide'],
    ['What is the capital city of Japan?', 'tokyo'],
    ['What does JPEG stand for?', 'joint photographic experts group'],
    ['Which gas makes up the majority of atmosphere of Earth?', 'nitrogen'],
    ['What is the chemical symbol for silver?', 'ag'],
    ['What is the tallest land animal?', 'giraffe'],
    ['Which language is primarily spoken in Brazil?', 'portuguese'],
    ['What does USB stand for?', 'universal serial bus'],
    ['What is the smallest prime number?', '2'],
    ['What is the color of the sky on a clear day?', 'blue'],
    ['What is the capital of Canada?', 'ottawa']  
  ];
  const filtered = arr.filter(([q]) => !excluded.has(String(q).toLowerCase()));
  const pool = filtered.length ? filtered : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

function fmtRemaining(ms) {
  const h = Math.ceil(ms / 3600000);
  return `${h} hour${h === 1 ? '' : 's'}`;
}

function buildQuestion(question, rewardXp) {
  return makeEmbed('<:draven_trophy:1477349320171983069> Trivia', `${question}\n\nType your answer in chat. First correct answer wins **${rewardXp} XP**.`);
}

function progressBar(percent) {
  const width = 24;
  const filled = Math.round((Math.max(0, Math.min(100, percent)) / 100) * width);
  return `${'█'.repeat(filled)}${'░'.repeat(width - filled)}`;
}

function buildLoader(percent) {
  return makeEmbed(
    '<:draven_loading:1477349269122973716> Trivia Loading',
    `Generating a randomized trivia question...\n\n[${progressBar(percent)}] **${percent}%**`
  );
}

async function runLoaderUntilReady(messageLike, job) {
  let pct = 10;
  let done = false;

  const timer = setInterval(() => {
    if (done) return;
    pct = Math.min(95, pct + 5);
    messageLike.edit({ embeds: [buildLoader(pct)] }).catch(() => null);
  }, 450);

  await messageLike.edit({ embeds: [buildLoader(pct)] }).catch(() => null);

  try {
    const result = await job();
    done = true;
    clearInterval(timer);
    await messageLike.edit({ embeds: [buildLoader(100)] }).catch(() => null);
    return result;
  } finally {
    done = true;
    clearInterval(timer);
  }
}

function setTriviaState(store, channelId, question, answer, rewardXp) {
  const askedAt = Date.now();
  store.activeTrivia.set(channelId, { question, answer, rewardXp, claimed: false, askedAt });
  store.setTriviaCooldown(channelId, askedAt + TRIVIA_TIMEOUT_MS);
}

function canAskTriviaNow(store, channelId) {
  const nextAllowedAt = store.getTriviaNextAllowedAt(channelId);
  return { allowed: Date.now() >= nextAllowedAt, nextAllowedAt };
}

async function getQuestion(ai, store, guildId) {
  const used = store.getUsedTriviaQuestions(guildId);
  const exclude = Array.from(used).slice(-20);

  for (let i = 0; i < 5; i += 1) {
    const generated = await ai.randomTriviaQuestion(exclude);
    if (generated && !used.has(String(generated.question).toLowerCase())) {
      return [generated.question, generated.answer];
    }
  }

  return qa(used);
}

module.exports = {
  name: 'trivia',
  async prefix({ message, store, ai }) {
    const gate = canAskTriviaNow(store, message.channel.id);
    if (!gate.allowed) return replyPrefix(message, makeEmbed('<:draven_trophy:1477349320171983069> Trivia', `A trivia question can only be started once every 4 hours in this channel. Try again in about ${fmtRemaining(gate.nextAllowedAt - Date.now())}.`));

    await message.delete().catch(() => null);
    const loadingMessage = await message.channel.send({ embeds: [buildLoader(10)] });

    const [question, answer] = await runLoaderUntilReady(loadingMessage, async () => getQuestion(ai, store, message.guild.id));
    await store.markTriviaQuestionUsed(message.guild.id, question);
    const rewardXp = store.getTriviaReward(message.guild.id);
    setTriviaState(store, message.channel.id, question, String(answer).toLowerCase(), rewardXp);
    await sendDravenLog(message.guild, store, 'TRIVIA STARTED', `By: <@${message.author.id}>\nChannel: <#${message.channel.id}>\nReward XP: ${rewardXp}`);
    await loadingMessage.edit({ embeds: [buildQuestion(question, rewardXp)] }).catch(() => null);
  },
  async slash({ interaction, store, ai }) {
    await interaction.deferReply({ ephemeral: false });
    const gate = canAskTriviaNow(store, interaction.channelId);
    if (!gate.allowed) return replySlash(interaction, makeEmbed('<:draven_trophy:1477349320171983069> Trivia', `A trivia question can only be started once every 4 hours in this channel. Try again in about ${fmtRemaining(gate.nextAllowedAt - Date.now())}.`), [], { ephemeral: false });

    await interaction.editReply({ embeds: [buildLoader(10)] }).catch(() => null);
    const loadingMessage = await interaction.fetchReply();

    const [question, answer] = await runLoaderUntilReady(loadingMessage, async () => getQuestion(ai, store, interaction.guildId));
    await store.markTriviaQuestionUsed(interaction.guildId, question);
    const rewardXp = store.getTriviaReward(interaction.guildId);
    setTriviaState(store, interaction.channelId, question, String(answer).toLowerCase(), rewardXp);
    await sendDravenLog(interaction.guild, store, 'TRIVIA STARTED', `By: <@${interaction.user.id}>\nChannel: <#${interaction.channelId}>\nReward XP: ${rewardXp}`);
    await interaction.editReply({ embeds: [buildQuestion(question, rewardXp)] }).catch(() => null);
  },
};
