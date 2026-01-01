// To use: 
// import type { Emotion } from "./Emotion";
// import { emotionEmoji, emotionColor } from "./Emotion";
// Define Emotion type
export type Emotion =
    // Positive emotions
    | "admiration"
    | "amusement"
    | "anger"
    | "annoyance"
    | "approval"
    | "caring"
    | "confusion"
    | "curiosity"
    | "desire"
    | "disappointment"
    | "disapproval"
    | "disgust"
    | "embarrassment"
    | "excitement"
    | "fear"
    | "gratitude"
    | "grief"
    | "joy"
    | "love"
    | "nervousness"
    | "optimism"
    | "pride"
    | "realization"
    | "relief"
    | "remorse"
    | "sadness"
    | "surprise"
    | "neutral";


export const emotionOptions = [
    "all",
    "admiration",
    "amusement",
    "anger",
    "annoyance",
    "approval",
    "caring",
    "confusion",
    "curiosity",
    "desire",
    "disappointment",
    "disapproval",
    "disgust",
    "embarrassment",
    "excitement",
    "fear",
    "gratitude",
    "grief",
    "joy",
    "love",
    "nervousness",
    "optimism",
    "pride",
    "realization",
    "relief",
    "remorse",
    "sadness",
    "surprise",
    "neutral"
] as const;

// Emoji mapping
export const emotionEmoji: { [key: string]: string } = {
    admiration: "😍",
    amusement: "😆",
    approval: "👍",
    caring: "🤗",
    curiosity: "🤔",
    desire: "💖",
    excitement: "🤩",
    gratitude: "🙏",
    joy: "😄",
    love: "❤️",
    optimism: "🌈",
    pride: "😎",

    anger: "😡",
    annoyance: "😠",
    disappointment: "😞",
    disapproval: "👎",
    disgust: "🤢",
    embarrassment: "😳",
    fear: "😨",
    grief: "😭",
    nervousness: "😬",
    remorse: "😔",
    sadness: "😢",

    confusion: "😕",
    realization: "💡",
    relief: "😌",
    surprise: "😲",
    neutral: "😐",
};

// Optional: color mapping for emotions
export const emotionColor: Record<Emotion, string> = {
    admiration: "#ff6699",
    amusement: "#ffcc33",
    approval: "#33cc33",
    caring: "#66ccff",
    curiosity: "#ff9966",
    desire: "#ff3366",
    excitement: "#ff9933",
    gratitude: "#33ccff",
    joy: "#ffff66",
    love: "#ff0000",
    optimism: "#66ff66",
    pride: "#ffcc00",

    anger: "#cc0000",
    annoyance: "#ff6600",
    disappointment: "#999999",
    disapproval: "#666666",
    disgust: "#339966",
    embarrassment: "#ff9999",
    fear: "#660066",
    grief: "#333333",
    nervousness: "#cc9966",
    remorse: "#999966",
    sadness: "#3366cc",

    confusion: "#9999ff",
    realization: "#ffff99",
    relief: "#99ff99",
    surprise: "#ffccff",
    neutral: "#cccccc",
};
