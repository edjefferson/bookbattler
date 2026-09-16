# ISBN Battler

Scan two books' barcodes with your phone camera, turn them into trading cards
using data from [Open Library](https://openlibrary.org), and watch them fight.

Plain HTML/CSS/JS — no build step, no backend, no API keys.

## How it works

- **Scanning**: [`@zxing/library`](https://github.com/zxing-js/library) (loaded from a CDN) reads
  the camera feed in-browser and decodes the EAN-13 barcode printed on the book (all ISBN
  barcodes are EAN-13). Nothing is uploaded for this step — it's all local image processing.
- **Book data**: the decoded ISBN is sent to the free Open Library Books API
  (`openlibrary.org/api/books`) to fetch title, author(s), cover, page count and subjects.
- **Cards**: stats (HP/ATK/DEF/SPD) and a "type" (Fiction/Mystery/Science/History/Romance/Fantasy)
  are derived deterministically from the book's ISBN, title and subjects — scanning the same book
  always produces the same card. Types have rock-paper-scissors-style advantages against each other.
- **Battle**: a turn-based fight is simulated (speed decides who goes first, damage = attack vs.
  defense with a type multiplier and small variance), then played back as a log with animated HP bars.

## Running locally

No install needed — just serve the folder statically, e.g.:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Testing on your phone

Camera access (`getUserMedia`) requires a **secure context** — either `localhost` or HTTPS.
A plain `http://<your-computer's-LAN-IP>:8000` URL will **not** get camera access on a phone.
Easiest options:

- **Deploy it** to GitHub Pages, Netlify, or Vercel (all free, all HTTPS) and open that URL on your phone.
- **Tunnel it**, e.g. `npx localtunnel --port 8000` or `ngrok http 8000`, and open the HTTPS URL it gives you.

If the camera doesn't work or isn't available, there's a manual ISBN entry field as a fallback.
