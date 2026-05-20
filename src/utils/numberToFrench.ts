const UNITS: Record<number, string> = {
  0: 'zéro',
  1: 'un',
  2: 'deux',
  3: 'trois',
  4: 'quatre',
  5: 'cinq',
  6: 'six',
  7: 'sept',
  8: 'huit',
  9: 'neuf',
  10: 'dix',
  11: 'onze',
  12: 'douze',
  13: 'treize',
  14: 'quatorze',
  15: 'quinze',
  16: 'seize',
};

const TENS: Record<number, string> = {
  10: 'dix',
  20: 'vingt',
  30: 'trente',
  40: 'quarante',
  50: 'cinquante',
  60: 'soixante',
};

export function numberToFrench(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 100) {
    throw new Error(`numberToFrench: expected 0–100, got ${n}`);
  }

  if (n === 100) return 'cent';

  if (n <= 16) return UNITS[n];

  if (n <= 19) {
    return `dix-${UNITS[n - 10]}`;
  }

  if (n < 70) {
    const ten = Math.floor(n / 10) * 10;
    const unit = n % 10;
    if (unit === 0) return TENS[ten];
    if (unit === 1) {
      if (ten === 60) return 'soixante et un';
      return `${TENS[ten]} et un`;
    }
    return `${TENS[ten]}-${UNITS[unit]}`;
  }

  if (n >= 70 && n <= 79) {
    if (n === 70) return 'soixante-dix';
    if (n === 71) return 'soixante et onze';
    return `soixante-${numberToFrench60Base(n - 60)}`;
  }

  // 80–89
  if (n >= 80 && n <= 89) {
    if (n === 80) return 'quatre-vingts';
    return `quatre-vingt-${UNITS[n - 80]}`;
  }

  // 90–99
  if (n === 90) return 'quatre-vingt-dix';
  return `quatre-vingt-${numberToFrench60Base(n - 80)}`;
}

function numberToFrench60Base(n: number): string {
  // n is 10..19
  if (n <= 16) return UNITS[n];
  if (n === 17) return 'dix-sept';
  if (n === 18) return 'dix-huit';
  if (n === 19) return 'dix-neuf';
  return numberToFrench(n);
}
