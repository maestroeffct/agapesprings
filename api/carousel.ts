import { CarouselItem } from "@/types";
import client from "./client";

export async function getCarousel(): Promise<CarouselItem[]> {
  try {
    const res = await client.get("/carousel/files");
    return res.data.data; // matches API structure
  } catch (err) {
    console.error("Error fetching carousel:", err);
    return [];
  }
}
