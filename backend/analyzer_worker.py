import asyncio
import queue
import threading
import time
from concurrent.futures import ThreadPoolExecutor

# Try to import analyzer modules, but make them optional
try:
    from .vader_client import analyze_sentiment_via_vader
    HAS_VADER = True
except ImportError:
    HAS_VADER = False

try:
    from .analyzer_client import analyze_comments_batch_sync
    HAS_ANALYZER = True
except ImportError:
    HAS_ANALYZER = False

# Synchronous wrappers for your async functions
def analyze_sentiment_via_vader_sync(comments):
    if not HAS_VADER:
        return {"results": []}
    return asyncio.run(analyze_sentiment_via_vader(comments))

def analyze_comments_batch_sync(comments):
    if not HAS_ANALYZER:
        return []

def analysis_worker(q: queue.Queue, scraped_data: dict, worker_id: int):
    batch = []
    batch_size = 20
    max_wait = 3  # seconds
    batch_start_time = None

    print(f"[analyzer_worker-{worker_id}] starting...")

    executor = ThreadPoolExecutor(max_workers=2)  # analyze sentiments & attributes in parallel

    def process_batch(batch_to_process):
        try:
            input_comments = [{"id": c["id"], "body": c["body"]} for c in batch_to_process]

            future_other = executor.submit(analyze_comments_batch_sync, input_comments)
            future_vader = executor.submit(analyze_sentiment_via_vader_sync, input_comments)

            other_attr_results = future_other.result()
            vader_results = future_vader.result()

            other_result_map = {r["id"]: r for r in other_attr_results}
            vader_result_map = {r["id"]: r for r in vader_results.get("results", [])}

            for c in batch_to_process:
                cid = c["id"]
                if cid in other_result_map:
                    for key, val in other_result_map[cid].items():
                        if key not in {"id", "body"}:
                            scraped_data['comments_by_id'][cid][key] = val
                if cid in vader_result_map:
                    scraped_data['comments_by_id'][cid]["sentiment"] = vader_result_map[cid]["sentiment"]
                    scraped_data['comments_by_id'][cid]["sentiment_score"] = vader_result_map[cid]["sentiment_score"]
        finally:
            for _ in batch_to_process:
                q.task_done()

    while True:
        # Check for batch timeout first
        if batch and batch_start_time is not None:
            elapsed = time.time() - batch_start_time
            if elapsed >= max_wait:
                print(f"[analyzer_worker-{worker_id}] Timeout hit, flushing batch of size {len(batch)}")
                process_batch(batch.copy())
                batch.clear()
                batch_start_time = None

        try:
            # Use a short timeout so we can check elapsed time frequently
            comment = q.get(timeout=0.1)
            if comment is None:
                print(f"[analyzer_worker-{worker_id}] Got shutdown signal.")
                q.task_done()
                if batch:
                    print(f"[analyzer_worker-{worker_id}] Flushing final batch of {len(batch)} comments")
                    process_batch(batch.copy())
                    batch.clear()
                break

            if not batch:
                batch_start_time = time.time()

            batch.append(comment)
            print(f"[analyzer_worker-{worker_id}] Got comment, batch size now {len(batch)}")

            if len(batch) >= batch_size:
                print(f"[analyzer_worker-{worker_id}] Flushing batch of {len(batch)} comments (batch full)")
                process_batch(batch.copy())
                batch.clear()
                batch_start_time = None

        except queue.Empty:
            # Nothing to do; loop will check elapsed next iteration
            pass

    executor.shutdown(wait=True)
    print(f"[analyzer_worker-{worker_id}] Worker exiting.")


# Function to start multiple workers
def start_workers(num_workers, scraped_data):
    q = queue.Queue()

    threads = []
    for i in range(num_workers):
        t = threading.Thread(target=analysis_worker, args=(q, scraped_data, i), daemon=True)
        t.start()
        threads.append(t)

    return q, threads
