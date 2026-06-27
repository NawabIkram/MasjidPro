const requestsByUser = new Map();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 12;

const clean = (value, max = 4000) => String(value ?? "").trim().slice(0, max);

const providerError = (provider, response, payload) => {
  const message = payload?.error?.message || payload?.message || `Request failed with status ${response.status}.`;
  return Object.assign(new Error(`${provider}: ${clean(message, 240)}`), {
    provider,
    statusCode: response.status,
  });
};

async function postJSON(url, headers, body, provider) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 18_000);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw providerError(provider, response, payload);
    return payload;
  } catch (error) {
    if (error.name === "AbortError") {
      throw Object.assign(new Error(`${provider}: request timed out.`), { provider, statusCode: 504 });
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function askGroq(system, prompt, options) {
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
  const payload = await postJSON(
    "https://api.groq.com/openai/v1/chat/completions",
    { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    {
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      temperature: options.temperature,
      max_completion_tokens: options.maxTokens,
    },
    "Groq",
  );
  return { text: clean(payload.choices?.[0]?.message?.content, 12_000), provider: "Groq", model };
}

async function askGemini(system, prompt, options) {
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
  const payload = await postJSON(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    { "x-goog-api-key": process.env.GEMINI_API_KEY },
    {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
      },
    },
    "Gemini",
  );
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n");
  return { text: clean(text, 12_000), provider: "Gemini", model };
}

async function askMistral(system, prompt, options) {
  const model = process.env.MISTRAL_MODEL || "mistral-small-latest";
  const payload = await postJSON(
    "https://api.mistral.ai/v1/chat/completions",
    { Authorization: `Bearer ${process.env.MISTRAL_API_KEY}` },
    {
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    },
    "Mistral",
  );
  const content = payload.choices?.[0]?.message?.content;
  const text = Array.isArray(content)
    ? content.map((part) => part.text || part.content || "").join("\n")
    : content;
  return { text: clean(text, 12_000), provider: "Mistral", model };
}

const providers = [
  { name: "Groq", key: "GROQ_API_KEY", ask: askGroq },
  { name: "Gemini", key: "GEMINI_API_KEY", ask: askGemini },
  { name: "Mistral", key: "MISTRAL_API_KEY", ask: askMistral },
];

export function configuredAIProviders() {
  return providers.filter((provider) => Boolean(process.env[provider.key])).map((provider) => provider.name);
}

export function enforceAIRateLimit(userId) {
  const currentTime = Date.now();
  const recent = (requestsByUser.get(userId) || []).filter((timestamp) => currentTime - timestamp < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    throw Object.assign(new Error("AI request limit reached. Please wait one minute and try again."), { statusCode: 429 });
  }
  requestsByUser.set(userId, [...recent, currentTime]);
}

export async function generateAI({ prompt, system, temperature = 0.35, maxTokens = 700 }) {
  const safePrompt = clean(prompt);
  if (!safePrompt) throw Object.assign(new Error("Please enter a message for Masjid AI."), { statusCode: 422 });

  const activeProviders = providers.filter((provider) => Boolean(process.env[provider.key]));
  if (!activeProviders.length) {
    throw Object.assign(new Error("Masjid AI providers are not configured."), { statusCode: 503 });
  }

  const failures = [];
  for (const provider of activeProviders) {
    try {
      const result = await provider.ask(clean(system, 5000), safePrompt, {
        temperature: Math.max(0, Math.min(Number(temperature), 1)),
        maxTokens: Math.max(80, Math.min(Number(maxTokens), 1600)),
      });
      if (result.text) return result;
      failures.push(`${provider.name}: empty response`);
    } catch (error) {
      failures.push(error.message);
    }
  }

  console.error("All AI providers failed", failures);
  throw Object.assign(new Error("Masjid AI is temporarily unavailable. Please try again shortly."), { statusCode: 502 });
}
