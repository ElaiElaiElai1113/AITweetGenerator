export interface AdvancedSettings {
  temperature: number;
  tone: "formal" | "neutral" | "casual" | "playful";
  length: "short" | "medium" | "long";
}

export const DEFAULT_SETTINGS: AdvancedSettings = {
  temperature: 0.7,
  tone: "neutral",
  length: "medium",
};

export const TEMPERATURE_OPTIONS = [
  { value: 0.3, label: "Precise (0.3)", description: "More focused, less creative" },
  { value: 0.5, label: "Balanced (0.5)", description: "Good balance" },
  { value: 0.7, label: "Creative (0.7)", description: "Default, good variety" },
  { value: 0.9, label: "Very Creative (0.9)", description: "Maximum variety" },
  { value: 1.2, label: "Experimental (1.2)", description: "Unpredictable results" },
];

export const TONE_OPTIONS = [
  { value: "formal", label: "Professional", description: "Business-appropriate" },
  { value: "neutral", label: "Neutral", description: "Balanced tone" },
  { value: "casual", label: "Casual", description: "Friendly and relaxed" },
  { value: "playful", label: "Playful", description: "Fun and entertaining" },
];

export const LENGTH_OPTIONS = [
  { value: "short", label: "Short", min: 50, max: 150, description: "~100 chars" },
  { value: "medium", label: "Medium", min: 150, max: 230, description: "~200 chars" },
  { value: "long", label: "Long", min: 230, max: 280, description: "~280 chars" },
];

export function getTonePrompt(tone: AdvancedSettings["tone"]): string {
  const tonePrompts = {
    formal: "Write in a professional, business-appropriate tone. Use complete sentences and avoid slang.",
    neutral: "Write in a balanced, neutral tone that appeals to a general audience.",
    casual: "Write in a friendly, conversational tone as if talking to a friend.",
    playful: "Write in a fun, entertaining tone with humor and personality.",
  };
  return tonePrompts[tone];
}

export function getLengthPrompt(length: AdvancedSettings["length"]): string {
  const lengthPrompts = {
    short: "Keep it concise and punchy. Aim for around 100 characters.",
    medium: "Provide moderate detail. Aim for around 200 characters.",
    long: "Use the full space available. Aim for 270-280 characters.",
  };
  return lengthPrompts[length];
}
