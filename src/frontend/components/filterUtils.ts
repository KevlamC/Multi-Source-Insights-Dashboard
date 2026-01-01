import Papa from "papaparse";
import type {
    RedditItem,
    ScraperCommentItem,
    PainpointsItem,
    FailedSolutionItem,
    DesireWishesItem,
    MetaphorData,
    PractitionerItem,
    TriggersItem,
    QuestionItem
} from "./ItemInterfaces";
import { BACKEND_GET_FILTERED_CMTS_ROUTE } from "./BackendURL";

// these are the variables that store the choosen filter options
// the backend wont need to worry about the name here (intensityPct, timeFilter...), but only worry about its format
export type FilterOptions = {
    keyword?: string; // the string user types in
    intensityPct?: number; // a bar its 0~100, i think its int but can use float for safty
    timeFilter?: string; // "past_day" | "past_week" | "past_month" | "past_year"
    selectedEmotions?: string[]; // ["sadness", "happy"] <-- a list of strings
    topics?: string[]; // ["health", "education"] <-- a list of strings
    selectedSubreddits?: string[]; // a list of strings
    practitioners?: string[]; // a list of strings
};

export function prepareRequest<T extends RedditItem>(
    item: T,
    filters: FilterOptions
) {
    const baseReq = {
        // if is "all", send null, this means we wont send "all" to backend, no need to worry about that 
        // on the left should be the names that backend expect
        // these names are the ones backend care 
        subreddits: filters.selectedSubreddits?.includes("all") ? null : filters.selectedSubreddits,
        emotions: filters.selectedEmotions?.includes("all") ? null : filters.selectedEmotions,
        topics: filters.topics?.includes("all") ? null : filters.topics,
        practitioner_types: filters.practitioners?.includes("all") ? null : filters.practitioners,
        min_intensity: filters.intensityPct ?? null,
        time: filters.timeFilter || "all",
        keyword: filters.keyword || null,
    };

    if ("failedSolution" in item) {
        return {
            ...baseReq,
            failed_solutions: true,
        };
    } else if ("desire_wish" in item) {
        return {
            ...baseReq,
            desire_and_wish: true,
        };
    } else if ("metaphorPhrase" in item) {
        return {
            ...baseReq,
            metaphores: true,
        };
    } else if ("practitioner_type" in item) {
        return {
            ...baseReq,
            practitioner_reference: true,
        };
    } else if ("triggerPhrase" in item) {
        return {
            ...baseReq,
            trigger_phrase: true,
        };
    } else if ("question" in item) {
        return {
            ...baseReq,
            question: true,
        };
    } else {
        // Default for ScraperCommentItem
        return {
            ...baseReq,
        };
    }
}


