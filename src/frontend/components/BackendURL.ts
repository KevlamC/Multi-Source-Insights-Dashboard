// export const LAMBDA_SCRAPER_FUNCTION_URL = 'https://dt5nzo67tiek5d5jvxhbsq5dey0nuyyl.lambda-url.ca-central-1.on.aws/';
// BackendURL.ts updated
export const LAMBDA_SCRAPER_FUNCTION_URL = "https://dt5nzo67tiek5d5jvxhbsq5dey0nuyyl.lambda-url.ca-central-1.on.aws/";

export const BACKEND_SCRAPER_ROUTE = `${LAMBDA_SCRAPER_FUNCTION_URL}scrape_comments`;
export const BACKEND_USEPREVIOUS_ROUTE = `${LAMBDA_SCRAPER_FUNCTION_URL}use_prev_data`;
export const BACKEND_GET_FILTERED_CMTS_ROUTE = `${LAMBDA_SCRAPER_FUNCTION_URL}get_filtered_cmts`;
export const BACKEND_AI_CHAT_ROUTE = `${LAMBDA_SCRAPER_FUNCTION_URL}ai/chat`;