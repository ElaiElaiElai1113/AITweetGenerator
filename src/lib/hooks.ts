/**
 * Viral Tweet Hooks Library
 * Pre-built hooks that grab attention and drive engagement
 */

export interface TweetHook {
  template: string;
  category: 'opinion' | 'story' | 'list' | 'question' | 'counter-intuitive' | 'personal';
  placeholder?: string;
}

export const hookCategories = {
  opinion: [
    "Unpopular opinion:",
    "Hot take that might get me cancelled:",
    "Controversial opinion but:",
    "An opinion that will age poorly:",
    "Tell me I'm wrong:",
  ],
  story: [
    "I've been {profession/role} for {time} and here's what I learned:",
    "A story about {topic} that changed my life:",
    "The craziest thing just happened at {place}:",
    "I almost gave up on {topic}. Then this happened:",
    "Let me tell you a secret about {topic}:",
  ],
  list: [
    "Stop doing these {number} things:",
    "{number} things I wish I knew earlier about {topic}:",
    "The {number} commandments of {topic}:",
    "{number} myths about {topic} that need to die:",
    "Here's the brutal truth about {topic}:",
  ],
  question: [
    "Why does everyone ignore this about {topic}?",
    "Can someone explain why {topic} is so hard?",
    "Am I the only one who thinks {topic}?",
    "Why isn't anyone talking about {topic}?",
    "Who else agrees that {topic}?",
  ],
  counterIntuitive: [
    "The best way to {action} is to do the opposite:",
    "Everything you know about {topic} is wrong:",
    "The worst advice I ever got about {topic}:",
    "Paradoxically, {action} makes you worse at {topic}:",
    "Counter-intuitive truth about {topic}:",
  ],
  personal: [
    "I made {number} mistakes so you don't have to:",
    "My biggest regret about {topic}:",
    "If I could start over in {topic}, I'd:",
    "The advice I'd give my younger self about {topic}:",
    "Personal confession about {topic}:",
  ],
} as const;

export const viralHooks: TweetHook[] = [
  // Opinion hooks
  { template: "Unpopular opinion:", category: "opinion" },
  { template: "Hot take:", category: "opinion" },
  { template: "Tell me I'm wrong:", category: "opinion" },
  { template: "This opinion might get me cancelled:", category: "opinion" },
  { template: "Controversial take:", category: "opinion" },

  // Story hooks
  { template: "I've been {role} for {time} and here's what I learned:", category: "story", placeholder: "role: developer, time: 5 years" },
  { template: "A story about {topic} that changed my life:", category: "story", placeholder: "topic: programming" },
  { template: "The craziest thing just happened:", category: "story" },
  { template: "I almost gave up. Then this happened:", category: "story" },
  { template: "Let me tell you a secret:", category: "story" },

  // List hooks
  { template: "Stop doing these {number} things:", category: "list", placeholder: "number: 5" },
  { template: "{number} things I wish I knew earlier:", category: "list", placeholder: "number: 7" },
  { template: "The {number} commandments of {topic}:", category: "list", placeholder: "number: 10, topic: coding" },
  { template: "{number} myths that need to die:", category: "list", placeholder: "number: 3" },
  { template: "Here's the brutal truth:", category: "list" },

  // Question hooks
  { template: "Why does everyone ignore this?", category: "question" },
  { template: "Can someone explain why {topic} is so hard?", category: "question", placeholder: "topic: debugging" },
  { template: "Am I the only one who thinks {topic}?", category: "question", placeholder: "topic: meetings are useless" },
  { template: "Why isn't anyone talking about {topic}?", category: "question" },
  { template: "Who else agrees?", category: "question" },

  // Counter-intuitive hooks
  { template: "The best way to {action} is to do the opposite:", category: "counter-intuitive", placeholder: "action: learn faster" },
  { template: "Everything you know about {topic} is wrong:", category: "counter-intuitive" },
  { template: "The worst advice I ever got:", category: "counter-intuitive" },
  { template: "Paradoxically, doing {action} makes you worse:", category: "counter-intuitive", placeholder: "action: working harder" },
  { template: "Counter-intuitive truth:", category: "counter-intuitive" },

  // Personal hooks
  { template: "I made {number} mistakes so you don't have to:", category: "personal", placeholder: "number: 10" },
  { template: "My biggest regret:", category: "personal" },
  { template: "If I could start over, I'd:", category: "personal" },
  { template: "The advice I'd give my younger self:", category: "personal" },
  { template: "Personal confession:", category: "personal" },
];

/**
 * Fill in a hook template with provided values
 */
export function fillHookTemplate(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

/**
 * Get random hooks by category
 */
export function getHooksByCategory(category: TweetHook['category'], count: number = 5): TweetHook[] {
  const filtered = viralHooks.filter(h => h.category === category);
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Get random hooks from all categories
 */
export function getRandomHooks(count: number = 5): TweetHook[] {
  const shuffled = [...viralHooks].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Get hook suggestions based on topic/context
 */
export function getHookSuggestions(context: string): TweetHook[] {
  const lowerContext = context.toLowerCase();

  // Analyze context to suggest relevant hooks
  let suggestedCategories: TweetHook['category'][] = [];

  if (lowerContext.match(/learn|taught|know|understand|knowledge/)) {
    suggestedCategories.push('story', 'list');
  }
  if (lowerContext.match(/think|believe|opinion|wrong|right/)) {
    suggestedCategories.push('opinion', 'counter-intuitive');
  }
  if (lowerContext.match(/why|how|question|explain/)) {
    suggestedCategories.push('question');
  }
  if (lowerContext.match(/i|me|my|personal|experience|regret/)) {
    suggestedCategories.push('personal');
  }
  if (lowerContext.match(/mistake|error|fail|wrong|myth/)) {
    suggestedCategories.push('list', 'counter-intuitive');
  }

  // If no specific category detected, return mix
  if (suggestedCategories.length === 0) {
    suggestedCategories = ['opinion', 'story', 'list'];
  }

  const hooks = suggestedCategories.flatMap(cat => getHooksByCategory(cat, 3));
  return hooks.sort(() => Math.random() - 0.5).slice(0, 6);
}
