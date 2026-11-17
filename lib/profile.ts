const DATA_IMAGE = /^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=\s]+$/i;

export function cleanDisplayName(value: string) {
  const name = value.trim();
  if (name.length > 80) return null;
  return name;
}

/** Empty clears the photo. Otherwise an https URL or a small data-image. */
export function cleanAvatarUrl(value: string) {
  const avatar = value.trim();
  if (!avatar) return "";
  if (avatar.length > 180000) return null;
  if (avatar.startsWith("https://")) {
    try {
      const url = new URL(avatar);
      return url.protocol === "https:" ? avatar : null;
    } catch {
      return null;
    }
  }
  return DATA_IMAGE.test(avatar) ? avatar : null;
}

export async function fileToAvatar(file: File) {
  const bitmap = await createImageBitmap(file);
  const max = 256;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.72);
}
