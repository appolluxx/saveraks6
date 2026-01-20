
export const compressImage = async (base64: string, maxSizeMB = 1.5): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDimension = 1600;
      let width = img.width;
      let height = img.height;

      if (width > height && width > maxDimension) {
        height = (height * maxDimension) / width;
        width = maxDimension;
      } else if (height > maxDimension) {
        width = (width * maxDimension) / height;
        height = maxDimension;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      let quality = 0.8;
      let compressed = canvas.toDataURL('image/jpeg', quality);
      while (compressed.length > maxSizeMB * 1024 * 1024 && quality > 0.1) {
        quality -= 0.1;
        compressed = canvas.toDataURL('image/jpeg', quality);
      }
      resolve(compressed);
    };
    img.onerror = reject;
    img.src = base64;
  });
};

export const generateThumbnail = async (base64: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 300;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const scale = Math.max(size / img.width, size / img.height);
      const x = (size / 2) - (img.width / 2) * scale;
      const y = (size / 2) - (img.height / 2) * scale;
      ctx?.drawImage(img, x, y, img.width * scale, img.height * scale);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.src = base64;
  });
};

export const calculateImageHash = async (base64: string): Promise<string> => {
  const data = base64.includes(',') ? base64.split(',')[1] : base64;
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
  const hashBuffer = await crypto.subtle.digest('SHA-256', array);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * ✅ Security Layer: Input Sanitizer
 */
export class InputSanitizer {
  static sanitizeText(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  static sanitizeSchoolId(id: string): string {
    return id.replace(/[^\w\d-]/g, '').toUpperCase().slice(0, 20);
  }
}

/**
 * ✅ Security Layer: Image Validator
 */
export class ImageValidator {
  private static ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

  static validateFile(file: File): { valid: boolean; error?: string } {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Only JPEG and PNG allowed.' };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { valid: false, error: 'File too large (max 5MB before processing).' };
    }
    return { valid: true };
  }

  static async isLikelyScreenshot(base64: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const commonScreenWidths = [1920, 1366, 1440, 2560, 3840, 375, 414, 390];
        const commonScreenHeights = [1080, 768, 900, 1440, 2160, 667, 896, 844];
        const isCommonSize = commonScreenWidths.includes(img.width) && commonScreenHeights.includes(img.height);
        resolve(isCommonSize);
      };
      img.src = base64;
    });
  }
}
