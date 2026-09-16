// Thin wrapper around the ZXing UMD build (loaded globally via <script> in index.html)
// for scanning EAN-13 barcodes (all ISBN barcodes are printed as EAN-13 "Bookland" codes).

let controls = null;

export function isScannerAvailable() {
  return typeof window.ZXing !== 'undefined';
}

export async function startScanner(videoEl, onDetected, onError, onStart) {
  if (!isScannerAvailable()) {
    onError(new Error('Barcode scanner library not loaded'));
    return;
  }

  stopScanner();

  const hints = new Map();
  hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [ZXing.BarcodeFormat.EAN_13]);
  const reader = new ZXing.BrowserMultiFormatReader(hints);

  try {
    controls = await reader.decodeFromConstraints(
      { video: { facingMode: { ideal: 'environment' } } },
      videoEl,
      (result) => {
        if (result) onDetected(result.getText());
      },
    );
    if (onStart) onStart();
  } catch (err) {
    onError(err);
  }
}

export function stopScanner() {
  if (controls && typeof controls.stop === 'function') {
    controls.stop();
  }
  controls = null;
}
