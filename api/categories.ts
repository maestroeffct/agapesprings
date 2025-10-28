// import axios from "axios";

// // Define category shape
// export type Category = {
//   id: string | number;
//   title: string;
//   description?: string;
//   imageUrl?: string;
// };

// const BASE_URL = "https://your-api.com"; // 👈 replace with your API root

// /**
//  * Fetch categories from backend
//  */
// export async function getCategories(): Promise<Category[]> {
//   try {
//     const res = await axios.get(`${BASE_URL}/categories`);

//     // Normalize data in case API keys differ
//     return (res.data?.categories || res.data || []).map((cat: any) => ({
//       id: cat.id ?? cat._id ?? cat.uuid,
//       title: cat.title ?? cat.name ?? "Untitled Category",
//       description: cat.description ?? "",
//       imageUrl: cat.imageUrl ?? cat.icon ?? null,
//     }));
//   } catch (err) {
//     console.error("❌ getCategories error:", err);
//     throw err;
//   }
// }
