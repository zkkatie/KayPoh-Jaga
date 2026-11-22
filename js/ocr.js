// Reads the words in a screenshot or photo, on the user's own device, using Tesseract.js.
//
// Privacy: the picture never leaves the phone. The first time someone checks a picture,
// the browser downloads the Tesseract reading engine and its English word data (about
// 7 MB) from the jsDelivr CDN; after that the browser keeps a copy. Only those program
// files are downloaded. Nothing is uploaded.

const TESSERACT_URL = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
const MAX_SIDE = 2000; // big phone photos are shrunk first so reading is faster

let scriptPromise = null;
let workerPromise = null;
let onProgress = () => {};

function loadTesseract() {
  if (window.Tesseract) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = TESSERACT_URL;
      s.crossOrigin = "anonymous";
      s.onload = () => resolve();
      s.onerror = () => {
        scriptPromise = null; // allow a retry if the connection was down
        reject(new Error("load-failed"));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

function getWorker() {
  if (!workerPromise) {
    workerPromise = window.Tesseract.createWorker("eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text") onProgress("reading", m.progress);
        else if (/loading|initializ/i.test(m.status)) onProgress("preparing", m.progress || 0);
      },
    }).catch((e) => {
      workerPromise = null;
      throw e;
    });
  }
  return workerPromise;
}

// Shrinks very large images and returns something Tesseract can read.
async function prepare(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1) {
    bitmap.close?.();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return canvas;
}

// Joins the lines Tesseract finds into readable text, and repairs links that
// the reader splits with stray spaces (e.g. "https: //site .com/app.apk").
export function tidy(text) {
  return text
    .replace(/\r/g, "")
    .replace(/(https?)\s*:\s*\/\s*\//gi, "$1://")
    .replace(/(\w)\s+\.\s*(com|sg|net|org|apk|io|co|ly|me|gov)\b/gi, "$1.$2")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Reads the text in an image file.
 * @param {File|Blob} file   the screenshot or photo
 * @param {(stage: "preparing"|"reading", progress: number) => void} progress
 * @returns {Promise<{text: string, confidence: number}>}
 */
export async function readImage(file, progress = () => {}) {
  onProgress = progress;
  progress("preparing", 0);
  await loadTesseract();
  const worker = await getWorker();
  const image = await prepare(file);
  const { data } = await worker.recognize(image);
  progress("reading", 1);
  return { text: tidy(data.text || ""), confidence: data.confidence || 0 };
}
