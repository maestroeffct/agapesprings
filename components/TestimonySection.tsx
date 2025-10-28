// components/TestimonySection.tsx
import AnimatedCard from "@/components/AnimatedCard";
import Loading from "@/components/Loading";
import { colors } from "@/constants/theme";
import { useTestimonies } from "@/hooks/useTestimonies";
import { getBestThumb } from "@/utils/media";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

export default function TestimonySection({
  onSelect,
}: {
  onSelect: (v: any) => void;
}) {
  const { testimonyCache, isLoading, isError } = useTestimonies();

  return (
    <View style={{ marginTop: 10, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text
          style={{
            fontWeight: "bold",
            color: colors.primary,
            fontSize: 16,
            marginBottom: 10,
          }}
        >
          Testimonies
        </Text>
        <TouchableOpacity onPress={() => router.push("/video/testimonies")}>
          <Text style={{ color: colors.primary }}>View all</Text>
        </TouchableOpacity>
      </View>

      {isLoading && !testimonyCache.length && <Loading size="large" />}
      {isError && !testimonyCache.length && (
        <Text style={{ color: "red" }}>
          Failed to load testimonies. Kindly Refresh!
        </Text>
      )}

      {testimonyCache.length > 0 && (
        <FlatList
          horizontal
          data={testimonyCache}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ item, index }) => (
            <AnimatedCard
              image={
                <ExpoImage
                  source={{ uri: getBestThumb(item.snippet.thumbnails) }}
                  style={{ flex: 1, borderRadius: 8 }}
                  contentFit="cover"
                  placeholder={require("@/assets/images/test_banner.png")}
                  placeholderContentFit="cover"
                />
              }
              title={item.snippet.title}
              shouldAnimate={index === 0}
              onPress={() => onSelect(item)}
            />
          )}
        />
      )}
    </View>
  );
}
