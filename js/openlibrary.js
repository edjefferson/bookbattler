// Minimal Open Library client. No API key needed; the Books API supports CORS for GET requests.
//
// Open Library's documented rate limit is 1 req/sec for unidentified requests (the only tier
// available to us, since browser fetch() cannot set a custom User-Agent to qualify for the
// higher identified tier). throttledFetch() below queues every request through this module so
// that limit holds structurally, regardless of how quickly the user clicks around the UI.
const MIN_REQUEST_INTERVAL_MS = 1100;
let lastRequestAt = 0;
let requestQueue = Promise.resolve();

function throttledFetch(url) {
  const gated = requestQueue.then(async () => {
    const wait = MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastRequestAt = Date.now();
  });
  requestQueue = gated;
  return gated.then(() => fetch(url));
}

export function normalizeISBN(raw) {
  return String(raw).replace(/[^0-9Xx]/g, '').toUpperCase();
}

export async function lookupISBN(rawIsbn) {
  const isbn = normalizeISBN(rawIsbn);
  if (isbn.length < 9) {
    throw new Error('That doesn’t look like an ISBN');
  }

  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`;
  const res = await throttledFetch(url);
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

export async function searchByTitle(rawQuery, limit = 5) {
  const q = rawQuery.trim();
  if (!q) return [];

  const fields = 'key,title,author_name,first_publish_year,cover_i,isbn,subject,number_of_pages_median';
  const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(q)}&limit=${limit}&fields=${fields}`;
  const res = await throttledFetch(url);
  if (!res.ok) {
    throw new Error('Open Library search failed');
  }
  const data = await res.json();

  return (data.docs || []).map((doc) => ({
    workKey: doc.key,
    isbn: doc.isbn && doc.isbn.length ? normalizeISBN(doc.isbn[0]) : null,
    title: doc.title || 'Unknown Title',
    authors: doc.author_name || [],
    publishDate: doc.first_publish_year ? String(doc.first_publish_year) : null,
    pageCount: doc.number_of_pages_median || null,
    subjects: (doc.subject || []).slice(0, 20),
    coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null,
  }));
}
