export const GENRES = {
  food: {
    label: "グルメ・飲食",
    domain: "food.real-voice.com",
    repo: "real-voice-com/blog-food",
    tone: "casual" as const,
  },
  gadget: {
    label: "ガジェット",
    domain: "gadget.real-voice.com",
    repo: "real-voice-com/blog-gadget",
    tone: "technical" as const,
  },
  travel: {
    label: "旅行・観光",
    domain: "travel.real-voice.com",
    repo: "real-voice-com/blog-travel",
    tone: "casual" as const,
  },
  shopping: {
    label: "買ってみた",
    domain: "shopping.real-voice.com",
    repo: "real-voice-com/blog-shopping",
    tone: "casual" as const,
  },
} as const;

export type Genre = keyof typeof GENRES;
export type GenreConfig = (typeof GENRES)[Genre];
export type Tone = GenreConfig["tone"];
