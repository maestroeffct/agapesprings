import type { OneSound } from "@/types";
import apiClient from "./client";

// ✅ Get paginated OneSound files
export async function getOneSoundFiles(
  page = 1,
  size = 20
): Promise<OneSound[]> {
  const res = await apiClient.get(`/oneSound/files/${page}/${size}`);
  return res.data?.data || [];
}

// ✅ Get single OneSound by ID
export async function getOneSoundById(id: number): Promise<OneSound | null> {
  const res = await apiClient.get(`/oneSound/fileById/${id}`);
  return res.data?.data || null;
}

// ✅ Helper: Extract lyrics safely for rendering
export function extractLyrics(lyrics?: string): string {
  if (!lyrics) return "";
  return lyrics
    .replace(/\r?\n/g, "<br />") // preserve line breaks
    .trim();
}