// takes a list of urls & item type
// return a list of items of type provided
import { decompressSync } from "fflate";
export async function fetchAndParseCSVFiles<T extends RedditItem>(
    urls: string[],
    type: { new(): T } | string
): Promise<T[]> {
    const results: T[] = [];
    const MAX_COMMENTS = 10; // <-- Limit to 10 comments

    for (const url of urls) {
        try {
            const res = await fetch(url);
            if (!res.ok) continue;

            let text: string;
            const encoding = res.headers.get("Content-Encoding");

            if (encoding === "br") {
                const arrayBuffer = await res.arrayBuffer();
                const decompressed = decompressSync(new Uint8Array(arrayBuffer));
                text = new TextDecoder().decode(decompressed);
            } else {
                text = await res.text();
            }

            // First attempt: normal parse
            let parsed;
            try {
                parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
            } catch (err) {
                console.warn(`CSV parse failed for ${url}:`, err);
                continue;
            }

            // Limit to at most 10 rows
            const rows = parsed.data.slice(0, MAX_COMMENTS);

            const items = rows.map((row: any, index: number) => {
                switch (type) {
                    case "ScraperCommentItem":
                        return {
                            id: row.id || index,
                            author: row.author || "",
                            subreddit: row.subreddit || "",
                            comment: row.body || "",
                            upvotes: Number(row.score) || 0,
                            emotion: parseEmotion(row.emotions) || "",
                            timestamp: parseTimestamp(row.created_utc) || "",
                        } as ScraperCommentItem as T;

                    case "PractitionerItem":
                        return {
                            id: row.id || index,
                            author: row.author || "",
                            subreddit: row.subreddit || "",
                            comment: row.body || "",
                            upvotes: Number(row.score) || 0,
                            emotion: parseEmotion(row.emotions) || "",
                            intensity: parseIntensity(row.emotions) || 0,
                            topic: parseTopic(row.topics) || "",
                            timestamp: parseTimestamp(row.created_utc) || "",
                            timestampSort: parseTimestampSort(row.created_utc) || 0,
                            practitioner_type: parsePractitionerType(row.practitioner_reference) || "unknown",
                        } as PractitionerItem as T;

                    case "FailedSolutionItem":
                        return {
                            id: row.id || index,
                            author: row.author || "",
                            subreddit: row.subreddit || "",
                            comment: row.body || "",
                            upvotes: Number(row.score) || 0,
                            emotion: parseEmotion(row.emotions) || "",
                            intensity: parseIntensity(row.emotions) || 0,
                            topic: parseTopic(row.topics) || "",
                            timestamp: parseTimestamp(row.created_utc) || "",
                            timestampSort: parseTimestampSort(row.created_utc) || 0,
                            failedSolution: parseFailedSolution(row.failed_solutions) || "",
                        } as FailedSolutionItem as T;

                    case "DesireWishesItem":
                        return {
                            id: row.id || index,
                            author: row.author || "",
                            subreddit: row.subreddit || "",
                            comment: row.body || "",
                            upvotes: Number(row.score) || 0,
                            emotion: parseEmotion(row.emotions) || "",
                            intensity: parseIntensity(row.emotions) || 0,
                            topic: parseTopic(row.topics) || "",
                            timestamp: parseTimestamp(row.created_utc) || "",
                            timestampSort: parseTimestampSort(row.created_utc) || 0,
                            desire_wish: row.desire_and_wish || "",
                        } as DesireWishesItem as T;

                    case "MetaphorData":
                        return {
                            id: row.id || index,
                            author: row.author || "",
                            subreddit: row.subreddit || "",
                            comment: row.body || "",
                            upvotes: Number(row.score) || 0,
                            emotion: parseEmotion(row.emotions) || "",
                            intensity: parseIntensity(row.emotions) || 0,
                            topic: parseTopic(row.topics) || "",
                            timestamp: parseTimestamp(row.created_utc) || "",
                            metaphorPhrase: parseMetaphors(row.metaphors) || "",
                        } as MetaphorData as T;

                    case "PainpointsItem":
                        return {
                            id: row.id || index,
                            author: row.author || "",
                            subreddit: row.subreddit || "",
                            comment: row.body || "",
                            upvotes: Number(row.score) || 0,
                            emotion: parseEmotion(row.emotions) || "",
                            intensity: parseIntensity(row.emotions) || 0,
                            topic: parseTopic(row.topics) || "",
                            timestamp: parseTimestamp(row.created_utc) || "",
                            timestampSort: parseTimestampSort(row.created_utc) || 0,
                            painpoint: row.painpointsxfrustrations || "",
                        } as PainpointsItem as T;

                    case "TriggersItem":
                        return {
                            id: row.id || index,
                            author: row.author || "",
                            subreddit: row.subreddit || "",
                            comment: row.body || "",
                            upvotes: Number(row.score) || 0,
                            emotion: parseEmotion(row.emotions) || "",
                            intensity: parseIntensity(row.emotions) || 0,
                            topic: parseTopic(row.topics) || "",
                            timestamp: parseTimestamp(row.created_utc) || "",
                            timestampSort: parseTimestampSort(row.created_utc) || 0,
                            triggerPhrase: row.trigger_phrase || "",
                        } as TriggersItem as T;

                    case "QuestionItem":
                        return {
                            id: row.id || index,
                            author: row.author || "",
                            subreddit: row.subreddit || "",
                            comment: row.body || "",
                            upvotes: Number(row.score) || 0,
                            emotion: parseEmotion(row.emotions) || "",
                            intensity: parseIntensity(row.emotions) || 0,
                            topic: parseTopic(row.topics) || "",
                            timestamp: parseTimestamp(row.created_utc) || "",
                            timestampSort: parseTimestampSort(row.created_utc) || 0,
                            question: row.question || "",
                        } as QuestionItem as T;

                    default:
                        throw new Error(`Unknown type: ${type}`);
                }

            });

            results.push(...items);
        } catch (error) {
            console.error(`Error processing ${url}:`, error);
        }
    }

    return results;
}

// Parser helpers
// -------------------- EMOTION --------------------
export function parseEmotion(jsonStr: string | null | undefined): string | null {
    if (!jsonStr?.trim()) return null;

    try {
        const data = JSON.parse(jsonStr) as Record<string, number>;
        if (!data || Object.keys(data).length === 0) return null;

        let maxEmotion = "";
        let maxScore = -Infinity;

        for (const [emotion, score] of Object.entries(data)) {
            if (typeof score === "number" && score > maxScore) {
                maxEmotion = emotion;
                maxScore = score;
            }
        }

        return maxEmotion || null;
    } catch {
        return null;
    }
}

