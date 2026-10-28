/**
 * Client-side image validation and WebP optimization helper.
 * Compresses large uploaded images in the browser before uploading to Supabase Storage
 * to preserve bandwidth, improve mobile page load speeds, and stay well within free tier limits.
 */

const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
];

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): ImageValidationResult {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file format (${file.type || 'unknown'}). Please upload JPEG, PNG, WebP, AVIF, or SVG images.`,
    };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File "${file.name}" is ${sizeMb} MB, which exceeds the 5 MB maximum upload size.`,
    };
  }

  return { valid: true };
}

/**
 * Optimizes raster images (JPEG/PNG) into WebP format capped at maxDimension (default 1600px)
 * Falls back gracefully to the original file in non-canvas environments (e.g. unit tests or SVGs).
 */
export async function optimizeImageForUpload(
  file: File,
  maxDimension = 1600,
  quality = 0.84
): Promise<File> {
  if (file.type === 'image/svg+xml' || file.type === 'image/webp' || file.type === 'image/avif') {
    return file;
  }

  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    return file;
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const optimizedFile = new File([blob], `${baseName}.webp`, {
            type: 'image/webp',
            lastModified: Date.now(),
          });
          resolve(optimizedFile);
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Generates a safe, collision-resistant storage path inside the `product-images` bucket
 */
export function buildSafeStorageObjectPath(productSlug: string, fileName: string): string {
  const safeSlug = productSlug.replace(/[^a-z0-9-]/gi, '-').toLowerCase() || 'product';
  const cleanName = fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-');
  const uniquePrefix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return `catalog/${safeSlug}/${uniquePrefix}-${cleanName}`;
}
