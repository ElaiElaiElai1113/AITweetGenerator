/**
 * Audience Targeting
 * Tailors tweet content for specific audience types
 */

export type AudienceType = 'developers' | 'founders' | 'creators' | 'students' | 'executives' | 'general' | 'investors' | 'marketers';

export interface AudienceConfig {
  type: AudienceType;
  prompt: string;
  keywords: string[];
  avoidTopics: string[];
  toneGuidelines: string;
  examplePhrases: string[];
  hashtagSuggestions: string[];
}

export const audienceConfigs: Record<AudienceType, AudienceConfig> = {
  developers: {
    type: 'developers',
    prompt: 'technical, code-focused, development-friendly, uses appropriate tech jargon, understands programming concepts',
    keywords: ['code', 'debug', 'deploy', 'ship', 'feature', 'bug', 'API', 'repo', 'commit', 'stack', 'framework', 'library'],
    avoidTopics: ['overly simplistic explanations of basic concepts'],
    toneGuidelines: 'Use technical language when appropriate. Reference tools, frameworks, and development practices. Appeal to problem-solving mindset.',
    examplePhrases: [
      'Just shipped {feature}',
      'Spent {time} debugging only to find {issue}',
      'Hot take: {technology} is overrated',
      'The best code is no code',
      'Production incident at 3 AM:',
    ],
    hashtagSuggestions: ['#coding', '#programming', '#webdev', '#100DaysOfCode', '#CodeNewbie', '#Developer', '#TechCommunity'],
  },
  founders: {
    type: 'founders',
    prompt: 'startup-focused, growth-oriented, business-savvy, entrepreneurial mindset, discusses scaling, funding, product-market fit',
    keywords: ['startup', 'funding', 'scale', 'revenue', 'MRR', 'churn', 'growth', 'product', 'market', 'customer', 'pitch', 'VC'],
    avoidTopics: ['corporate bureaucracy', 'job security'],
    toneGuidelines: 'Focus on growth, metrics, and the founder journey. Share lessons learned about building businesses. Appeal to ambition and grit.',
    examplePhrases: [
      'We hit ${revenue} MRR!',
      'Biggest startup lesson: {lesson}',
      'Rejected by {number} VCs, then',
      'Product-market fit hit when',
      'The hardest thing about scaling:',
    ],
    hashtagSuggestions: ['#startup', '#entrepreneur', '#founder', '#SaaS', '#buildinpublic', '#indiehackers', '#business'],
  },
  creators: {
    type: 'creators',
    prompt: 'creator economy-focused, audience-building, monetization, content strategy, authentic voice, community engagement',
    keywords: ['audience', 'content', 'post', 'engage', 'followers', 'viral', 'algorithm', 'monetize', 'brand', 'deal', 'sponsor'],
    avoidTopics: ['corporate speak', 'overly formal language'],
    toneGuidelines: 'Be authentic and relatable. Share behind-the-scenes of content creation. Discuss platform algorithms and audience growth.',
    examplePhrases: [
      'Hit {number} followers!',
      'The algorithm changed again',
      'Creator tip: {tip}',
      'Brand deal horror story:',
      'How I grew to {number} in {time}',
    ],
    hashtagSuggestions: ['#creator', '#contentcreator', '#smallcreator', '#creatoreconomy', '#twt', '#YouTube', '#influencer'],
  },
  students: {
    type: 'students',
    prompt: 'educational, beginner-friendly, learning-focused, encouraging, accessible language, acknowledges struggle of learning',
    keywords: ['learn', 'study', 'exam', 'class', 'course', 'professor', 'assignment', 'grade', 'semester', 'student', 'university'],
    avoidTopics: ['overly technical jargon without explanation', 'assumed domain knowledge'],
    toneGuidelines: 'Be encouraging and relatable to the learning experience. Share study tips, validate struggles, celebrate small wins.',
    examplePhrases: [
      'Finally understood {concept}!',
      'Study tip that saved my GPA:',
      'Pulled an all-nighter so you don\'t have to',
      'The professor didn\'t teach this:',
      'Failed the exam, here\'s why:',
    ],
    hashtagSuggestions: ['#student', '#study', '#university', '#college', '#learn', '#studytwt', '#exam', '#studentlife'],
  },
  executives: {
    type: 'executives',
    prompt: 'professional, leadership-focused, strategic, concise, high-level thinking, industry trends, management wisdom',
    keywords: ['leadership', 'strategy', 'team', 'manage', 'lead', 'executive', 'decision', 'vision', 'culture', 'organization', 'scale'],
    avoidTopics: ['entry-level struggles', 'complaining about workload'],
    toneGuidelines: 'Project leadership experience. Share strategic insights. Be concise and professional. Focus on high-level thinking.',
    examplePhrases: [
      'Leadership lesson from {years} years:',
      'The best management decision I made:',
      'Building culture at scale:',
      'Executive perspective on {topic}:',
      'The hard choice I made:',
    ],
    hashtagSuggestions: ['#leadership', '#management', '#executive', '#strategy', '#business', '#Csuite', '#startuplife'],
  },
  general: {
    type: 'general',
    prompt: 'accessible, relatable, broadly appealing, avoids jargon, universal themes, everyday experiences, conversational',
    keywords: ['life', 'everyone', 'people', 'thing', 'think', 'feel', 'today', 'sometimes', 'always', 'never', 'really'],
    avoidTopics: ['highly technical or niche subjects without context'],
    toneGuidelines: 'Keep it simple and relatable. Use universal experiences. Avoid jargon or explain it simply. Be conversational.',
    examplePhrases: [
      'Is it just me or',
      'The worst is when',
      'Why do we always',
      'Something I\'ve been thinking about:',
      'Quick thought for today:',
    ],
    hashtagSuggestions: ['#thoughts', '#life', '#real', '#relatable', '#daily', '#mood', '#vibes'],
  },
  investors: {
    type: 'investors',
    prompt: 'financially-focused, market-aware, returns-oriented, risk-conscious, data-driven, discusses markets, portfolios, allocations',
    keywords: ['invest', 'return', 'portfolio', 'market', 'stock', 'fund', 'yield', 'dividend', 'allocation', 'risk', 'asset'],
    avoidTopics: ['gambling terminology', 'get rich quick schemes'],
    toneGuidelines: 'Focus on fundamentals and long-term thinking. Share market insights. Be data-driven. Discuss risk management.',
    examplePhrases: [
      'Allocation thesis for {year}:',
      'Market insight from {context}:',
      'The risk everyone ignores:',
      'Position update: {ticker}',
      'Why I\'m (not) investing in {sector}:',
    ],
    hashtagSuggestions: ['#investing', '#stocks', '#finance', '#market', '#portfolio', '#trading', '#financialfreedom'],
  },
  marketers: {
    type: 'marketers',
    prompt: 'marketing-focused, growth-hacking, data-driven, customer psychology, conversion-optimized, campaign insights, brand strategy',
    keywords: ['campaign', 'conversion', 'funnel', 'CTR', 'engagement', 'brand', 'audience', 'strategy', 'growth', 'channel', 'copy'],
    avoidTopics: ['overly technical implementation details'],
    toneGuidelines: 'Share marketing wins and failures. Discuss customer psychology. Focus on metrics and optimization. Be creative and analytical.',
    examplePhrases: [
      '{number}% conversion increase with this change:',
      'A/B test result surprised me:',
      'The best-performing copy structure:',
      'Campaign insight from {spend} spend:',
      'Why this ad failed:',
    ],
    hashtagSuggestions: ['#marketing', '#digitalmarketing', '#growth', '#branding', '#advertising', '#SEO', '#PPC', '#marketingtips'],
  },
};