export function parseIntensity(jsonStr: string | null | undefined): number | null {
    if (!jsonStr?.trim()) return null;

    try {
        const data = JSON.parse(jsonStr) as Record<string, number>;
        if (!data || Object.keys(data).length === 0) return null;

        let maxScore = -Infinity;
        for (const score of Object.values(data)) {
            if (typeof score === "number" && score > maxScore) {
                maxScore = score;
            }
        }

        if (maxScore === -Infinity || isNaN(maxScore)) return null;
        return parseFloat((maxScore * 100).toFixed(2));
    } catch {
        return null;
    }
}

// -------------------- TIMESTAMP --------------------
export function parseTimestamp(isoString: string | null | undefined): string {
    if (!isoString?.trim()) return "";

    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 0) return "just now"; // future date

    if (diffHours < 1) return "just now";
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffHours < 24 * 7) return `${Math.floor(diffHours / 24)} day${Math.floor(diffHours / 24) > 1 ? "s" : ""} ago`;
    if (diffHours < 24 * 30) return `${Math.floor(diffHours / (24 * 7))} week${Math.floor(diffHours / (24 * 7)) > 1 ? "s" : ""} ago`;
    if (diffHours < 24 * 365) return `${Math.floor(diffHours / (24 * 30))} month${Math.floor(diffHours / (24 * 30)) > 1 ? "s" : ""} ago`;

    return `${Math.floor(diffHours / (24 * 365))} year${Math.floor(diffHours / (24 * 365)) > 1 ? "s" : ""} ago`;
}

export function parseTimestampSort(isoString: string | null | undefined): number {
    if (!isoString?.trim()) return Number.MAX_SAFE_INTEGER;

    const date = new Date(isoString);
    if (isNaN(date.getTime())) return Number.MAX_SAFE_INTEGER;

    const diffMs = new Date().getTime() - date.getTime();
    return Math.max(Math.floor(diffMs / (1000 * 60 * 60)), 0); // ensure non-negative
}

// -------------------- PRACTITIONER --------------------
export function parsePractitionerType(jsonStr: string | null | undefined): string | null {
    if (!jsonStr?.trim()) return null;

    try {
        const data = JSON.parse(jsonStr);
        if (Array.isArray(data) && data.length > 0) {
            const longestItem = data.reduce((prev, curr) => {
                const prevLen = prev?.practitioner_reference?.length || 0;
                const currLen = curr?.practitioner_reference?.length || 0;
                return currLen > prevLen ? curr : prev;
            });
            return longestItem?.practitioner_type || null;
        } else if (typeof data === "object" && data !== null) {
            return data.practitioner_type || null;
        }
    } catch { }
    return null;
}

// -------------------- TOPIC --------------------
export function parseTopic(jsonStr: string | null | undefined): string | null {
    if (!jsonStr?.trim()) return null;

    try {
        const data = JSON.parse(jsonStr) as Record<string, number>;
        if (!data || Object.keys(data).length === 0) return null;

        let maxTopic = "";
        let maxScore = -Infinity;
        for (const [topic, score] of Object.entries(data)) {
            if (typeof score === "number" && score > maxScore) {
                maxTopic = topic;
                maxScore = score;
            }
        }

        return maxTopic || null;
    } catch { }
    return null;
}

// -------------------- ARRAY / STRING PARSERS --------------------
export function parseFailedSolution(input: string | string[] | null | undefined): string {
    if (!input) return "";
    if (Array.isArray(input)) return input.filter(Boolean).join(", ");
    return input;
}

export function parseMetaphors(input: string[] | string | null | undefined): string {
    if (!input) return "";
    if (Array.isArray(input)) return input.filter(Boolean).join(", ");
    return input;
}



// backend filter func
export const applyFiltersBackend = async <T extends RedditItem>(
    type: string, // e.g. "PractitionerItem"
    filters: FilterOptions,
    setFiltered: (data: T[]) => void
) => {
    try {
        // Build request object
        const reqBody = prepareRequest({ type } as any as T, filters);

        const response = await fetch(BACKEND_GET_FILTERED_CMTS_ROUTE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reqBody),
        });

        if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);

        const { urls } = await response.json();
        const items = await fetchAndParseCSVFiles<T>(urls, type); // pass type string for CSV parser
        setFiltered(items);
    } catch (error) {
        console.error("Error applying filters:", error);
    }
};
