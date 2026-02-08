import { z } from 'zod';

/**
 * Validation schemas for tweet generation
 * Uses Zod for runtime type checking and validation
 */

export const tweetGenerationSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(500, 'Topic too long (max 500 characters)'),
  style: z.enum(['viral', 'professional', 'casual', 'thread'], {
    message: 'Invalid tweet style'
  }),
  includeHashtags: z.boolean(),
  includeEmojis: z.boolean(),
  template: z.string().optional(),
  useTemplate: z.boolean().optional(),
  mood: z.enum(['enthusiastic', 'professional', 'casual', 'urgent', 'thoughtful']).optional(),
  audience: z.enum(['developers', 'general', 'business', 'students', 'creators']).optional(),
  hook: z.string().max(100, 'Hook too long (max 100 characters)').optional(),
  personal: z.boolean().default(true),
  advancedSettings: z.object({
    temperature: z.number().min(0).max(2).default(0.7),
    tone: z.enum(['neutral', 'positive', 'negative', 'urgent']).default('neutral'),
    length: z.enum(['short', 'medium', 'long']).default('medium')
  }).optional()
});

export const batchRequestSchema = tweetGenerationSchema.extend({
  batchCount: z.number().min(2).max(5).default(3)
});

// Type exports for use throughout the app
export type TweetGenerationRequest = z.infer<typeof tweetGenerationSchema>;
export type BatchRequest = z.infer<typeof batchRequestSchema>;

/**
 * Validate tweet generation request
 * @throws {ZodError} If validation fails
 */
export function validateTweetRequest(data: unknown): TweetGenerationRequest {
  return tweetGenerationSchema.parse(data);
}

/**
 * Safely validate tweet generation request
 * Returns { success: true, data } or { success: false, error }
 */
export function safeValidateTweetRequest(data: unknown) {
  return tweetGenerationSchema.safeParse(data);
}

/**
 * Validate batch request
 * @throws {ZodError} If validation fails
 */
export function validateBatchRequest(data: unknown): BatchRequest {
  return batchRequestSchema.parse(data);
}
