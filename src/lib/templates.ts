export interface Template {
  id: string;
  name: string;
  emoji: string;
  description: string;
  prompt: string;
  category: "marketing" | "engagement" | "educational" | "news" | "personal" | "custom";
}

export const TEMPLATES: Template[] = [
  {
    id: "product-launch",
    name: "Product Launch",
    emoji: "📦",
    description: "Announce a new product or feature",
    category: "marketing",
    prompt: "Create excitement around a new product launch. Highlight the main benefit, include a call-to-action, and make it shareable.",
  },
  {
    id: "news-commentary",
    name: "News Commentary",
    emoji: "📰",
    description: "Share your thoughts on current events",
    category: "news",
    prompt: "Provide an insightful take on current events or news. Be balanced but opinionated, add unique perspective.",
  },
  {
    id: "tips-tricks",
    name: "Tips & Tricks",
    emoji: "💡",
    description: "Share helpful advice or life hacks",
    category: "educational",
    prompt: "Share practical, actionable tips that provide immediate value. Keep it concise and easy to implement.",
  },
  {
    id: "thread-starter",
    name: "Thread Starter",
    emoji: "🧵",
    description: "Begin an educational thread",
    category: "educational",
    prompt: "Start a thread that teaches something valuable. Hook readers with the first tweet and outline what's coming.",
  },
  {
    id: "call-to-action",
    name: "Call to Action",
    emoji: "🎯",
    description: "Drive conversions or sign-ups",
    category: "marketing",
    prompt: "Create urgency and drive action. Focus on benefits, use power words, and include a clear CTA.",
  },
  {
    id: "engagement-question",
    name: "Engagement Question",
    emoji: "❓",
    description: "Ask questions to boost engagement",
    category: "engagement",
    prompt: "Pose an interesting question that sparks discussion. Make it relatable and easy to answer.",
  },
  {
    id: "data-insight",
    name: "Data Insight",
    emoji: "📊",
    description: "Share statistics or research findings",
    category: "educational",
    prompt: "Present data or research in an digestible way. Highlight key takeaways and implications.",
  },
  {
    id: "behind-scenes",
    name: "Behind the Scenes",
    emoji: "🎬",
    description: "Show your process or journey",
    category: "personal",
    prompt: "Share authentic moments from your work or creative process. Be vulnerable and relatable.",
  },
  {
    id: "motivational",
    name: "Motivational",
    emoji: "🔥",
    description: "Inspire and motivate your audience",
    category: "personal",
    prompt: "Create an uplifting message that resonates emotionally. Use powerful imagery and words.",
  },
  {
    id: "controversial-opinion",
    name: "Hot Take",
    emoji: "🔥",
    description: "Share a provocative opinion",
    category: "engagement",
    prompt: "Share a contrarian view that generates discussion. Be thoughtful but provocative.",
  },
  {
    id: "storytelling",
    name: "Story Time",
    emoji: "📖",
    description: "Tell a compelling story",
    category: "personal",
    prompt: "Craft a narrative with a clear beginning, middle, and end. Make it relatable and emotional.",
  },
  {
    id: "resource-sharing",
    name: "Resource Drop",
    emoji: "🎁",
    description: "Share valuable resources or tools",
    category: "educational",
    prompt: "Curate and share useful resources. Explain why each one is valuable and how to use it.",
  },
];

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: Template["category"]): Template[] {
  return TEMPLATES.filter((t) => t.category === category);
}

export function getAllCategories(): Template["category"][] {
  return Array.from(new Set(TEMPLATES.map((t) => t.category)));
}
