import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSharedValue } from "react-native-reanimated";
import { FlatList, ScrollView, ViewToken } from "react-native";
import { AudioList, VideoList } from "./ui/List"; // Adjust the path if necessary
import { View } from "react-native";

type VideoItem = {
  id: number;
  snippet: {
    resourceId: {
      videoId: string;
    };
    title: string;
    thumbnails: {
      high: {
        url: string;
      };
    };
  };
};

type FlatListAnimateProps = {
  data: VideoItem[]; // data is an array of VideoItem
};

const FlatListAnimateVideo: React.FC<FlatListAnimateProps> = ({ data }) => {
  const animatedOnce = useRef<Set<string>>(new Set());
  const initialLoad = useRef(true);
  const [triggerAnimation, setTriggerAnimation] = useState<{
    [key: string]: boolean;
  }>({});

  const onViewableItemsChanged = useRef(
    ({
      viewableItems,
      changed,
    }: {
      viewableItems: Array<ViewToken>;
      changed: Array<ViewToken>;
    }) => {
      // Prepare a new object to store which items are visible
      const newTriggers: { [key: string]: boolean } = {};

      // Mark all viewable items as true (should animate)
      viewableItems.forEach((entry) => {
        const id = entry.item.snippet.resourceId.videoId;
        newTriggers[id] = true;
      });

      // Also, set false for items that are not visible (from changed list)
      changed.forEach((entry) => {
        const id = entry.item.snippet.resourceId.videoId;
        if (!entry.isViewable) {
          newTriggers[id] = false;
        }
      });

      // Update state with current visibility
      setTriggerAnimation((prev) => ({ ...prev, ...newTriggers }));
    }
  );

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.snippet.resourceId.videoId}
      horizontal
      showsHorizontalScrollIndicator={false}
      renderItem={({ item, index }) => (
        <VideoList
          item={item}
          index={index}
          shouldAnimate={
            triggerAnimation[item.snippet.resourceId.videoId] || false
          }
        />
      )}
      onViewableItemsChanged={onViewableItemsChanged.current}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 10, // Trigger when at least 10% visible
        minimumViewTime: 50, // Wait 50ms to confirm visibility
      }}
      initialNumToRender={2}
      windowSize={5}
    />
  );
};
export default FlatListAnimateVideo;

const FlatListAnimateAudio: React.FC<FlatListAnimateProps> = ({ data }) => {
  const [triggerAnimation, setTriggerAnimation] = useState<{
    [key: string]: boolean;
  }>({});

  const onViewableItemsChanged = useRef(
    ({
      viewableItems,
      changed,
    }: {
      viewableItems: Array<ViewToken>;
      changed: Array<ViewToken>;
    }) => {
      const newTriggers: { [key: string]: boolean } = {};

      viewableItems.forEach((entry) => {
        const id = entry.item.snippet.resourceId.videoId;
        newTriggers[id] = true;
      });

      changed.forEach((entry) => {
        const id = entry.item.snippet.resourceId.videoId;
        if (!entry.isViewable) {
          newTriggers[id] = false;
        }
      });

      setTriggerAnimation((prev) => ({ ...prev, ...newTriggers }));
    }
  );

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.snippet.resourceId.videoId}
      horizontal
      showsHorizontalScrollIndicator={false}
      renderItem={({ item, index }) => (
        <AudioList
          item={item}
          index={index}
          shouldAnimate={
            triggerAnimation[item.snippet.resourceId.videoId] || false
          }
        />
      )}
      onViewableItemsChanged={onViewableItemsChanged.current}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 10,
        minimumViewTime: 50,
      }}
      initialNumToRender={3}
      windowSize={5}
    />
  );
};

export { FlatListAnimateVideo, FlatListAnimateAudio };
