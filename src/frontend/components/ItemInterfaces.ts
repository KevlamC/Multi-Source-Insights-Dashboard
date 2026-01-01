import type { Emotion } from "./Emotion";
import type { PractitionerType } from "./PractitionerType";

export type RedditItem =
    | ScraperCommentItem
    | PainpointsItem
    | FailedSolutionItem
    | DesireWishesItem
    | MetaphorData
    | PractitionerItem
    | TriggersItem
    | QuestionItem;


export interface ScraperCommentItem {
    id: string;
    author: string;
    subreddit: string;
    comment: string;
    upvotes: number;
    emotion: Emotion;
    timestamp: string;
}

export interface PainpointsItem {
    id: string;
    author: string;
    timestamp: string;
    timestampSort: number;
    subreddit: string;
    comment: string;
    upvotes: number;
    emotion: Emotion;
    intensity: number;
    painpoint: string;
    topic: string;
}

export interface FailedSolutionItem {
    id: string;
    author: string;
    timestamp: string; // human-readable ("3 hours ago")
    timestampSort: number; // numeric hours ago (lower = newer in these samples)
    subreddit: string;
    comment: string; // full comment for sidebar
    upvotes: number;
    failedSolution: string; // e.g. "Melatonin"
    emotion: Emotion;
    intensity: number; // 0..1
    topic: string;
}

export interface DesireWishesItem {
    id: string;
    author: string;
    timestamp: string;
    timestampSort: number;
    subreddit: string;
    comment: string;
    upvotes: number;
    emotion: Emotion;
    intensity: number;
    topic: string;
    desire_wish: string;
}

export interface MetaphorData {
    id: string;
    author: string;
    subreddit: string;
    comment: string;
    upvotes: number;
    emotion: Emotion;
    timestamp: string;
    metaphorPhrase: string;
    intensity: number;
    topic: string;
}

export interface PractitionerItem {
    id: string;
    author: string;
    subreddit: string;
    comment: string;
    upvotes: number;
    emotion: Emotion;
    timestamp: string;
    timestampSort: number;
    practitioner_type: PractitionerType;
    intensity: number;
    topic: string;
}


export interface TriggersItem {
    id: string;
    author: string;
    timestamp: string;
    timestampSort: number;
    subreddit: string;
    comment: string;
    upvotes: number;
    triggerPhrase: string;
    emotion: Emotion;
    intensity: number;
    topic: string;
}


export interface QuestionItem {
    id: string;
    author: string;
    timestamp: string;
    timestampSort: number;
    subreddit: string;
    comment: string;
    upvotes: number;
    question: string;
    emotion: Emotion;
    intensity: number;
    topic: string;
}