import {
  GlobeIcon,
  MicrophoneIcon,
  CameraIcon,
  TiktokLogoIcon,
  InstagramLogoIcon,
  PlayIcon,
} from "phosphor-react-native";
import type { ImageSource } from "expo-image";
import type { Icon } from "phosphor-react-native";

export interface Recipe {
  title: string;
  subtitle: string;
  image: ImageSource;
  time: number; // in minutes
  calories: number;
}

export interface SourceType {
  id: string;
  name: string;
  icon: Icon;
  colors: [string, string];
}

export interface ShowcaseItem {
  source: SourceType;
  recipe: Recipe;
}

// Source types that can import recipes
export const SOURCES: Record<string, SourceType> = {
  tiktok: { id: "tiktok", name: "TikTok", icon: TiktokLogoIcon, colors: ["#000000", "#000000"] },
  reels: { id: "reels", name: "Reels", icon: InstagramLogoIcon, colors: ["#a855f7", "#ec4899"] },
  shorts: { id: "shorts", name: "Shorts", icon: PlayIcon, colors: ["#ef4444", "#b91c1c"] },
  articles: { id: "articles", name: "Articles", icon: GlobeIcon, colors: ["#3b82f6", "#6366f1"] },
  blogs: { id: "blogs", name: "Blogs", icon: GlobeIcon, colors: ["#8b5cf6", "#6d28d9"] },
  websites: { id: "websites", name: "Websites", icon: GlobeIcon, colors: ["#06b6d4", "#0891b2"] },
  cookbooks: {
    id: "cookbooks",
    name: "Cookbooks",
    icon: CameraIcon,
    colors: ["#f59e0b", "#d97706"],
  },
  screenshots: {
    id: "screenshots",
    name: "Screenshot",
    icon: CameraIcon,
    colors: ["#f97316", "#ea580c"],
  },
  photos: { id: "photos", name: "Photos", icon: CameraIcon, colors: ["#eab308", "#ca8a04"] },
  dictation: {
    id: "dictation",
    name: "Dictation",
    icon: MicrophoneIcon,
    colors: ["#10b981", "#14b8a6"],
  },
};

// Showcase items grouped by source category (video, web, photo, voice)
export const SHOWCASE_DATA: ShowcaseItem[][] = [
  // Video sources (TikTok, Reels, Shorts)
  [
    {
      source: SOURCES.tiktok,
      recipe: {
        title: "Spicy Vodka Pasta",
        subtitle: "Gigi Hadid Style",
        image: {
          uri: "https://images.unsplash.com/photo-1595295333158-4742f28fbd85?auto=format&fit=crop&q=80&w=600",
        },
        time: 25,
        calories: 520,
      },
    },
    {
      source: SOURCES.reels,
      recipe: {
        title: "Green Goddess Salad",
        subtitle: "Baked by Melissa",
        image: {
          uri: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600",
        },
        time: 10,
        calories: 280,
      },
    },
    {
      source: SOURCES.shorts,
      recipe: {
        title: "Crispy Potatoes",
        subtitle: "ASMR Cooking",
        image: {
          uri: "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?auto=format&fit=crop&q=80&w=600",
        },
        time: 35,
        calories: 340,
      },
    },
  ],
  // Web sources (Articles, Blogs, Websites)
  [
    {
      source: SOURCES.articles,
      recipe: {
        title: "Roast Chicken",
        subtitle: "with Sourdough Croutons",
        image: {
          uri: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&q=80&w=600",
        },
        time: 75,
        calories: 450,
      },
    },
    {
      source: SOURCES.blogs,
      recipe: {
        title: "Best Brownies",
        subtitle: "Fudgy & Chewy",
        image: {
          uri: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=600",
        },
        time: 45,
        calories: 380,
      },
    },
    {
      source: SOURCES.websites,
      recipe: {
        title: "Avocado Toast",
        subtitle: "Cafe Style",
        image: {
          uri: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&q=80&w=600",
        },
        time: 10,
        calories: 320,
      },
    },
  ],
  // Photo sources (Cookbooks, Screenshots, Photos)
  [
    {
      source: SOURCES.cookbooks,
      recipe: {
        title: "Mom's Lasagna",
        subtitle: "Handwritten Recipe",
        image: {
          uri: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&q=80&w=600",
        },
        time: 90,
        calories: 620,
      },
    },
    {
      source: SOURCES.screenshots,
      recipe: {
        title: "Smoothie Bowl",
        subtitle: "Instagram Story",
        image: {
          uri: "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&q=80&w=600",
        },
        time: 5,
        calories: 240,
      },
    },
    {
      source: SOURCES.photos,
      recipe: {
        title: "Caesar Salad",
        subtitle: "Restaurant Menu",
        image: {
          uri: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&q=80&w=600",
        },
        time: 15,
        calories: 350,
      },
    },
  ],
  // Voice source (single item, no rotation)
  [
    {
      source: SOURCES.dictation,
      recipe: {
        title: "Apple Pie",
        subtitle: "Grandma's Secret",
        image: {
          uri: "https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?auto=format&fit=crop&q=80&w=600",
        },
        time: 60,
        calories: 410,
      },
    },
  ],
];
