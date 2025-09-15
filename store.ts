import { configureStore } from "@reduxjs/toolkit";
import { youtubeApi } from "./store/youtubeApi";

export const store = configureStore({
  reducer: {
    [youtubeApi.reducerPath]: youtubeApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(youtubeApi.middleware),
});

// For types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
