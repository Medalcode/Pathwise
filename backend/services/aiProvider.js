const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true, strict: false });

/**
 * Thin adapter around Groq SDK to centralize AI calls and JSON validation.
 * Keeps direct Groq usage in one place and offers helpers to parse/validate
 * model outputs safely.
 */

function stripMarkdownAndCodeBlocks(text) {
  if (!text) return '';
  let s = text.trim();
  if (s.startsWith('```')) {
    s = s.replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ''));
  }
  // Remove leading/trailing backticks or markdown fences left
  s = s.replace(/^`+|`+$/g, '').trim();
  return s;
}

async function createGroqClient(apiKey) {
  if (!apiKey) throw new Error('AI provider API key missing');
  // Lazy require to avoid loading SDK when not needed
  const Groq = require('groq-sdk');
  return new Groq({ apiKey });
}

async function chatCompletion({ messages, model, temperature = 0.7, max_tokens = 2048, top_p = 1, response_format = null } = {}, apiKey) {
  if (!apiKey) throw new Error('AI provider API key missing');
  const client = await createGroqClient(apiKey);
  return client.chat.completions.create({ messages, model, temperature, max_tokens, top_p, stream: false, response_format });
}

function parseJsonSafely(text) {
  const cleaned = stripMarkdownAndCodeBlocks(text);
  try {
    return { ok: true, data: JSON.parse(cleaned) };
  } catch (err) {
    return { ok: false, error: err, cleaned }; 
  }
}

function validateAgainstSchema(schema, data) {
  const validate = ajv.compile(schema);
  const valid = validate(data);
  return { valid, errors: validate.errors || [] };
}

module.exports = {
  chatCompletion,
  parseJsonSafely,
  validateAgainstSchema
};
