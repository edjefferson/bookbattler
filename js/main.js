import { lookupISBN } from './openlibrary.js';
import { buildCard } from './card.js';
import { simulateBattle } from './battle.js';
import { startScanner, stopScanner, isScannerAvailable } from './scanner.js';

const state = { players: [null, null], currentPlayer: 0, battle: null, logIndex: 0 };

const el = (id) => document.getElementById(id);

const SCREENS = ['screen-scan', 'screen-reveal', 'screen-ready', 'screen-battle', 'screen-result'];
function showScreen(id) {
  for (const s of SCREENS) el(s).classList.toggle('active', s === id);
}

function renderCard(card) {
  const wrap = document.createElement('div');
  wrap.className = 'card';
  wrap.style.setProperty('--card-color', card.type.color);

  const badge = document.createElement('div');
  badge.className = 'card-type-badge';
  badge.textContent = card.type.label;
  wrap.appendChild(badge);

  const img = document.createElement('img');
  img.className = 'card-cover';
  img.alt = card.title;
  img.src = card.coverUrl || `https://covers.openlibrary.org/b/isbn/${card.isbn}-L.jpg?default=false`;
  img.onerror = () => {
    img.style.display = 'none';
  };
  wrap.appendChild(img);

  const title = document.createElement('p');
  title.className = 'card-title';
  title.textContent = card.title;
  wrap.appendChild(title);

  if (card.authors && card.authors.length) {
    const author = document.createElement('p');
    author.className = 'card-author';
    author.textContent = card.authors.join(', ');
    wrap.appendChild(author);
  }

  const stats = document.createElement('div');
  stats.className = 'card-stats';
  stats.innerHTML = `
    <div class="stat">HP <b>${card.hp}</b></div>
    <div class="stat">ATK <b>${card.atk}</b></div>
    <div class="stat">DEF <b>${card.def}</b></div>
    <div class="stat">SPD <b>${card.spd}</b></div>
  `;
  wrap.appendChild(stats);

  return wrap;
}

function mountCard(slotId, card) {
  const slot = el(slotId);
  slot.innerHTML = '';
  slot.appendChild(renderCard(card));
}

// --- Scanning ---

function startCameraFlow() {
  el('scan-heading').textContent = `Player ${state.currentPlayer + 1}: scan your book's barcode`;
  startScanner(
    el('video'),
    (text) => handleISBN(text),
    () => {
      el('scan-status').textContent = 'Camera unavailable — enter the ISBN manually below.';
    },
  );
}

async function handleISBN(rawIsbn) {
  stopScanner();
  el('scan-status').textContent = 'Looking up book…';
  try {
    const book = await lookupISBN(rawIsbn);
    const card = buildCard(book);
    state.players[state.currentPlayer] = card;
    el('reveal-heading').textContent = `Player ${state.currentPlayer + 1}'s card`;
    mountCard('reveal-card-slot', card);
    showScreen('screen-reveal');
  } catch (err) {
    el('scan-status').textContent = `Couldn't find that book (${err.message}). Try again or enter manually.`;
    startCameraFlow();
  }
}

el('camera-start-btn').addEventListener('click', () => {
  el('scan-status').textContent = 'Starting camera…';
  startCameraFlow();
});

el('manual-submit').addEventListener('click', () => {
  const val = el('manual-isbn').value.trim();
  if (val) handleISBN(val);
});
el('manual-isbn').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') el('manual-submit').click();
});

el('reveal-continue-btn').addEventListener('click', () => {
  if (state.currentPlayer === 0) {
    state.currentPlayer = 1;
    el('manual-isbn').value = '';
    el('scan-status').textContent = "Point your camera at Player 2's book.";
    showScreen('screen-scan');
    startCameraFlow();
  } else {
    mountCard('ready-card-1', state.players[0]);
    mountCard('ready-card-2', state.players[1]);
    showScreen('screen-ready');
  }
});

el('restart-btn').addEventListener('click', resetGame);
el('play-again-btn').addEventListener('click', resetGame);

function resetGame() {
  state.players = [null, null];
  state.currentPlayer = 0;
  state.battle = null;
  state.logIndex = 0;
  el('manual-isbn').value = '';
  el('scan-status').textContent = 'Point your camera at the ISBN barcode on the back of the book.';
  showScreen('screen-scan');
  startCameraFlow();
}

// --- Battle ---

el('battle-start-btn').addEventListener('click', () => {
  state.battle = simulateBattle(state.players[0], state.players[1]);
  state.logIndex = 0;
  mountCard('battle-card-1', state.players[0]);
  mountCard('battle-card-2', state.players[1]);
  el('battle-log').innerHTML = '';
  el('log-next-btn').textContent = 'Next';
  showScreen('screen-battle');
  advanceLog();
});

function updateHpBars(entry) {
  const fill1 = el('hp-fill-1');
  const fill2 = el('hp-fill-2');
  const pct1 = Math.max(0, Math.round((entry.hp1 / entry.max1) * 100));
  const pct2 = Math.max(0, Math.round((entry.hp2 / entry.max2) * 100));
  fill1.style.width = `${pct1}%`;
  fill2.style.width = `${pct2}%`;
  fill1.classList.toggle('low', pct1 <= 25);
  fill2.classList.toggle('low', pct2 <= 25);
}

function advanceLog() {
  const { log } = state.battle;
  const entry = log[state.logIndex];
  const p = document.createElement('p');
  p.textContent = entry.text;
  el('battle-log').appendChild(p);
  el('battle-log').scrollTop = el('battle-log').scrollHeight;
  updateHpBars(entry);
  state.logIndex++;
  if (state.logIndex >= log.length) {
    el('log-next-btn').textContent = 'See result';
  }
}

el('log-next-btn').addEventListener('click', () => {
  if (state.logIndex >= state.battle.log.length) {
    showResult();
  } else {
    advanceLog();
  }
});

function showResult() {
  const winner = state.battle.winner;
  el('result-heading').textContent = `${winner.title} wins!`;
  mountCard('result-card-slot', winner);
  showScreen('screen-result');
}

// --- Init ---

if (!isScannerAvailable()) {
  el('scan-status').textContent = 'Camera scanning library failed to load — you can still enter ISBNs manually.';
}
