import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  usernameSchema,
  accentColorSchema,
  socialLinkSchema,
  displayNameSchema,
  headlineSchema,
  bioTextSchema,
  themePreferenceSchema,
  fontFamilySchema,
} from './profile.types';

// ---------------------------------------------------------------------------
// Task 2.2 — Property test: username validator round-trip
// **Validates: Requirements 2.2** (Design §Data Models username rule)
// ---------------------------------------------------------------------------
describe('usernameSchema (Task 2.2)', () => {
  const usernameRegex = /^[a-z0-9][a-z0-9-_]{2,29}$/;

  it('accepts any string matching the spec regex', () => {
    fc.assert(
      fc.property(fc.stringMatching(usernameRegex), (s) => {
        expect(usernameSchema.parse(s)).toBe(s);
      }),
    );
  });

  it('throws on strings that do not match the spec regex', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !usernameRegex.test(s)),
        (s) => {
          expect(() => usernameSchema.parse(s)).toThrow();
        },
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// Task 2.3 — Property test: accent_color hex validator
// **Validates: Requirements 2.3** (Design §Data Models accent_color rule)
// ---------------------------------------------------------------------------
describe('accentColorSchema (Task 2.3)', () => {
  const accentRegex = /^#[0-9a-fA-F]{6}$/;

  it('accepts any #RRGGBB hex string', () => {
    // fast-check 4.x removed `hexaString`; compose from a constrained unit.
    const hexChar = fc.constantFrom(...'0123456789abcdef');
    const hex6 = fc
      .array(hexChar, { minLength: 6, maxLength: 6 })
      .map((chars) => chars.join(''));
    fc.assert(
      fc.property(hex6.map((h) => `#${h}`), (s) => {
        expect(accentColorSchema.parse(s)).toBe(s);
      }),
    );
  });

  it('throws on strings that are not #RRGGBB hex', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !accentRegex.test(s)),
        (s) => {
          expect(() => accentColorSchema.parse(s)).toThrow();
        },
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// Task 2.4 — Property test: social_links URL sanitization
// **Validates: Requirements 2.4** (Design §Data Models social_links rule,
// §Security Considerations — Open redirect protection)
// ---------------------------------------------------------------------------
describe('socialLinkSchema (Task 2.4)', () => {
  const nonEmailPlatform = fc.constantFrom(
    'linkedin',
    'github',
    'portfolio',
    'twitter',
    'youtube',
    'other',
  );
  const anyPlatform = fc.constantFrom(
    'linkedin',
    'github',
    'portfolio',
    'twitter',
    'youtube',
    'email',
    'other',
  );

  // Build URLs from tightly-controlled parts so we avoid relying on fast-check's
  // web arbitraries (keeps the generator deterministic across fc versions).
  const hostPart = fc.stringMatching(/^[a-z][a-z0-9]{2,15}$/);
  const tld = fc.constantFrom('com', 'org', 'net', 'io');
  const validHttpsUrl = fc
    .tuple(hostPart, tld)
    .map(([host, t]) => `https://${host}.${t}`);
  const validHttpUrl = fc
    .tuple(hostPart, tld)
    .map(([host, t]) => `http://${host}.${t}`);
  const emailLocal = fc.stringMatching(/^[a-z][a-z0-9._-]{0,15}$/);
  const mailtoUrl = fc
    .tuple(emailLocal, hostPart, tld)
    .map(([local, host, t]) => `mailto:${local}@${host}.${t}`);

  it('accepts https URLs for non-email platforms', () => {
    fc.assert(
      fc.property(nonEmailPlatform, validHttpsUrl, (platform, url) => {
        expect(() =>
          socialLinkSchema.parse({ platform, url, label: '' }),
        ).not.toThrow();
      }),
    );
  });

  it('accepts mailto: URLs only when platform is email', () => {
    fc.assert(
      fc.property(mailtoUrl, (url) => {
        expect(() =>
          socialLinkSchema.parse({ platform: 'email', url, label: '' }),
        ).not.toThrow();
      }),
    );
  });

  it('rejects mailto: URLs when platform is not email', () => {
    fc.assert(
      fc.property(nonEmailPlatform, mailtoUrl, (platform, url) => {
        expect(() =>
          socialLinkSchema.parse({ platform, url, label: '' }),
        ).toThrow();
      }),
    );
  });

  it('rejects javascript: URLs for every platform', () => {
    fc.assert(
      fc.property(anyPlatform, fc.string(), (platform, tail) => {
        const url = `javascript:${tail}`;
        expect(() =>
          socialLinkSchema.parse({ platform, url, label: '' }),
        ).toThrow();
      }),
    );
  });

  it('rejects http:// URLs for non-email platforms', () => {
    fc.assert(
      fc.property(nonEmailPlatform, validHttpUrl, (platform, url) => {
        expect(() =>
          socialLinkSchema.parse({ platform, url, label: '' }),
        ).toThrow();
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Task 2.5 — Unit tests: string length bounds and enum rejections
// **Validates: Requirements 2.5** (Design §Data Models Validation rules)
// ---------------------------------------------------------------------------
describe('displayNameSchema length bounds (Task 2.5)', () => {
  it('rejects empty string (length 0)', () => {
    expect(() => displayNameSchema.parse('')).toThrow();
  });

  it('accepts length 1', () => {
    expect(displayNameSchema.parse('a')).toBe('a');
  });

  it('accepts length 60', () => {
    const s = 'a'.repeat(60);
    expect(displayNameSchema.parse(s)).toBe(s);
  });

  it('rejects length 61', () => {
    expect(() => displayNameSchema.parse('a'.repeat(61))).toThrow();
  });
});

describe('headlineSchema length bounds (Task 2.5)', () => {
  it('accepts empty string (length 0)', () => {
    expect(headlineSchema.parse('')).toBe('');
  });

  it('accepts length 120', () => {
    const s = 'a'.repeat(120);
    expect(headlineSchema.parse(s)).toBe(s);
  });

  it('rejects length 121', () => {
    expect(() => headlineSchema.parse('a'.repeat(121))).toThrow();
  });
});

describe('bioTextSchema length bounds (Task 2.5)', () => {
  it('accepts empty string (length 0)', () => {
    expect(bioTextSchema.parse('')).toBe('');
  });

  it('accepts length 2000', () => {
    const s = 'a'.repeat(2000);
    expect(bioTextSchema.parse(s)).toBe(s);
  });

  it('rejects length 2001', () => {
    expect(() => bioTextSchema.parse('a'.repeat(2001))).toThrow();
  });
});

describe('themePreferenceSchema enum (Task 2.5)', () => {
  it('accepts every declared preset', () => {
    for (const v of ['minimal', 'bold', 'dark', 'gradient'] as const) {
      expect(themePreferenceSchema.parse(v)).toBe(v);
    }
  });

  it('rejects unknown enum values', () => {
    expect(() => themePreferenceSchema.parse('neon')).toThrow();
    expect(() => themePreferenceSchema.parse('')).toThrow();
  });
});

describe('fontFamilySchema enum (Task 2.5)', () => {
  it('accepts every declared preset', () => {
    for (const v of ['sans', 'serif', 'mono'] as const) {
      expect(fontFamilySchema.parse(v)).toBe(v);
    }
  });

  it('rejects unknown enum values', () => {
    expect(() => fontFamilySchema.parse('cursive')).toThrow();
    expect(() => fontFamilySchema.parse('')).toThrow();
  });
});
