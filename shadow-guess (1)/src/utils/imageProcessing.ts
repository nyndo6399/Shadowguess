/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Preset palette of shadow colors including classic pure black and rich dark jewel shades
export const SHADOW_COLOR_PRESETS = [
  { name: 'Đen thuần', hex: '#000000' },
  { name: 'Xanh Navy', hex: '#092635' },
  { name: 'Chàm Indigo', hex: '#1B1A55' },
  { name: 'Tím mận', hex: '#2C0B3B' },
  { name: 'Nâu socola', hex: '#3C1814' },
  { name: 'Xanh lục sẫm', hex: '#0D2F28' },
  { name: 'Đỏ thẫm', hex: '#450a0a' },
  { name: 'Mực đêm', hex: '#181824' },
  { name: 'Xanh đại dương', hex: '#06283D' },
  { name: 'Xám than chì', hex: '#1F2937' },
];

export const SHADOW_COLORS = SHADOW_COLOR_PRESETS.map((p) => p.hex);

export function getRandomShadowColor(): string {
  return SHADOW_COLORS[Math.floor(Math.random() * SHADOW_COLORS.length)];
}

// Optimize and resize image dataUrl if dimensions exceed maxDim (default 800px)
// Keeps transparency for PNGs and drops file size from 10MB down to ~60KB-120KB!
export function optimizeImage(dataUrl: string, maxDim: number = 800): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;

      // If already small enough, keep as is
      if (w <= maxDim && h <= maxDim) {
        resolve(dataUrl);
        return;
      }

      let targetW = w;
      let targetH = h;
      if (w > h) {
        if (w > maxDim) {
          targetH = Math.round((h * maxDim) / w);
          targetW = maxDim;
        }
      } else {
        if (h > maxDim) {
          targetW = Math.round((w * maxDim) / h);
          targetH = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetW, targetH);

      try {
        // Output optimized PNG to preserve transparent backgrounds
        const optimized = canvas.toDataURL('image/png');
        resolve(optimized);
      } catch {
        resolve(dataUrl);
      }
    };

    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// Convert File to optimized base64 Data URL
export function fileToDataUrl(file: File, maxDim: number = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const raw = reader.result as string;
      try {
        const optimized = await optimizeImage(raw, maxDim);
        resolve(optimized);
      } catch {
        resolve(raw);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// Check if a string is a valid image URL
export function isValidImageUrl(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (trimmed.startsWith('data:image/')) return true;
  try {
    const url = new URL(trimmed);
    return (
      url.protocol === 'http:' ||
      url.protocol === 'https:' ||
      trimmed.startsWith('/') ||
      trimmed.startsWith('./')
    );
  } catch {
    return false;
  }
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 0, g: 0, b: 0 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Smart client-side background remover using Boundary Flood-Fill (BFS)
// ONLY removes background pixels connected to the image boundaries.
// NEVER removes white collar, white cuffs, white socks, or white eyes INSIDE the character!
// Fetch an image from an arbitrary URL, handling CORS via proxy fallback, and return as base64 Data URL
export async function fetchImageAsDataUrl(url: string): Promise<string> {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('data:image/')) return trimmed;

  // 1. Try direct fetch first
  try {
    const res = await fetch(trimmed, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string) || trimmed);
        reader.readAsDataURL(blob);
      });
    }
  } catch {
    // CORS or network restriction on direct fetch
  }

  // 2. Try HTMLImageElement with crossOrigin anonymous directly
  try {
    const directDataUrl = await new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
            return;
          }
          reject(new Error('no ctx'));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error('img error'));
      img.src = trimmed;
    });
    if (directDataUrl) return directDataUrl;
  } catch {
    // Canvas tainted or crossOrigin blocked
  }

  // 3. Robust CORS Image Proxy Fallback (weserv.nl & allorigins)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const cleanHttp = trimmed.replace(/^https?:\/\//, '');
    try {
      const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(cleanHttp)}&output=png`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const blob = await res.blob();
        return await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string) || trimmed);
          reader.readAsDataURL(blob);
        });
      }
    } catch {
      // proxy failed
    }

    try {
      const allOriginsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(trimmed)}`;
      const res = await fetch(allOriginsUrl);
      if (res.ok) {
        const blob = await res.blob();
        return await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string) || trimmed);
          reader.readAsDataURL(blob);
        });
      }
    } catch {
      // ignore
    }
  }

  return trimmed;
}

