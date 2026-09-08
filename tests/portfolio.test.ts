import { describe, expect, test } from 'bun:test';

import { portfolio, portfolioSchema } from '@/lib/portfolio';

describe('portfolio content contract', () => {
  test('accepts the bundled example portfolio', () => {
    expect(portfolioSchema.parse(portfolio)).toEqual(portfolio);
  });

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
