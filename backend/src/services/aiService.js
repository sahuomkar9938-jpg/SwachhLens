const fs = require("fs/promises");
const sharp = require("sharp");
const { normalizeAiAnalysis } = require("./reportDataService");

const HF_URL = "https://router.huggingface.co/v1/chat/completions";
const MODELS = [
  process.env.HF_PRIMARY_MODEL || "Qwen/Qwen2.5-VL-3B-Instruct:featherless-ai",
  process.env.HF_FALLBACK_MODEL || "google/gemma-3-27b-it:novita",
];
const MAX_IMAGE_SIZE = 768;
const REQUEST_TIMEOUT = 30_000;

const PROMPT = `Analyze the garbage/waste visible in this image.

Return ONLY valid JSON using this exact structure:
{
  "garbage_type": "Plastic | Paper | Cardboard | Glass | Metal | Organic Waste | Food Waste | Electronic Waste | Textile | Mixed Waste | Other",
  "objects_detected": [],
  "estimated_count": 0,
  "condition": "",
  "clean_or_dirty": "",
  "wet_or_dry": "",
  "recyclable": true,
  "amount": "low | medium | high",
  "severity": "low | medium | high | critical",
  "disposal_recommendation": "",
  "description": ""
}

Do not claim anything that cannot reasonably be determined visually.`;

function parseJson(text) {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end <= start) {
    throw new Error("Model did not return valid JSON");
  }

  return JSON.parse(cleaned.slice(start, end + 1));
}

async function optimizeImage(imagePath) {
  return sharp(await fs.readFile(imagePath))
    .rotate()
    .resize({ width: MAX_IMAGE_SIZE, height: MAX_IMAGE_SIZE, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
}

async function callModel(model, imageBase64) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(HF_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        }],
        max_tokens: 500,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      throw new Error(`Hugging Face HTTP ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    const output = result.choices?.[0]?.message?.content;

    if (!output) {
      throw new Error("Hugging Face returned no model content");
    }

    return normalizeAiAnalysis(parseJson(output), model);
  } finally {
    clearTimeout(timeout);
  }
}

async function analyzeWasteImage(imagePath) {
  if (!process.env.HF_TOKEN) {
    throw new Error("HF_TOKEN is not configured");
  }

  const optimizedImage = await optimizeImage(imagePath);
  const imageBase64 = optimizedImage.toString("base64");
  const errors = [];

  for (const model of MODELS) {
    try {
      return await callModel(model, imageBase64);
    } catch (error) {
      errors.push(`${model}: ${error.message}`);
    }
  }

  throw new Error(`All Hugging Face models failed: ${errors.join("; ")}`);
}


module.exports = {
  analyzeWasteImage
};