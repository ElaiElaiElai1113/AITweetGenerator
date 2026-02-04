// Common hashtag categories
export const HASHTAG_CATEGORIES = {
  tech: [
    "#coding", "#programming", "#developer", "#webdev", "#javascript",
    "#python", "#react", "#vue", "#angular", "#nodejs", "#100DaysOfCode",
    "#CodeNewbie", "#DevLife", "#TechTalk", "#SoftwareEngineering",
  ],
  business: [
    "#entrepreneur", "#startup", "#business", "#marketing", "#sales",
    "#leadership", "#innovation", "#growth", "#strategy", "#networking",
    "#SmallBusiness", "#BizTip", "#CEO", "#founder", "#vc",
  ],
  productivity: [
    "#productivity", "#timemanagement", "#goals", "#motivation",
    "#success", "#mindset", "#habits", "#learning", "#growth", "#selfimprovement",
    "#GetThingsDone", "#Focus", "#Discipline", "#Grind",
  ],
  social: [
    "#community", "#connection", "#viral", "#trending", "#lifestyle",
    "#inspiration", "#positivity", "#goodvibes", "#wellness", "#mentalhealth",
    "#SelfCare", "#LifeHacks", "#DailyReminder", "# motivation",
  ],
  creative: [
    "#design", "#art", "#creative", "#illustration", "#photography",
    "#contentcreator", "#digitalart", "#graphicdesign", "#ux", "#ui",
    "#DesignInspiration", "#ArtistOnTwitter", "#CreativeProcess",
  ],
  ai: [
    "#AI", "#MachineLearning", "#DeepLearning", "#DataScience", "#ChatGPT",
    "#ArtificialIntelligence", "#LLM", "#Automation", "#FutureTech",
    "#Innovation", "#TechTrends", "#AIart", "#PromptEngineering",
  ],
};

// Generate contextual hashtags based on topic keywords
export function generateHashtags(topic: string, count: number = 5): string[] {
  const topicLower = topic.toLowerCase();
  const suggestions: string[] = [];

  // Find matching categories based on keywords
  const keywords = {
    tech: ["code", "program", "develop", "app", "software", "web", "react", "vue", "angular", "node", "api", "database"],
    business: ["business", "startup", "company", "entrepreneur", "marketing", "sales", "revenue", "customer", "client"],
    productivity: ["productivity", "time", "goal", "habit", "routine", "focus", "plan", "organize", "manage"],
    social: ["community", "people", "connect", "share", "viral", "trend", "social", "friend", "relationship"],
    creative: ["design", "art", "creative", "create", "visual", "brand", "style", "aesthetic", "content"],
    ai: ["ai", "artificial", "intelligence", "machine", "learning", "model", "chatgpt", "automation", "data", "neural"],
  };

  // Score each category based on keyword matches
  const scores: Record<string, number> = {};
  for (const [category, words] of Object.entries(keywords)) {
    for (const word of words) {
      if (topicLower.includes(word)) {
        scores[category] = (scores[category] || 0) + 1;
      }
    }
  }

  // Get top categories
  const topCategories = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([category]) => category as keyof typeof HASHTAG_CATEGORIES);

  // Add hashtags from top categories
  for (const category of topCategories) {
    const tags = HASHTAG_CATEGORIES[category];
    for (const tag of tags) {
      if (suggestions.length >= count) break;
      if (!suggestions.includes(tag)) {
        suggestions.push(tag);
      }
    }
  }

  // Fill remaining with generic popular hashtags if needed
  const genericTags = ["#viral", "#trending", "#motivation", "#inspiration", "#tips"];
  for (const tag of genericTags) {
    if (suggestions.length >= count) break;
    if (!suggestions.includes(tag)) {
      suggestions.push(tag);
    }
  }

  return suggestions.slice(0, count);
}

// Get popular hashtags by category
export function getHashtagsByCategory(category: keyof typeof HASHTAG_CATEGORIES): string[] {
  return HASHTAG_CATEGORIES[category] || [];
}

// Get all hashtag categories
export function getHashtagCategories(): string[] {
  return Object.keys(HASHTAG_CATEGORIES);
}
