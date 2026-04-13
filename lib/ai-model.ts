const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"
const configuredGeminiModel = process.env.GOOGLE_GENERATIVE_AI_MODEL?.trim()

if (!configuredGeminiModel) {
  console.warn(
    `GOOGLE_GENERATIVE_AI_MODEL is not set; falling back to default model: ${DEFAULT_GEMINI_MODEL}`
  )
}

export const GEMINI_MODEL_NAME = configuredGeminiModel || DEFAULT_GEMINI_MODEL
