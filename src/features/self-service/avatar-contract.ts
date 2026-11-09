/** Narrow contract for an avatar normalized by the browser canvas. */
export const AVATAR_BUCKET = "pvh-avatars";
export const MAX_AVATAR_BYTES = 1024 * 1024;
export const MAX_AVATAR_EDGE = 1024;

export function avatarObjectPath(userId: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) throw new Error("Invalid user identifier");
  return `${userId}/avatar.jpg`;
}

/** Header and size check. Browser re-encodes to JPEG to strip EXIF first. */
export function validateNormalizedJpeg(bytes: Uint8Array): string | null {
  if (bytes.length < 32 || bytes.length > MAX_AVATAR_BYTES) return "Ảnh phải nhỏ hơn 1 MB.";
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 ||
      bytes[bytes.length - 2] !== 0xff || bytes[bytes.length - 1] !== 0xd9) {
    return "Định dạng ảnh không hợp lệ. Vui lòng chọn lại ảnh.";
  }
  let p = 2, hasDimensions = false, hasImageScan = false;
  while (p < bytes.length - 2) {
    if (bytes[p++] !== 0xff) return "Ảnh JPEG không đúng định dạng.";
    while (bytes[p] === 0xff) p++;
    const marker = bytes[p++];
    if (marker === 0xda) { hasImageScan = true; break; } // image scan starts
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (p + 2 > bytes.length) return "Dữ liệu ảnh không đầy đủ.";
    const segmentLength = (bytes[p] << 8) | bytes[p + 1];
    if (segmentLength < 2 || p + segmentLength > bytes.length) return "Dữ liệu ảnh không hợp lệ.";
    if (marker === 0xe1 || marker === 0xed) return "Ảnh còn chứa siêu dữ liệu; vui lòng chọn lại.";
    if ([0xc0, 0xc1, 0xc2, 0xc3].includes(marker)) {
      if (segmentLength < 7) return "Không đọc được kích thước ảnh.";
      const height = (bytes[p + 3] << 8) | bytes[p + 4];
      const width = (bytes[p + 5] << 8) | bytes[p + 6];
      if (!height || !width || height > MAX_AVATAR_EDGE || width > MAX_AVATAR_EDGE)
        return "Kích thước ảnh vượt quá giới hạn 1024 × 1024.";
      hasDimensions = true;
    }
    p += segmentLength;
  }
  return hasDimensions && hasImageScan ? null : "Dữ liệu ảnh JPEG không đầy đủ.";
}
