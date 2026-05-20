import { describe, it, expect } from 'vitest';
import { numberToFrench } from '../utils/numberToFrench';

describe('numberToFrench', () => {
  const cases: [number, string][] = [
    [0, 'zéro'],
    [1, 'un'],
    [2, 'deux'],
    [10, 'dix'],
    [11, 'onze'],
    [16, 'seize'],
    [17, 'dix-sept'],
    [20, 'vingt'],
    [21, 'vingt et un'],
    [22, 'vingt-deux'],
    [30, 'trente'],
    [31, 'trente et un'],
    [40, 'quarante'],
    [50, 'cinquante'],
    [60, 'soixante'],
    [61, 'soixante et un'],
    [69, 'soixante-neuf'],
    [70, 'soixante-dix'],
    [71, 'soixante et onze'],
    [72, 'soixante-douze'],
    [79, 'soixante-dix-neuf'],
    [80, 'quatre-vingts'],
    [81, 'quatre-vingt-un'],
    [82, 'quatre-vingt-deux'],
    [89, 'quatre-vingt-neuf'],
    [90, 'quatre-vingt-dix'],
    [91, 'quatre-vingt-onze'],
    [92, 'quatre-vingt-douze'],
    [99, 'quatre-vingt-dix-neuf'],
    [100, 'cent'],
    [13, 'treize'],
    [15, 'quinze'],
    [18, 'dix-huit'],
    [19, 'dix-neuf'],
    [25, 'vingt-cinq'],
    [33, 'trente-trois'],
    [47, 'quarante-sept'],
    [54, 'cinquante-quatre'],
    [68, 'soixante-huit'],
    [73, 'soixante-treize'],
    [78, 'soixante-dix-huit'],
    [84, 'quatre-vingt-quatre'],
    [97, 'quatre-vingt-dix-sept'],
  ];

  for (const [n, expected] of cases) {
    it(`should convert ${n} to "${expected}"`, () => {
      expect(numberToFrench(n)).toBe(expected);
    });
  }

  it('should throw for negative numbers', () => {
    expect(() => numberToFrench(-1)).toThrow();
  });

  it('should throw for numbers > 100', () => {
    expect(() => numberToFrench(101)).toThrow();
  });

  it('should throw for non-integers', () => {
    expect(() => numberToFrench(1.5)).toThrow();
  });
});
