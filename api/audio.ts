import type { AudioCategory, AudioSermon } from "@/types";
import apiClient from "./client";

// ✅ Get paginated sermons
export async function getAudioSermons(
  page = 1,
  size = 10
): Promise<AudioSermon[]> {
  const res = await apiClient.get(`/audioSermon/files/${page}/${size}`);
  return res.data?.data || [];
}

// ✅ Get categories
export async function getAudioCategories(): Promise<AudioCategory[]> {
  const res = await apiClient.get("/audioSermon/categories");
  return res.data?.data || [];
}

// ✅ Get single file by ID
export async function getAudioById(id: number): Promise<AudioSermon | null> {
  const res = await apiClient.get(`/audioSermon/fileById/${id}`);
  return res.data?.data || null;
}

// ✅ Get files by category
export async function getAudioInCategory(
  categoryId: number,
  page = 1,
  size = 10
): Promise<AudioSermon[]> {
  const res = await apiClient.get(
    `/audioSermon/files/inCategory/${categoryId}/${page}/${size}`
  );
  return res.data?.data || [];
}

// ✅ Favorites (requires user auth)
export async function getFavorites(
  page = 1,
  size = 10
): Promise<AudioSermon[]> {
  const res = await apiClient.get(
    `/audioSermon/favorites/files/${page}/${size}`
  );
  return res.data?.data || [];
}

export async function addToFavorites(audioId: number): Promise<any> {
  const res = await apiClient.post(`/audioSermon/addToFavorite/${audioId}`);
  return res.data;
}

export async function removeFromFavorites(audioId: number): Promise<any> {
  const res = await apiClient.delete(
    `/audioSermon/removeFromFavorites/${audioId}`
  );
  return res.data;
}