// Smart client-side background remover using Boundary Flood-Fill (BFS)
// ONLY removes background pixels connected to the image boundaries.
// NEVER removes white collar, white cuffs, white socks, or white eyes INSIDE the character!
export async function removeLightBackground(
  imageUrl: string,
  tolerance: number = 40
): Promise<string> {
  const dataUrl = await fetchImageAsDataUrl(imageUrl);
  const src = dataUrl || imageUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve(src);
        return;
      }

      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0);

      try {
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Sample along all 4 outer borders (top, bottom, left, right)
        let edgeR = 0, edgeG = 0, edgeB = 0;
        let edgeSamples = 0;
        const step = Math.max(1, Math.floor(Math.min(w, h) / 30));

        for (let x = 0; x < w; x += step) {
          const tIdx = x * 4;
          const bIdx = ((h - 1) * w + x) * 4;
          if (data[tIdx + 3] > 30) {
            edgeR += data[tIdx]; edgeG += data[tIdx + 1]; edgeB += data[tIdx + 2];
            edgeSamples++;
          }
          if (data[bIdx + 3] > 30) {
            edgeR += data[bIdx]; edgeG += data[bIdx + 1]; edgeB += data[bIdx + 2];
            edgeSamples++;
          }
        }
        for (let y = 0; y < h; y += step) {
          const lIdx = (y * w) * 4;
          const rIdx = (y * w + (w - 1)) * 4;
          if (data[lIdx + 3] > 30) {
            edgeR += data[lIdx]; edgeG += data[lIdx + 1]; edgeB += data[lIdx + 2];
            edgeSamples++;
          }
          if (data[rIdx + 3] > 30) {
            edgeR += data[rIdx]; edgeG += data[rIdx + 1]; edgeB += data[rIdx + 2];
            edgeSamples++;
          }
        }

        const avgR = edgeSamples > 0 ? Math.round(edgeR / edgeSamples) : 255;
        const avgG = edgeSamples > 0 ? Math.round(edgeG / edgeSamples) : 255;
        const avgB = edgeSamples > 0 ? Math.round(edgeB / edgeSamples) : 255;

        // Determine if pixel matches background
        const isBgPixel = (idx: number) => {
          const p = idx * 4;
          const a = data[p + 3];
          if (a < 35) return true; // already transparent
          const r = data[p], g = data[p + 1], b = data[p + 2];
          // Pure or near-white check (covers standard white square backgrounds: > 218)
          if (r > 218 && g > 218 && b > 218) return true;
          // Distance to border edge color
          const dist = Math.sqrt(
            Math.pow(r - avgR, 2) + Math.pow(g - avgG, 2) + Math.pow(b - avgB, 2)
          );
          return dist < tolerance;
        };

        const isExterior = new Uint8Array(w * h);
        const queue: number[] = [];

        // 1. Seed top & bottom outer borders
        for (let x = 0; x < w; x++) {
          const top = x;
          if (isBgPixel(top)) { isExterior[top] = 1; queue.push(top); }
          const bot = (h - 1) * w + x;
          if (isBgPixel(bot)) { isExterior[bot] = 1; queue.push(bot); }
        }

        // 2. Seed left & right outer borders
        for (let y = 0; y < h; y++) {
          const left = y * w;
          if (!isExterior[left] && isBgPixel(left)) { isExterior[left] = 1; queue.push(left); }
          const right = y * w + (w - 1);
          if (!isExterior[right] && isBgPixel(right)) { isExterior[right] = 1; queue.push(right); }
        }

        // 3. BFS flood fill exterior background only
        let head = 0;
        while (head < queue.length) {
          const curr = queue[head++];
          const cx = curr % w;
          const cy = Math.floor(curr / w);

          const neighbors = [
            cy > 0 ? curr - w : -1,
            cy < h - 1 ? curr + w : -1,
            cx > 0 ? curr - 1 : -1,
            cx < w - 1 ? curr + 1 : -1,
          ];

          for (const n of neighbors) {
            if (n >= 0 && !isExterior[n] && isBgPixel(n)) {
              isExterior[n] = 1;
              queue.push(n);
            }
          }
        }

        // 4. Erase exterior pixels & defringe borders
        for (let i = 0; i < w * h; i++) {
          const p = i * 4;
          if (isExterior[i]) {
            data[p + 3] = 0;
          } else {
            // Defringe: if this pixel is on the perimeter of the cutout and is light-colored, fade it
            const cx = i % w;
            const cy = Math.floor(i / w);
            const isBorderingExterior =
              (cy > 0 && isExterior[i - w]) ||
              (cy < h - 1 && isExterior[i + w]) ||
              (cx > 0 && isExterior[i - 1]) ||
              (cx < w - 1 && isExterior[i + 1]);

            if (isBorderingExterior) {
              const r = data[p], g = data[p + 1], b = data[p + 2];
              if (r > 210 && g > 210 && b > 210) {
                data[p + 3] = 0; // remove white edge fringe
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.warn('Canvas background removal error:', err);
        resolve(src);
      }
    };

    img.onerror = () => resolve(src);
    img.src = src;
  });
}

