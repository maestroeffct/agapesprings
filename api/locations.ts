import apiClient from "./client";
import type { Location } from "@/types";

export async function getLocations(): Promise<Location[]> {
  try {
    const res = await apiClient.get("/location/list");
    return res.data?.data || [];
  } catch (error) {
    console.error("Failed to fetch locations:", error);
    return [];
  }
}
