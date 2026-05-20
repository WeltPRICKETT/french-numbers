import { describe, it, expect } from 'vitest';
import { normalizeFrenchNumberAnswer, checkFrenchAnswer, checkNumberAnswer } from '../utils/answerNormalize';

describe('normalizeFrenchNumberAnswer', () => {
  it('should accept "zero" as "zéro"', () => {
    expect(normalizeFrenchNumberAnswer('zero')).toBe('zéro');
  });

  it('should normalize case', () => {
    expect(normalizeFrenchNumberAnswer('Vingt et un')).toBe('vingt et un');
  });

  it('should treat hyphen as space', () => {
    expect(normalizeFrenchNumberAnswer('vingt-et-un')).toBe('vingt et un');
  });

  it('should collapse multiple spaces', () => {
    expect(normalizeFrenchNumberAnswer('vingt  et   un')).toBe('vingt et un');
  });

  it('should trim whitespace', () => {
    expect(normalizeFrenchNumberAnswer('  vingt et un  ')).toBe('vingt et un');
  });

  it('should handle quatre-vingt-un', () => {
    expect(normalizeFrenchNumberAnswer('quatre-vingt-un')).toBe('quatre vingt un');
  });

  it('should handle quatre vingt un (without hyphens)', () => {
    expect(normalizeFrenchNumberAnswer('quatre vingt un')).toBe('quatre vingt un');
  });

  it('should remove punctuation', () => {
    expect(normalizeFrenchNumberAnswer('vingt et un!')).toBe('vingt et un');
  });
});

describe('checkFrenchAnswer', () => {
  it('should accept exact match', () => {
    expect(checkFrenchAnswer('quatre-vingts', 80, (n) => {
      if (n === 80) return 'quatre-vingts';
      return '';
    })).toBe(true);
  });

  it('should accept case insensitive match', () => {
    expect(checkFrenchAnswer('SOIXANTE-DIX', 70, (n) => {
      if (n === 70) return 'soixante-dix';
      return '';
    })).toBe(true);
  });

  it('should accept hyphen variations', () => {
    expect(checkFrenchAnswer('vingt et un', 21, (n) => {
      if (n === 21) return 'vingt et un';
      return '';
    })).toBe(true);
  });

  it('should reject clearly wrong answers', () => {
    expect(checkFrenchAnswer('cinquante', 70, (n) => {
      if (n === 70) return 'soixante-dix';
      if (n === 50) return 'cinquante';
      return '';
    })).toBe(false);
  });
});

describe('checkNumberAnswer', () => {
  it('should accept correct number', () => {
    expect(checkNumberAnswer('91', 91)).toBe(true);
  });

  it('should accept number with spaces', () => {
    expect(checkNumberAnswer(' 42 ', 42)).toBe(true);
  });

  it('should reject wrong number', () => {
    expect(checkNumberAnswer('99', 91)).toBe(false);
  });

  it('should reject non-numeric input', () => {
    expect(checkNumberAnswer('quatre-vingts', 80)).toBe(false);
  });
});
