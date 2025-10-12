// api/devotionals.ts
import apiClient from "./client";

// Shape of one devotional (normalized)
export type Devotional = {
  id: number;
  timePosted: string;
  headerUrl: string;
  content: string[]; // always array of URLs
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

// Helper to normalize API devotional -> Devotional
function normalizeDevotional(raw: any): Devotional {
  return {
    id: raw.id,
    timePosted: raw.timePosted,
    headerUrl: raw.headerUrl,
    content: raw.processedContent
      ? raw.processedContent.map((pc: any) => pc.url)
      : raw.contentS3keys
      ? JSON.parse(raw.contentS3keys) // fallback if processedContent missing
      : [],
  };
}

// ✅ Get paginated devotionals
export async function getDevotionals(
  page = 1,
  size = 100
): Promise<DevotionalResponse> {
  const res = await apiClient.get(`/devotion/files/${page}/${size}`);

  return {
    success: res.data.success,
    pagination: res.data.pagination,
    data: res.data.data.map(normalizeDevotional),
  };
}

// ✅ Get single devotional by ID
export async function getDevotionalById(
  id: number
): Promise<Devotional | null> {
  const res = await apiClient.get(`/devotion/fileById/${id}`);
  if (!res.data?.data) return null;
  return normalizeDevotional(res.data.data);
}
