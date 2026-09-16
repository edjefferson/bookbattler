// Minimal Open Library client. No API key needed; the Books API supports CORS for GET requests.

export function normalizeISBN(raw) {
  return String(raw).replace(/[^0-9Xx]/g, '').toUpperCase();
}

export async function lookupISBN(rawIsbn) {
  const isbn = normalizeISBN(rawIsbn);
  if (isbn.length < 9) {
    throw new Error('That doesn’t look like an ISBN');
  }

  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Open Library request failed');
  }
  const data = await res.json();
  const book = data[`ISBN:${isbn}`];
  if (!book) {
    throw new Error(`No book found for ISBN ${isbn}`);
  }

  return {
    isbn,
    title: book.title || 'Unknown Title',
    authors: (book.authors || []).map((a) => a.name),
    publishDate: book.publish_date || null,
    pageCount: book.number_of_pages || null,
    subjects: (book.subjects || []).map((s) => s.name),
    coverUrl: book.cover ? book.cover.large || book.cover.medium || book.cover.small : null,
  };
}
