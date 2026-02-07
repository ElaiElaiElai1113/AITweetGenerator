import type { Template } from "./templates";

const STORAGE_KEY = "aitg_custom_templates";

export function loadCustomTemplates(): Template[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Template[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t) => t && t.category === "custom" && t.id);
  } catch {
    return [];
  }
}

export function saveCustomTemplates(templates: Template[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // Ignore storage errors (private mode, quota, etc.)
  }
}
