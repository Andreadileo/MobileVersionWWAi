import { Platform } from 'react-native';

/**
 * Estrae N frame da un video e li restituisce come array di stringhe base64.
 * Su web: usa Canvas API del browser.
 * Su native (iOS/Android): usa expo-video-thumbnails.
 *
 * @param {string} videoUri  - URI locale del video
 * @param {number} duration  - Durata del video in millisecondi
 * @param {number} frameCount - Numero di frame da estrarre (default 4)
 * @returns {Promise<string[]>} Array di stringhe base64 (JPEG)
 */
export async function extractFrames(videoUri, duration, frameCount = 4) {
  if (Platform.OS === 'web') {
    return extractFramesWeb(videoUri, duration, frameCount);
  }
  return extractFramesNative(videoUri, duration, frameCount);
}

// ─── Web (Canvas API) ────────────────────────────────────────────────────────

async function extractFramesWeb(videoUri, duration, frameCount) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = videoUri;
    video.crossOrigin = 'anonymous';
    video.muted = true;

    const frames = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.addEventListener('loadedmetadata', async () => {
      const videoDuration = video.duration * 1000; // secondi → ms
      canvas.width = 640;
      canvas.height = 360;

      const ratios = [];
      for (let i = 1; i <= frameCount; i++) {
        ratios.push(i / (frameCount + 1));
      }

      for (const ratio of ratios) {
        const timeSec = (videoDuration * ratio) / 1000;
        await seekAndCapture(video, ctx, canvas, timeSec, frames);
      }

      resolve(frames);
    });

    video.addEventListener('error', () => resolve([]));
    video.load();
  });
}

function seekAndCapture(video, ctx, canvas, timeSec, frames) {
  return new Promise((resolve) => {
    video.currentTime = timeSec;
    video.addEventListener('seeked', function handler() {
      video.removeEventListener('seeked', handler);
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        const base64 = dataUrl.split(',')[1];
        frames.push(base64);
      } catch (e) {
        console.warn('[extractFrames web] errore frame:', e.message);
      }
      resolve();
    });
  });
}

// ─── Native (expo-video-thumbnails) ─────────────────────────────────────────

async function extractFramesNative(videoUri, duration, frameCount) {
  const VideoThumbnails = await import('expo-video-thumbnails');
  const FileSystem = await import('expo-file-system');

  const frames = [];
  const ratios = [];
  for (let i = 1; i <= frameCount; i++) {
    ratios.push(i / (frameCount + 1));
  }

  for (const ratio of ratios) {
    const timeMs = Math.floor(duration * ratio);
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: timeMs,
        quality: 0.7,
      });

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      frames.push(base64);
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (err) {
      console.warn(`[extractFrames native] errore al frame ${ratio}:`, err.message);
    }
  }

  return frames;
}
