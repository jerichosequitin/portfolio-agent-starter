import { z } from 'zod';

import portfolioContent from '@/content/portfolio.json';

const boundedText = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`);

const publicUrl = z
  .string()
  .url()
  .max(500)
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
  }, 'URL must use http or https');

const portfolioImage = z.object({
  src: z.string().max(200).regex(
    /^\/images\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.(?:avif|webp|png|jpe?g)$/i,
    'Image must be a local file under /images/',
  ),
  alt: boundedText('Image description', 300),
});

export const portfolioSchema = z.object({
  profile: z.object({
    name: boundedText('Name', 80),
    role: boundedText('Role', 120),
    intro: boundedText('Introduction', 500),
    headline: z.object({
      text: boundedText('Headline', 80),
      emphasis: boundedText('Headline emphasis', 80),
    }).optional(),
    image: portfolioImage.optional(),
    location: boundedText('Location', 120),
    email: z.string().trim().email().max(254),
    availability: boundedText('Availability', 240),
    links: z
      .array(
        z.object({
          label: boundedText('Link label', 40),
          url: publicUrl,
        }),
      )
      .max(8),
  }),
  about: z.array(boundedText('About paragraph', 800)).min(1).max(6),
  experience: z
    .array(
      z.object({
        role: boundedText('Experience role', 120),
        organization: boundedText('Organization', 120),
        period: boundedText('Experience period', 80),
        summary: boundedText('Experience summary', 800),
      }),
    )
    .max(12),
  projects: z
    .array(
      z.object({
        title: boundedText('Project title', 120),
        summary: boundedText('Project summary', 800),
        tags: z.array(boundedText('Project tag', 40)).max(8),
        url: publicUrl.optional(),
        image: portfolioImage.optional(),
      }),
    )
    .max(12),
});

export type Portfolio = z.infer<typeof portfolioSchema>;

export const portfolio: Portfolio = portfolioSchema.parse(portfolioContent);