/**
 * Get audience prompt for tweet generation
 */
export function getAudiencePrompt(audience: AudienceType): string {
  return audienceConfigs[audience]?.prompt || '';
}

/**
 * Get tone guidelines for an audience
 */
export function getAudienceToneGuidelines(audience: AudienceType): string {
  return audienceConfigs[audience]?.toneGuidelines || '';
}

/**
 * Get hashtag suggestions for an audience
 */
export function getAudienceHashtags(audience: AudienceType): string[] {
  return audienceConfigs[audience]?.hashtagSuggestions || [];
}

/**
 * Get example phrases for an audience
 */
export function getAudienceExamples(audience: AudienceType): string[] {
  return audienceConfigs[audience]?.examplePhrases || [];
}

/**
 * Enhance prompt with audience context
 */
export function addAudienceToPrompt(basePrompt: string, audience: AudienceType): string {
  const config = audienceConfigs[audience];
  if (!config) return basePrompt;

  return `${basePrompt}

Target Audience: ${audience}
- Write for: ${config.prompt}
- ${config.toneGuidelines}
`;
}

/**
 * Get all available audiences with their descriptions
 */
export function getAllAudiences(): Array<{ value: AudienceType; label: string; description: string }> {
  return Object.entries(audienceConfigs).map(([audience, config]) => ({
    value: audience as AudienceType,
    label: audience.charAt(0).toUpperCase() + audience.slice(1),
    description: config.prompt,
  }));
}

/**
 * Suggest audience based on topic/keywords
 */
export function suggestAudience(topic: string): AudienceType | null {
  const lowerTopic = topic.toLowerCase();

  // Score each audience based on keyword matches
  const scores: Record<AudienceType, number> = {
    developers: 0,
    founders: 0,
    creators: 0,
    students: 0,
    executives: 0,
    general: 0,
    investors: 0,
    marketers: 0,
  };

  for (const [audience, config] of Object.entries(audienceConfigs)) {
    for (const keyword of config.keywords) {
      if (lowerTopic.includes(keyword)) {
        scores[audience as AudienceType]++;
      }
    }
  }

  // Find audience with highest score
  let maxScore = 0;
  let suggestedAudience: AudienceType | null = null;

  for (const [audience, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      suggestedAudience = audience as AudienceType;
    }
  }

  // Only return if there's at least one keyword match, otherwise default to general
  return maxScore > 0 ? suggestedAudience : 'general';
}
