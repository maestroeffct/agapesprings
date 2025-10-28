import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_KEY = "AIzaSyBxHACG4JGurUzoHPSLQgUv0NZTj-k-VQQ";
const playlistId = "UUBWp1EIoJNEe4ggBArv84ng"; // Sermon Playlist
const testimonyPlaylistId = "PLY4ek2J_EXar8qISmjtcB-dyVz3YF7SqX"; // Testimony Playlist
const channelId = "UCLaOIZ7aOxWqIHdhWu8AIlw"; // ✅ Barnabas Alumogie Channel ID (Premiere videos)

export const youtubeApi = createApi({
  reducerPath: "youtubeApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://youtube.googleapis.com/youtube/v3/",
  }),
  endpoints: (builder) => ({
    // 🔹 Sermon Videos
    getVideos: builder.query<any, { maxResults?: number; pageToken?: string }>({
      query: ({ maxResults = 50, pageToken }) => {
        let url = `playlistItems?part=snippet&maxResults=${maxResults}&playlistId=${playlistId}&key=${API_KEY}`;
        if (pageToken) url += `&pageToken=${pageToken}`;
        return url;
      },
    }),

    // 🔹 Testimony Videos
    getTestimonyVideos: builder.query<
      any,
      { maxResults?: number; pageToken?: string }
    >({
      query: ({ maxResults = 25, pageToken }) => {
        let url = `playlistItems?part=snippet&maxResults=${maxResults}&playlistId=${testimonyPlaylistId}&key=${API_KEY}`;
        if (pageToken) url += `&pageToken=${pageToken}`;
        return url;
      },
    }),

    // 🔹 Premiere Videos (from channel)
    getPremiereVideos: builder.query<
      any,
      { maxResults?: number; pageToken?: string }
    >({
      query: ({ maxResults = 10, pageToken }) => {
        let url = `search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=${maxResults}&key=${API_KEY}`;
        if (pageToken) url += `&pageToken=${pageToken}`;
        return url;
      },
    }),
  }),
});

export const {
  useGetVideosQuery,
  useGetTestimonyVideosQuery,
  useGetPremiereVideosQuery,
} = youtubeApi;
