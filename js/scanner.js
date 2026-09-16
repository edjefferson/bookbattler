// Camera + barcode scanning, built directly on getUserMedia rather than ZXing's
// own decodeFromConstraints()/attachStreamToVideo() helpers: those wait for the
// video's 'playing' event, but that event can fire (and be missed) before the
// listener is attached on fast cameras, hanging forever. Managing the stream
// ourselves avoids that race entirely.

let stream = null;
let intervalId = null;

export function isScannerAvailable() {
  return typeof window.ZXing !== 'undefined';
}

export async function startScanner(videoEl, onDetected, onError, onStart) {
  if (!isScannerAvailable()) {
    onError(new Error('Barcode scanner library not loaded'));
    return;
  }

  stopScanner();

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
    });
  } catch (err) {
    onError(err);
    return;
  }

  videoEl.srcObject = stream;
  try {
    await videoEl.play();
  } catch {
    // Some browsers reject play() as interrupted even though playback proceeds; ignore.
  }

  if (onStart) onStart();

  const hints = new Map();
  hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [ZXing.BarcodeFormat.EAN_13]);
  const reader = new ZXing.BrowserMultiFormatReader(hints);

  intervalId = setInterval(() => {
    if (videoEl.readyState < videoEl.HAVE_CURRENT_DATA) return;
    try {
      const result = reader.decode(videoEl);
      if (result) onDetected(result.getText());
    } catch {
      // No barcode in this frame — expected on most frames, ignore and keep polling.
    }
  }, 250);
}

export function stopScanner() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
}
