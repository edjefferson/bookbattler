// Book "elements" derived from Open Library subject tags, plus a rock-paper-scissors-style
// advantage cycle: each type is strong against the next one in TYPE_ORDER and weak against the previous.

export const TYPES = [
  { key: 'fiction', label: 'Fiction', color: 'var(--type-fiction)', match: ['fiction', 'novel', 'short stories'] },
  { key: 'mystery', label: 'Mystery', color: 'var(--type-mystery)', match: ['mystery', 'detective', 'thriller', 'crime', 'spy'] },
  { key: 'science', label: 'Science', color: 'var(--type-science)', match: ['science', 'physics', 'technology', 'computer', 'space', 'mathematics'] },
  { key: 'history', label: 'History', color: 'var(--type-history)', match: ['history', 'biography', 'war', 'politic', 'memoir'] },
  { key: 'romance', label: 'Romance', color: 'var(--type-romance)', match: ['romance', 'love stor'] },
  { key: 'fantasy', label: 'Fantasy', color: 'var(--type-fantasy)', match: ['fantasy', 'magic', 'dragon', 'witch', 'wizard', 'myth'] },
];

export const TYPE_ORDER = TYPES.map((t) => t.key);

export function detectType(subjects, seed) {
  const text = (subjects || []).join(' ').toLowerCase();
  for (const t of TYPES) {
    if (t.match.some((m) => text.includes(m))) return t;
  }
  return TYPES[seed % TYPES.length];
}

// Attacker's key beats the next type in the cycle, loses to the previous one.
export function typeMultiplier(attackerKey, defenderKey) {
  const order = TYPE_ORDER;
  const ai = order.indexOf(attackerKey);
  const di = order.indexOf(defenderKey);
  if (ai === -1 || di === -1 || ai === di) return 1;
  if (di === (ai + 1) % order.length) return 1.3;
  if (di === (ai - 1 + order.length) % order.length) return 0.75;
  return 1;
}
