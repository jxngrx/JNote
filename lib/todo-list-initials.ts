export function getTodoListInitials(title: string, maxLetters = 2): string {
  const words = title.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return '?';
  }

  if (words.length === 1) {
    return words[0].slice(0, maxLetters).toUpperCase();
  }

  return words
    .slice(0, maxLetters)
    .map((word) => word[0] ?? '')
    .join('')
    .toUpperCase();
}
