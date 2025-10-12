import { useCarousel } from "@/hooks/useCarousel";
import { Image as ExpoImage } from "expo-image";

import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
} from "react-native";
import Dots from "./Dots";

const { width } = Dimensions.get("window");

export default function CarouselSection() {
  const { displayData } = useCarousel();
  const carouselRef = useRef<FlatList<any>>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [loadedIndexes, setLoadedIndexes] = useState<Set<number>>(new Set());

  const handleImageLoaded = (index: number) => {
    setLoadedIndexes((prev) => new Set([...prev, index]));
  };

  useEffect(() => {
    const id = setInterval(() => {
      const next = (carouselIndex + 1) % displayData.length;
      if (loadedIndexes.has(next)) {
        setCarouselIndex(next);
        carouselRef.current?.scrollToIndex({ index: next, animated: true });
      }
    }, 5000);
    return () => clearInterval(id);
  }, [displayData.length, carouselIndex, loadedIndexes]);

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCarouselIndex(index);
  };

  return (
    <View>
      <FlatList
        ref={carouselRef}
        data={displayData}
        horizontal
        pagingEnabled
        onMomentumScrollEnd={onEnd}
        keyExtractor={(item, i) => item.id?.toString?.() ?? `c-${i}`}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <ExpoImage
            source={item.url ? { uri: item.url } : item.image}
            style={{ width, height: 230 }}
            contentFit="cover"
            transition={200}
            cachePolicy="disk"
            onLoad={() => handleImageLoaded(index)}
          />
        )}
      />
      <Dots total={displayData.length} activeIndex={carouselIndex} />
    </View>
  );
}
