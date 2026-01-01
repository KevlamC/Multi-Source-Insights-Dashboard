import httpx
import time
import asyncio

# deploy with: vercel
BATCH_SIZE = 1000
# estimate 3 seconds, vercel timeout if > 10s
VADER_URL = "https://vader-vercel.vercel.app/predict"
MAX_RETRIES = 3
RETRY_BASE_DELAY = 1.0  # seconds
TIMEOUT_SECONDS = 10.0  # Vercel timeout limit

async def analyze_sentiment_via_vader(comments_for_vader: list):
    all_results = []
    total_elapsed = 0.0
    total_input_kb = 0.0
    total_return_kb = 0.0
    peak_memory_mb = 0.0
    initial_memory_mb = None

    async with httpx.AsyncClient() as client:
        for i in range(0, len(comments_for_vader), BATCH_SIZE):
            batch = comments_for_vader[i:i + BATCH_SIZE]

            for attempt in range(1, MAX_RETRIES + 1):
                try:
                    print(f"➡️ [vader] Sending batch {i // BATCH_SIZE + 1}, attempt {attempt}")
                    start_time = time.perf_counter()

                    response = await client.post(
                        VADER_URL,
                        json={"comments": batch},
                        timeout=TIMEOUT_SECONDS
                    )
                    response.raise_for_status()

                    elapsed = time.perf_counter() - start_time
                    data = response.json()
                    total_elapsed += elapsed

                    if initial_memory_mb is None:
                        initial_memory_mb = data.get("memory_initial_mb", 0.0)

                    total_input_kb += data.get("total_data_size_kb", 0.0)
                    total_return_kb += data.get("total_return_size_kb", 0.0)
                    peak_memory_mb = max(peak_memory_mb, data.get("memory_peak_mb", 0.0))

                    all_results.extend(data.get("results", []))

                    print(f"✅ [vader] Batch {i // BATCH_SIZE + 1} succeeded in {elapsed:.2f}s")
                    break  # Break retry loop after success

                except (httpx.ReadTimeout, httpx.TimeoutException):
                    print(f"⏰ [vader]Batch {i // BATCH_SIZE + 1}, attempt {attempt} timed out after {TIMEOUT_SECONDS}s.")
                    if attempt < MAX_RETRIES:
                        backoff = RETRY_BASE_DELAY * (2 ** (attempt - 1))
                        print(f"⏳ [vader] Retrying after {backoff:.1f}s with same batch size...")
                        await asyncio.sleep(backoff)
                    else:
                        print(f"🚫 [vader] Skipping batch {i // BATCH_SIZE + 1} after {MAX_RETRIES} timeout attempts.")
                        break  # Stop retrying on timeout

                except httpx.HTTPError as e:
                    print(f"❌ Batch {i // BATCH_SIZE + 1}, attempt {attempt} failed: {e}")
                    if attempt < MAX_RETRIES:
                        backoff = RETRY_BASE_DELAY * (2 ** (attempt - 1))
                        print(f"⏳ [vader] Retrying after {backoff:.1f}s...")
                        await asyncio.sleep(backoff)
                    else:
                        print(f"🚫 Skipping batch {i // BATCH_SIZE + 1} after {MAX_RETRIES} failed attempts.")
                        break

    print(f"\n🏁 [vader] All batches done in {total_elapsed:.2f}s")
    print(f"📊 [vader] Memory (MB): initial={initial_memory_mb}, peak={peak_memory_mb}")
    print(f"📦 [vader] Total payload (KB): input={total_input_kb:.2f}, return={total_return_kb:.2f}")

    return {
        "results": all_results,
        "total_time_sec": round(total_elapsed, 2),
        "memory_initial_mb": round(initial_memory_mb or 0.0, 2),
        "memory_peak_mb": round(peak_memory_mb, 2),
        "total_data_size_kb": round(total_input_kb, 2),
        "total_return_size_kb": round(total_return_kb, 2),
        "total_comments": len(all_results)
    }