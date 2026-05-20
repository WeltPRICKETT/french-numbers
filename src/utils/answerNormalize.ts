const ACCENTS_MAP: Record<string, string> = {
  zero: 'zéro',
};

export function normalizeFrenchNumberAnswer(input: string): string {
  let s = input
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/-/g, ' ');

  // Normalize multiple spaces between words
  s = s.replace(/\s+/g, ' ').trim();

  // Accent insensitive
  for (const [key, value] of Object.entries(ACCENTS_MAP)) {
    if (s === key) return value;
  }

  return s;
}

export function checkFrenchAnswer(userInput: string, correctNumber: number, numberToFrench: (n: number) => string): boolean {
  const normalized = normalizeFrenchNumberAnswer(userInput);
  const correct = normalizeFrenchNumberAnswer(numberToFrench(correctNumber));
  return normalized === correct;
}

export function checkNumberAnswer(userInput: string, correctNumber: number): boolean {
  const cleaned = userInput.trim();
  const num = parseInt(cleaned, 10);
  if (isNaN(num)) return false;
  return num === correctNumber;
}
