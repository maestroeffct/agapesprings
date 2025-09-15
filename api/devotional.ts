// api/devotionals.ts
import apiClient from "./client";

// Shape of one devotional
export type Devotional = {
  id: number;
  timePosted: string; // e.g. "2025-06-02T12:31:22.000Z"
  headerUrl: string;
  content?: string[]; // multiple images allowed
};

// Pagination info
export type Pagination = {
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

// Response wrapper
export type DevotionalResponse = {
  success: boolean;
  pagination: Pagination;
  data: Devotional[];
};

// ✅ Get paginated devotionals
export async function getDevotionals(
  page = 1,
  size = 100
): Promise<DevotionalResponse> {
  const res = await apiClient.get(`/devotion/files/${page}/${size}`);
  return res.data;
}

// ✅ Get single devotional by ID
export async function getDevotionalById(
  id: number
): Promise<Devotional | null> {
  const res = await apiClient.get(`/devotion/fileById/${id}`);
  return res.data?.data || null;
}
