/** Shrink a photo before upload (keeps each request well under the API's size limit). */
export async function compressImage(file: File, maxSide = 2000, quality = 0.82): Promise<Blob> {
  if (file.size < 900 * 1024 && /jpe?g$/i.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/jpeg", quality));
    return blob || file;
  } catch {
    // Formats the browser can't decode (e.g. HEIC on Chrome) go up as they are
    return file;
  }
}
