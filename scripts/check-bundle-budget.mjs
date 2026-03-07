import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const DIST_ASSETS_DIR = path.resolve(process.cwd(), 'dist/assets');
const MAX_CHUNK_KB = Number(process.env.MAX_CHUNK_KB || 600);
const MAX_CHUNK_GZIP_KB = Number(process.env.MAX_CHUNK_GZIP_KB || 90);
const TOP_N = 8;

if (!fs.existsSync(DIST_ASSETS_DIR)) {
  console.error(`[budget] Missing dist assets directory: ${DIST_ASSETS_DIR}`);
  process.exit(1);
}

const assetFiles = fs
  .readdirSync(DIST_ASSETS_DIR)
  .filter((name) => name.endsWith('.js'))
  .map((name) => path.join(DIST_ASSETS_DIR, name));

if (assetFiles.length === 0) {
  console.error('[budget] No JS chunks found in dist/assets');
  process.exit(1);
}

const chunks = assetFiles.map((filePath) => {
  const content = fs.readFileSync(filePath);
  const rawBytes = content.byteLength;
  const gzipBytes = zlib.gzipSync(content).byteLength;
  return {
    fileName: path.basename(filePath),
    rawKb: rawBytes / 1024,
    gzipKb: gzipBytes / 1024,
  };
});

chunks.sort((a, b) => b.rawKb - a.rawKb);
const top = chunks.slice(0, TOP_N);
const maxChunk = chunks[0];

console.log(`[budget] Max JS chunk budget (raw): ${MAX_CHUNK_KB} KB`);
console.log(`[budget] Max JS chunk budget (gzip): ${MAX_CHUNK_GZIP_KB} KB`);
console.log('[budget] Top JS chunks by raw size:');
top.forEach((chunk, index) => {
  console.log(
    `${String(index + 1).padStart(2, '0')}. ${chunk.fileName} - ${chunk.rawKb.toFixed(2)} KB (gzip ${chunk.gzipKb.toFixed(2)} KB)`
  );
});

const rawExceeded = maxChunk.rawKb > MAX_CHUNK_KB;
const gzipExceeded = maxChunk.gzipKb > MAX_CHUNK_GZIP_KB;

if (rawExceeded || gzipExceeded) {
  const reasons = [
    rawExceeded ? `raw ${maxChunk.rawKb.toFixed(2)} KB > ${MAX_CHUNK_KB} KB` : null,
    gzipExceeded ? `gzip ${maxChunk.gzipKb.toFixed(2)} KB > ${MAX_CHUNK_GZIP_KB} KB` : null,
  ]
    .filter(Boolean)
    .join('; ');

  console.error(
    `[budget] FAIL: largest chunk ${maxChunk.fileName} exceeds budget (${reasons})`
  );
  process.exit(1);
}

console.log(
  `[budget] PASS: largest chunk ${maxChunk.fileName} is ${maxChunk.rawKb.toFixed(2)} KB (gzip ${maxChunk.gzipKb.toFixed(2)} KB)`
);
