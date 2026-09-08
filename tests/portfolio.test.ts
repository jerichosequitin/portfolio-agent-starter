import { describe, expect, test } from 'bun:test';

import { portfolio, portfolioSchema } from '@/lib/portfolio';

describe('portfolio content contract', () => {
  test('accepts the bundled example portfolio', () => {
    expect(portfolioSchema.parse(portfolio)).toEqual(portfolio);
  });

  test('keeps existing portfolios valid without optional visual content', () => {
    const content = structuredClone(portfolio);
    delete content.profile.headline;
    delete content.profile.image;
    for (const project of content.projects) delete project.image;
    expect(portfolioSchema.parse(content)).toEqual(content);
  });

  test.each(['https://example.com/image.png', '/images/../private.png', '/images/photo.svg'])(
    'rejects unsupported image path %s',
    (src) => {
      const content = structuredClone(portfolio);
      content.profile.image = { src, alt: 'Example image' };
      expect(() => portfolioSchema.parse(content)).toThrow('Image must be a local file under /images/');
    },
  );

  test('rejects incomplete and oversized content', () => {
    expect(() => portfolioSchema.parse({ profile: {} })).toThrow();

    const oversized = structuredClone(portfolio);
    oversized.about = Array.from({ length: 7 }, () => 'Another paragraph');
    expect(() => portfolioSchema.parse(oversized)).toThrow();
  });

  test.each(['javascript:alert(1)', 'mailto:alex@example.com', 'ftp://example.com/file'])(
    'rejects unsafe or unsupported URL %s',
    (url) => {
      const content = structuredClone(portfolio);
      content.profile.links = [{ label: 'Unsafe', url }];
      expect(() => portfolioSchema.parse(content)).toThrow('URL must use http or https');
    },
  );
});