// Generate 100% Solid Filled Silhouette (Bóng đen thuần, màu đều tuyệt đối, không lốm đốm)
export async function generateSolidSilhouette(
  imageUrl: string,
  fillColor: string = '#000000'
): Promise<string> {
  const dataUrl = await fetchImageAsDataUrl(imageUrl);
  const src = dataUrl || imageUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve(src);
        return;
      }

      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0);

      try {
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Sample corner background
        let bgR = 255, bgG = 255, bgB = 255;
        const cornerIdxs = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + w - 1) * 4];
        let samples = 0, sR = 0, sG = 0, sB = 0;
        for (const idx of cornerIdxs) {
          if (data[idx + 3] > 30) {
            sR += data[idx]; sG += data[idx + 1]; sB += data[idx + 2];
            samples++;
          }
        }
        if (samples > 0) {
          bgR = Math.round(sR / samples);
          bgG = Math.round(sG / samples);
          bgB = Math.round(sB / samples);
        }

        const isBg = (idx: number) => {
          const p = idx * 4;
          const a = data[p + 3];
          if (a < 35) return true;
          const r = data[p], g = data[p + 1], b = data[p + 2];
          const nearWhite = r > 220 && g > 220 && b > 220;
          const dist = Math.sqrt(Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2));
          return nearWhite || dist < 38;
        };

        const isExterior = new Uint8Array(w * h);
        const queue: number[] = [];

        // Seed 4 outer borders
        for (let x = 0; x < w; x++) {
          const top = x;
          if (isBg(top)) { isExterior[top] = 1; queue.push(top); }
          const bot = (h - 1) * w + x;
          if (isBg(bot)) { isExterior[bot] = 1; queue.push(bot); }
        }
        for (let y = 0; y < h; y++) {
          const left = y * w;
          if (!isExterior[left] && isBg(left)) { isExterior[left] = 1; queue.push(left); }
          const right = y * w + (w - 1);
          if (!isExterior[right] && isBg(right)) { isExterior[right] = 1; queue.push(right); }
        }

        // BFS flood fill exterior background
        let head = 0;
        while (head < queue.length) {
          const curr = queue[head++];
          const cx = curr % w;
          const cy = Math.floor(curr / w);

          const neighbors = [
            cy > 0 ? curr - w : -1,
            cy < h - 1 ? curr + w : -1,
            cx > 0 ? curr - 1 : -1,
            cx < w - 1 ? curr + 1 : -1,
          ];

          for (const n of neighbors) {
            if (n >= 0 && !isExterior[n] && isBg(n)) {
              isExterior[n] = 1;
              queue.push(n);
            }
          }
        }

        // Color for solid silhouette
        const rgb = hexToRgb(fillColor || '#000000');

        // Fill EVERY pixel inside foreground with 100% solid, fully opaque black
        const outData = ctx.createImageData(w, h);
        const out = outData.data;

        for (let i = 0; i < w * h; i++) {
          const p = i * 4;
          if (!isExterior[i]) {
            out[p] = rgb.r;
            out[p + 1] = rgb.g;
            out[p + 2] = rgb.b;
            out[p + 3] = 255; // 100% OPAQUE
          } else {
            out[p + 3] = 0;
          }
        }

        ctx.putImageData(outData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(src);
      }
    };

    img.onerror = () => resolve(src);
    img.src = src;
  });
}

// Complete image processor: downloads, strips background, and creates solid black silhouette
export async function processItemImage(
  rawImageUrl: string,
  shadowColor: string = '#000000',
  tolerance: number = 40
): Promise<{ cleanImageUrl: string; silhouetteUrl: string }> {
  try {
    const dataUrl = await fetchImageAsDataUrl(rawImageUrl);
    const cleanImageUrl = await removeLightBackground(dataUrl || rawImageUrl, tolerance);
    let silhouetteUrl = '';
    try {
      silhouetteUrl = await generateSolidSilhouette(cleanImageUrl, shadowColor);
    } catch {
      silhouetteUrl = cleanImageUrl;
    }
    return { cleanImageUrl, silhouetteUrl };
  } catch (err) {
    console.error('Error processing item image:', err);
    return { cleanImageUrl: rawImageUrl, silhouetteUrl: rawImageUrl };
  }
}

