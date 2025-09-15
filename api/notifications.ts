// api/notifications.ts
export type NotificationItem = {
  id: number;
  title: string;
  excerpt?: string;
  date: string;
  image?: string;
};

// Fake API function
export async function getNotifications(): Promise<NotificationItem[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Mock notifications
  return [
    {
      id: 1,
      title: "Thursday is here! Join us for #Phaneroo 🎉",
      excerpt: "Phaneroo 550 taught us how to get our prayers answered...",
      date: "11 Sep, 2025",
      image: "https://placekitten.com/200/200",
    },
    {
      id: 2,
      title: "Apostolic Impartation 🙌",
      excerpt: "Child of God, you are called to greater glory.",
      date: "10 Sep, 2025",
      image: "https://placekitten.com/201/201",
    },
    {
      id: 3,
      title: "🔥 Prayer Point - Day 40: THANKING GOD FOR THE GREAT YEAR AHEAD",
      excerpt: "As we conclude our fast, let us express gratitude...",
      date: "10 Feb, 2025",
      image: "https://placekitten.com/202/202",
    },
  ];
}
