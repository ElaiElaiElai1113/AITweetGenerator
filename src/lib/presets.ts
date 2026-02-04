import type { AdvancedSettings } from "./settings";

export interface SettingsPreset {
  id: string;
  name: string;
  description: string;
  settings: {
    style: "viral" | "professional" | "casual" | "thread";
    includeHashtags: boolean;
    includeEmojis: boolean;
    advancedSettings: AdvancedSettings;
  };
  timestamp: number;
}

const PRESETS_KEY = "tweet_generator_presets";

// Default presets
export const DEFAULT_PRESETS: SettingsPreset[] = [
  {
    id: "viral-engaging",
    name: "Viral & Engaging",
    description: "Maximize engagement with hashtags and emojis",
    settings: {
      style: "viral",
      includeHashtags: true,
      includeEmojis: true,
      advancedSettings: {
        temperature: 0.9,
        tone: "playful",
        length: "medium",
      },
    },
    timestamp: Date.now(),
  },
  {
    id: "professional-concise",
    name: "Professional & Concise",
    description: "Business-focused, short and to the point",
    settings: {
      style: "professional",
      includeHashtags: false,
      includeEmojis: false,
      advancedSettings: {
        temperature: 0.5,
        tone: "formal",
        length: "short",
      },
    },
    timestamp: Date.now(),
  },
  {
    id: "casual-friendly",
    name: "Casual & Friendly",
    description: "Relaxed tone for everyday tweets",
    settings: {
      style: "casual",
      includeHashtags: true,
      includeEmojis: true,
      advancedSettings: {
        temperature: 0.7,
        tone: "casual",
        length: "medium",
      },
    },
    timestamp: Date.now(),
  },
];

// Get all presets
export function getPresets(): SettingsPreset[] {
  try {
    const stored = localStorage.getItem(PRESETS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Initialize with defaults if none exist
    localStorage.setItem(PRESETS_KEY, JSON.stringify(DEFAULT_PRESETS));
    return DEFAULT_PRESETS;
  } catch {
    return DEFAULT_PRESETS;
  }
}

// Save a new preset
export function savePreset(
  name: string,
  description: string,
  settings: SettingsPreset["settings"]
): SettingsPreset {
  const presets = getPresets();
  const newPreset: SettingsPreset = {
    id: `preset-${Date.now()}`,
    name,
    description,
    settings,
    timestamp: Date.now(),
  };
  localStorage.setItem(PRESETS_KEY, JSON.stringify([newPreset, ...presets]));
  return newPreset;
}

// Delete a preset
export function deletePreset(id: string): SettingsPreset[] {
  const presets = getPresets().filter((p) => p.id !== id);
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  return presets;
}

// Load a preset's settings
export function loadPreset(id: string): SettingsPreset["settings"] | null {
  const presets = getPresets();
  const preset = presets.find((p) => p.id === id);
  return preset?.settings || null;
}
