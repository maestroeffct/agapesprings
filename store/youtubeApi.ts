import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_KEY = "AIzaSyBxHACG4JGurUzoHPSLQgUv0NZTj-k-VQQ";
const playlistId = "UUBWp1EIoJNEe4ggBArv84ng";

export const youtubeApi = createApi({
  reducerPath: "youtubeApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://youtube.googleapis.com/youtube/v3/",
  }),
  endpoints: (builder) => ({
    getVideos: builder.query<any, number>({
      query: (maxResults) =>
        `playlistItems?part=snippet&maxResults=${maxResults}&playlistId=${playlistId}&key=${API_KEY}`,
    }),
  }),
});

export const { useGetVideosQuery } = youtubeApi;
