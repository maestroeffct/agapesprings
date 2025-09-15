import { CarouselItem } from "@/types";
import { useEffect, useState } from "react";
import { getCarousel } from "../api/carousel";

export function useCarousel() {
  const [data, setData] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const items = await getCarousel();
      setData(items);
      setLoading(false);
    })();
  }, []);

  return { data, loading };
}
