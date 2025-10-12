// src/utils/media.ts
export const getField = (obj: any, fields: string[], fallback: any = null) => {
  for (const key of fields) {
    if (obj?.[key]) return obj[key];
  }
  return fallback;
};

export const getBestThumb = (thumbs: any) =>
  thumbs?.maxres?.url ||
  thumbs?.standard?.url ||
  thumbs?.high?.url ||
  thumbs?.medium?.url ||
  thumbs?.default?.url;
