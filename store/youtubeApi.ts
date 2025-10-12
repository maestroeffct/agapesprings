// store/youtubeApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_KEY = "AIzaSyBxHACG4JGurUzoHPSLQgUv0NZTj-k-VQQ";
const playlistId = "UUBWp1EIoJNEe4ggBArv84ng";

export const youtubeApi = createApi({
  reducerPath: "youtubeApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://youtube.googleapis.com/youtube/v3/",
  }),
  endpoints: (builder) => ({
    getVideos: builder.query<any, { maxResults?: number; pageToken?: string }>({
      query: ({ maxResults = 50, pageToken }) => {
        let url = `playlistItems?part=snippet&maxResults=${maxResults}&playlistId=${playlistId}&key=${API_KEY}`;
        if (pageToken) url += `&pageToken=${pageToken}`;
        return url;
      },
    }),
  }),
});

export const { useGetVideosQuery } = youtubeApi;
