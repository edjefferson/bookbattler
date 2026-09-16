import { hashString, mulberry32, clamp } from './hash.js';
import { detectType } from './types.js';

// Turns raw Open Library book data into a battle-ready trading card.
// Stats are deterministic (seeded from the ISBN + title) so scanning the
// same book always yields the same card.
export function buildCard(book) {
  const seed = hashString(`${book.isbn}|${book.title}`);
  const rand = mulberry32(seed);

  const pages = clamp(book.pageCount || 180, 40, 600);
  const subjectCount = book.subjects.length;

  const hp = Math.round(60 + (pages / 600) * 200 + rand() * 20);
  const atk = Math.round(15 + rand() * 25 + Math.min(subjectCount, 10) * 0.6);
  const def = Math.round(5 + rand() * 20 + (pages > 350 ? 8 : 0));
  const spd = Math.round(5 + rand() * 20 + (pages < 200 ? 8 : 0));

  const type = detectType(book.subjects, seed);

  return {
    ...book,
    hp,
    maxHp: hp,
    atk,
    def,
    spd,
    type,
  };
}
