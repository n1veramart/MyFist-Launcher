const OpenAI = require('openai');
const { OPENAI_API_KEY, OPENAI_MODEL } = require('../config/env');

class AIService {
  constructor() {
    this.client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;
    this.model = OPENAI_MODEL;
  }

  _extractTextFromResponses(output = []) {
    const parts = [];
    for (const item of output) {
      const content = item?.content || [];
      for (const chunk of content) if (chunk?.type === 'output_text' && chunk?.text) parts.push(chunk.text);
    }
    return parts.join('\n').trim();
  }

  async _call(prompt) {
    if (!this.client) return null;
    try {
      const out = await this.client.responses.create({ model: this.model, input: prompt });
      const text = out.output_text || this._extractTextFromResponses(out.output);
      if (text && text.trim()) return text.trim();
    } catch {
      return null;
    }
    return null;
  }

  async randomTopic(seedHint = '') {
    const prompt = `Provide exactly one concise Discord-safe discussion starter question. No numbering. Context: ${seedHint || 'general productivity/server community'}`;
    const out = await this._call(prompt);
    return out ? out.split('\n')[0].slice(0, 220) : null;
  }

  async randomReviverPrompt(seedHint = '') {
    const entropy = Date.now();
    const prompt = `Generate one unique Discord-safe reviver discussion prompt only (single sentence, no numbering). Context: ${seedHint || 'inactive discord channel revival'}. Entropy seed: ${entropy}.`;
    const out = await this._call(prompt);
    return out ? out.split('\n')[0].slice(0, 220) : null;
  }

  async randomTriviaQuestion(exclude = []) {
    const excluded = (exclude || []).slice(0, 20).join(' | ');
    const prompt = `Generate one short trivia QA pair as JSON only: {"question":"...","answer":"..."}. Keep it safe and varied. Never repeat any of these questions: ${excluded || 'none'}`;
    const raw = await this._call(prompt);
    if (!raw) return null;
    try {
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start === -1 || end === -1) return null;
      const parsed = JSON.parse(raw.slice(start, end + 1));
      if (!parsed.question || !parsed.answer) return null;
      return { question: String(parsed.question).slice(0, 180), answer: String(parsed.answer).trim().toLowerCase() };
    } catch {
      return null;
    }
  }

  async randomQuestChallenge() {
    const prompt = 'Generate one daily quest question and exact short answer as JSON only: {"question":"...","answer":"..."}. Keep answer short and objective.';
    const raw = await this._call(prompt);
    if (!raw) return null;
    try {
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start === -1 || end === -1) return null;
      const parsed = JSON.parse(raw.slice(start, end + 1));
      if (!parsed.question || !parsed.answer) return null;
      return { question: String(parsed.question).slice(0, 220), answer: String(parsed.answer).trim().toLowerCase() };
    } catch {
      return null;
    }
  }
}

module.exports = { AIService };
