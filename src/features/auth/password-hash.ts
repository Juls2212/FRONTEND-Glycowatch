"use client";

export async function hashStringSha256(value: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("No se pudo procesar la contraseña.");
  }

  const encodedValue = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", encodedValue);
  const digestArray = Array.from(new Uint8Array(digest));

  return digestArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