// Specialized cleaner for the 3D START NOW button:
// Erases both the white background AND the soft contact ground shadow on the floor,
// defringes edges, and crops cleanly to the button's boundary with zero white borders!
export async function cleanStartNowButtonImage(imageUrl: string): Promise<string> {
  const dataUrl = await fetchImageAsDataUrl(imageUrl);
  const src = dataUrl || imageUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve(src);
        return;
      }

      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0);

      try {
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Determine if a pixel is the white background, floor, or soft ground shadow
        const isBgOrShadow = (idx: number) => {
          const p = idx * 4;
          const a = data[p + 3];
          if (a < 35) return true;
          const r = data[p], g = data[p + 1], b = data[p + 2];
          const brightness = (r + g + b) / 3;
          const maxC = Math.max(r, g, b);
          const minC = Math.min(r, g, b);
          const saturation = maxC - minC;

          // Pure or near-white background floor
          if (r > 195 && g > 195 && b > 195) return true;
          // Soft ground contact shadow (neutral grey on white)
          if (brightness > 90 && saturation < 42) return true;
          // Very dark contact shadow directly under base
          if (brightness <= 90 && saturation < 25) return true;

          return false;
        };

        const isExterior = new Uint8Array(w * h);
        const queue: number[] = [];

        // 1. Seed all 4 outer borders
        for (let x = 0; x < w; x++) {
          const top = x;
          if (isBgOrShadow(top)) { isExterior[top] = 1; queue.push(top); }
          const bot = (h - 1) * w + x;
          if (isBgOrShadow(bot)) { isExterior[bot] = 1; queue.push(bot); }
        }
        for (let y = 0; y < h; y++) {
          const left = y * w;
          if (!isExterior[left] && isBgOrShadow(left)) { isExterior[left] = 1; queue.push(left); }
          const right = y * w + (w - 1);
          if (!isExterior[right] && isBgOrShadow(right)) { isExterior[right] = 1; queue.push(right); }
        }

        // 2. BFS flood fill exterior background & floor shadow
        let head = 0;
        while (head < queue.length) {
          const curr = queue[head++];
          const cx = curr % w;
          const cy = Math.floor(curr / w);

          const neighbors = [
            cy > 0 ? curr - w : -1,
            cy < h - 1 ? curr + w : -1,
            cx > 0 ? curr - 1 : -1,
            cx < w - 1 ? curr + 1 : -1,
          ];

          for (const n of neighbors) {
            if (n >= 0 && !isExterior[n] && isBgOrShadow(n)) {
              isExterior[n] = 1;
              queue.push(n);
            }
          }
        }

        // 3. Erase exterior pixels & defringe borders
        let minX = w, maxX = 0, minY = h, maxY = 0;
        for (let i = 0; i < w * h; i++) {
          const p = i * 4;
          if (isExterior[i]) {
            data[p + 3] = 0;
          } else {
            const cx = i % w;
            const cy = Math.floor(i / w);
            // Defringe: if adjacent to exterior and has low saturation or light color
            const isBorderingExterior =
              (cy > 0 && isExterior[i - w]) ||
              (cy < h - 1 && isExterior[i + w]) ||
              (cx > 0 && isExterior[i - 1]) ||
              (cx < w - 1 && isExterior[i + 1]);

            if (isBorderingExterior) {
              const r = data[p], g = data[p + 1], b = data[p + 2];
              const sat = Math.max(r, g, b) - Math.min(r, g, b);
              if (sat < 55 || (r > 185 && g > 185 && b > 185)) {
                data[p + 3] = 0;
                continue;
              }
            }

            if (cx < minX) minX = cx;
            if (cx > maxX) maxX = cx;
            if (cy < minY) minY = cy;
            if (cy > maxY) maxY = cy;
          }
        }

        ctx.putImageData(imgData, 0, 0);

        // Crop tightly to the button boundaries with nice 14px safety padding
        if (maxX > minX && maxY > minY) {
          const pad = 14;
          const cropX = Math.max(0, minX - pad);
          const cropY = Math.max(0, minY - pad);
          const cropW = Math.min(w - cropX, maxX - minX + pad * 2);
          const cropH = Math.min(h - cropY, maxY - minY + pad * 2);

          const croppedCanvas = document.createElement('canvas');
          croppedCanvas.width = cropW;
          croppedCanvas.height = cropH;
          const cropCtx = croppedCanvas.getContext('2d');
          if (cropCtx) {
            cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
            resolve(croppedCanvas.toDataURL('image/png'));
            return;
          }
        }

        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        console.warn('Button cleanup error:', e);
        resolve(src);
      }
    };

    img.onerror = () => resolve(src);
    img.src = src;
  });
}

// Alias for backwards compatibility
export const generateSilhouetteDataUrl = generateSolidSilhouette;

