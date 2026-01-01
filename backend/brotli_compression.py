import brotli
import hashlib
import time
import os
import psutil
import threading
import logging
from typing import List

# --- LOGGING SETUP ---
# Create a logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Create a file handler that logs even debug messages
#
# 👇 FIX: Change 'brotli_log.log' to '/tmp/brotli_log.log'
#
file_handler = logging.FileHandler('/tmp/brotli_log.log')
file_handler.setLevel(logging.DEBUG)

# Create a console handler with a higher log level
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

# Create a logging format
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

# Add the handlers to the logger
logger.addHandler(file_handler)
logger.addHandler(console_handler)
# --- END LOGGING SETUP ---

# Configuration - These are now defaults that can be overridden
COMPRESSION_LEVEL = 6  # 0=fastest, 11=maximum compression

class BrotliFileCompressor:
    """Simple Brotli file compressor with comprehensive reporting."""

    def __init__(self, compression_level: int = 6):
        self.compression_level = compression_level
        logger.info(f"BrotliFileCompressor initialized with compression level: {self.compression_level}")

    def sample_memory(self, mem_samples: List[float], stop_flag: dict):
        """Monitor memory usage during compression/decompression."""
        process = psutil.Process(os.getpid())
        while not stop_flag["stop"]:
            try:
                mem = process.memory_info().rss / 1024 / 1024  # MB
                mem_samples.append(mem)
                time.sleep(0.01)
            except Exception as e:
                # Log a warning if the memory sampling thread encounters an issue
                logger.warning(f"Memory sampling thread failed: {e}")
                break

    def hash_file(self, filepath: str) -> str:
        """Calculate SHA256 hash of a file."""
        hasher = hashlib.sha256()
        try:
            with open(filepath, "rb") as f:
                while chunk := f.read(8192):
                    hasher.update(chunk)
            return hasher.hexdigest()
        except Exception as e:
            # Log an error if hashing fails
            logger.error(f"Error hashing file {filepath}: {e}", exc_info=True)
            return "unknown"

    def bytes_to_mb(self, size_bytes: int) -> str:
        """Convert bytes to MB string."""
        return f"{size_bytes / 1024 / 1024:.2f} MB"

    def compress_file(self, input_path: str, compressed_path: str) -> dict:
        """Compress the input file and return statistics."""
        logger.info("Starting compression...")

        # Read input file
        try:
            with open(input_path, "rb") as f:
                original_data = f.read()
        except FileNotFoundError:
            logger.error(f"Input file not found: '{input_path}'", exc_info=True)
            raise FileNotFoundError(f"Input file '{input_path}' not found.")
        except Exception as e:
            logger.critical(f"Critical error reading input file: {e}", exc_info=True)
            raise Exception(f"Error reading input file: {e}")

        original_size = len(original_data)
        original_hash = hashlib.sha256(original_data).hexdigest()

        logger.info(f"Original file size: {self.bytes_to_mb(original_size)}")

        # Start memory monitoring
        mem_samples = []
        stop_flag = {"stop": False}
        memory_thread = threading.Thread(target=self.sample_memory, args=(mem_samples, stop_flag))
        memory_thread.daemon = True # Make thread a daemon so it doesn't block exit.
        memory_thread.start()

        # Compress data
        start_time = time.time()
        try:
            compressed_data = brotli.compress(original_data, quality=self.compression_level)
        except Exception as e:
            logger.critical(f"Brotli compression failed: {e}", exc_info=True)
            raise Exception(f"Brotli compression failed: {e}")
        end_time = time.time()

        # Stop memory monitoring
        stop_flag["stop"] = True
        memory_thread.join()

        # Save compressed file
        try:
            with open(compressed_path, "wb") as f:
                f.write(compressed_data)
        except Exception as e:
            logger.error(f"Error writing compressed file: {compressed_path}: {e}", exc_info=True)
            raise Exception(f"Error writing compressed file: {compressed_path}: {e}")


        # Calculate statistics
        compression_time = end_time - start_time
        compressed_size = len(compressed_data)
        compression_ratio = original_size / compressed_size if compressed_size > 0 else 1
        space_saved = original_size - compressed_size
        space_saved_percent = (space_saved / original_size * 100) if original_size > 0 else 0

        avg_memory = sum(mem_samples) / len(mem_samples) if mem_samples else 0
        peak_memory = max(mem_samples) if mem_samples else 0
        gb_seconds = (avg_memory / 1024) * compression_time
        throughput = (original_size / 1024 / 1024) / compression_time if compression_time > 0 else 0

        logger.debug(f"Compression stats calculated: {throughput=:.2f} MB/s, {peak_memory=:.2f} MB")

        return {
            "original_size": original_size,
            "compressed_size": compressed_size,
            "compression_time": compression_time,
            "compression_ratio": compression_ratio,
            "space_saved": space_saved,
            "space_saved_percent": space_saved_percent,
            "original_hash": original_hash,
            "avg_memory": avg_memory,
            "peak_memory": peak_memory,
            "gb_seconds": gb_seconds,
            "throughput": throughput
        }

    def decompress_file(self, compressed_path: str, decompressed_path: str, expected_hash: str) -> dict:
        """Decompress the compressed file and return statistics."""
        logger.info("Starting decompression...")

        # Read compressed file
        try:
            with open(compressed_path, "rb") as f:
                compressed_data = f.read()
        except FileNotFoundError:
            logger.error(f"Compressed file not found: '{compressed_path}'", exc_info=True)
            raise FileNotFoundError(f"Compressed file '{compressed_path}' not found.")
        except Exception as e:
            logger.critical(f"Critical error reading compressed file: {e}", exc_info=True)
            raise Exception(f"Error reading compressed file: {e}")

        # Start memory monitoring
        mem_samples = []
        stop_flag = {"stop": False}
        memory_thread = threading.Thread(target=self.sample_memory, args=(mem_samples, stop_flag))
        memory_thread.daemon = True # Make thread a daemon so it doesn't block exit.
        memory_thread.start()

        # Decompress data
        start_time = time.time()
        try:
            decompressed_data = brotli.decompress(compressed_data)
        except brotli.error as e:
            logger.error(f"Brotli decompression failed. Data may be corrupted: {e}", exc_info=True)
            raise brotli.error(f"Decompression failed: {e}")
        except Exception as e:
            logger.critical(f"Critical error during decompression: {e}", exc_info=True)
            raise Exception(f"Decompression failed: {e}")
        end_time = time.time()

        # Stop memory monitoring
        stop_flag["stop"] = True
        memory_thread.join()

        # Save decompressed file
        try:
            with open(decompressed_path, "wb") as f:
                f.write(decompressed_data)
        except Exception as e:
            logger.error(f"Error writing decompressed file: {decompressed_path}: {e}", exc_info=True)
            raise Exception(f"Error writing decompressed file: {decompressed_path}: {e}")

        # Calculate statistics
        decompressed_size = len(decompressed_data)
        decompression_time = end_time - start_time
        decompressed_hash = hashlib.sha256(decompressed_data).hexdigest()
        integrity_ok = decompressed_hash == expected_hash

        avg_memory = sum(mem_samples) / len(mem_samples) if mem_samples else 0
        peak_memory = max(mem_samples) if mem_samples else 0
        gb_seconds = (avg_memory / 1024) * decompression_time
        throughput = (decompressed_size / 1024 / 1024) / decompression_time if decompression_time > 0 else 0

        logger.debug(f"Decompression stats calculated: {throughput=:.2f} MB/s, {peak_memory=:.2f} MB")
        if not integrity_ok:
            logger.warning("Data integrity check failed! Hashes do not match.")

        return {
            "decompressed_size": decompressed_size,
            "decompression_time": decompression_time,
            "decompressed_hash": decompressed_hash,
            "integrity_ok": integrity_ok,
            "avg_memory": avg_memory,
            "peak_memory": peak_memory,
            "gb_seconds": gb_seconds,
            "throughput": throughput
        }

    def generate_report(self, compression_stats: dict, decompression_stats: dict, input_file: str, compressed_file: str, decompressed_file: str) -> str:
        """Generate comprehensive compression report."""
        report = "=" * 80 + "\n"
        report += "BROTLI FILE COMPRESSION REPORT\n"
        report += "=" * 80 + "\n"
        report += f"Input File: {input_file}\n"
        report += f"Compressed File: {compressed_file}\n"
        report += f"Decompressed File: {decompressed_file}\n"
        report += f"Compression Algorithm: Brotli (Level {self.compression_level})\n"
        report += f"Test Date: {time.strftime('%Y-%m-%d %H:%M:%S')}\n"
        report += "\n"

        # Original file information
        report += "=" * 50 + "\n"
        report += "ORIGINAL FILE INFORMATION\n"
        report += "=" * 50 + "\n"
        report += f"File size: {compression_stats['original_size']:,} bytes ({self.bytes_to_mb(compression_stats['original_size'])})\n"
        report += f"SHA256 hash: {compression_stats['original_hash']}\n"
        report += "\n"

        # Compression results
        report += "=" * 50 + "\n"
        report += "COMPRESSION RESULTS\n"
        report += "=" * 50 + "\n"
        report += f"Compression time: {compression_stats['compression_time']:.4f} seconds\n"
        report += f"Compressed size: {compression_stats['compressed_size']:,} bytes ({self.bytes_to_mb(compression_stats['compressed_size'])})\n"
        report += f"Compression ratio: {compression_stats['compression_ratio']:.2f}:1\n"
        report += f"Space saved: {compression_stats['space_saved']:,} bytes ({compression_stats['space_saved_percent']:.2f}%)\n"
        report += f"Compression speed: {compression_stats['throughput']:.2f} MB/s\n"
        report += "\n"

        # Compression memory usage
        report += "=== COMPRESSION MEMORY USAGE ===\n"
        report += f"Average memory: {compression_stats['avg_memory']:.2f} MB\n"
        report += f"Peak memory: {compression_stats['peak_memory']:.2f} MB\n"
        report += f"Memory efficiency: {compression_stats['gb_seconds']:.6f} GB·seconds\n"
        report += "\n"

        # Decompression results
        report += "=" * 50 + "\n"
        report += "DECOMPRESSION RESULTS\n"
        report += "=" * 50 + "\n"
        report += f"Decompression time: {decompression_stats['decompression_time']:.4f} seconds\n"
        report += f"Decompressed size: {decompression_stats['decompressed_size']:,} bytes ({self.bytes_to_mb(decompression_stats['decompressed_size'])})\n"
        report += f"Decompression speed: {decompression_stats['throughput']:.2f} MB/s\n"
        report += f"SHA256 hash: {decompression_stats['decompressed_hash']}\n"
        report += "\n"

        # Decompression memory usage
        report += "=== DECOMPRESSION MEMORY USAGE ===\n"
        report += f"Average memory: {decompression_stats['avg_memory']:.2f} MB\n"
        report += f"Peak memory: {decompression_stats['peak_memory']:.2f} MB\n"
        report += f"Memory efficiency: {decompression_stats['gb_seconds']:.6f} GB·seconds\n"
        report += "\n"

        # Data integrity check
        report += "=" * 50 + "\n"
        report += "DATA INTEGRITY VERIFICATION\n"
        report += "=" * 50 + "\n"
        if decompression_stats['integrity_ok']:
            report += "✅ PASSED: Original and decompressed files are identical\n"
        else:
            report += "❌ FAILED: Data corruption detected!\n"

        report += f"Original hash:     {compression_stats['original_hash']}\n"
        report += f"Decompressed hash: {decompression_stats['decompressed_hash']}\n"
        report += "\n"

        # Performance summary
        report += "=" * 80 + "\n"
        report += "PERFORMANCE SUMMARY\n"
        report += "=" * 80 + "\n"
        total_time = compression_stats['compression_time'] + decompression_stats['decompression_time']
        max_memory = max(compression_stats['peak_memory'], decompression_stats['peak_memory'])
        total_gb_seconds = compression_stats['gb_seconds'] + decompression_stats['gb_seconds']

        report += f"Total processing time: {total_time:.4f} seconds\n"
        report += f"Compression ratio: {compression_stats['compression_ratio']:.2f}:1\n"
        report += f"Space savings: {compression_stats['space_saved_percent']:.2f}%\n"
        report += f"Maximum memory usage: {max_memory:.2f} MB\n"
        report += f"Total memory efficiency: {total_gb_seconds:.6f} GB·seconds\n"
        report += f"Data integrity: {'✅ VERIFIED' if decompression_stats['integrity_ok'] else '❌ CORRUPTED'}\n"

        # Compression level analysis
        report += "\n"
        report += f"=== COMPRESSION LEVEL {self.compression_level} ANALYSIS ===\n"
        if self.compression_level <= 3:
            report += "• Focus: Speed optimized\n"
            report += "• Trade-off: Lower compression ratio for faster processing\n"
        elif self.compression_level <= 6:
            report += "• Focus: Balanced speed and compression\n"
            report += "• Trade-off: Good balance for general use\n"
        elif self.compression_level <= 9:
            report += "• Focus: Compression optimized\n"
            report += "• Trade-off: Better ratios with slower processing\n"
        else:
            report += "• Focus: Maximum compression\n"
            report += "• Trade-off: Best ratios but slowest processing\n"

        # File size categories
        report += "\n"
        report += "=== FILE SIZE ANALYSIS ===\n"
        size_mb = compression_stats['original_size'] / 1024 / 1024
        if size_mb < 1:
            report += "• Category: Small file (< 1 MB)\n"
            report += "• Note: Compression overhead may be relatively high\n"
        elif size_mb < 10:
            report += "• Category: Medium file (1-10 MB)\n"
            report += "• Note: Good balance of compression benefits\n"
        elif size_mb < 100:
            report += "• Category: Large file (10-100 MB)\n"
            report += "• Note: Excellent compression benefits\n"
        else:
            report += "• Category: Very large file (> 100 MB)\n"
            report += "• Note: Maximum compression benefits, consider memory usage\n"

        report += "\n"
        report += "=" * 80 + "\n"
        report += "COMPRESSION TEST COMPLETED SUCCESSFULLY\n"
        report += "=" * 80 + "\n"

        return report

    def run_compression_test(self, input_path: str, compressed_path: str, decompressed_path: str, report_path: str):
        """Run the complete compression test and generate report."""
        logger.info("Starting Brotli File Compression Test")
        logger.info(f"Input file: {input_path}")
        logger.info(f"Compression level: {self.compression_level}")
        logger.info("-" * 50)

        try:
            # Compression phase
            compression_stats = self.compress_file(input_path, compressed_path)
            logger.info("Compression complete!")
            logger.info(f"Ratio: {compression_stats['compression_ratio']:.2f}:1")
            logger.info(f"Space saved: {compression_stats['space_saved_percent']:.1f}%")
            logger.info(f"Speed: {compression_stats['throughput']:.1f} MB/s")

            # Decompression phase
            decompression_stats = self.decompress_file(compressed_path, decompressed_path, compression_stats['original_hash'])
            logger.info("Decompression complete!")
            logger.info(f"Speed: {decompression_stats['throughput']:.1f} MB/s")
            logger.info(f"Integrity: {'OK' if decompression_stats['integrity_ok'] else 'FAILED'}")

            # Generate and save report
            logger.info("Generating comprehensive report...")
            report = self.generate_report(compression_stats, decompression_stats, input_path, compressed_path, decompressed_path)

            with open(report_path, "w", encoding="utf-8") as f:
                f.write(report)

            logger.info("-" * 50)
            logger.info("Test completed successfully!")
            logger.info(f"Detailed report saved to: {report_path}")
            logger.info(f"Compressed file saved to: {compressed_path}")
            logger.info(f"Decompressed file saved to: {decompressed_path}")

            # Quick summary
            logger.info("\nQUICK SUMMARY:")
            logger.info(f"• Original size: {compression_stats['original_size']:,} bytes")
            logger.info(f"• Compressed size: {compression_stats['compressed_size']:,} bytes")
            logger.info(f"• Compression ratio: {compression_stats['compression_ratio']:.2f}:1")
            logger.info(f"• Space saved: {compression_stats['space_saved_percent']:.1f}%")
            logger.info(f"• Total time: {compression_stats['compression_time'] + decompression_stats['decompression_time']:.2f}s")
            return compression_stats
        except Exception as e:
            logger.critical(f"Test failed with a critical error: {e}", exc_info=True)
            raise

if __name__ == "__main__":
    # Wrap the entire main block in a try-except for final error catching
    try:
        # Initialize and run the compressor
        # For standalone testing, you can use these file paths
        # IMPORTANT: These files MUST exist for this script to run standalone
        INPUT_FILE = "reddit_comments.txt"
        COMPRESSED_FILE = "compressed_file.br"
        DECOMPRESSED_FILE = "decompressed_file.txt"
        REPORT_FILE = "compression_report.txt"

        compressor = BrotliFileCompressor(compression_level=COMPRESSION_LEVEL)
        compressor.run_compression_test(INPUT_FILE, COMPRESSED_FILE, DECOMPRESSED_FILE, REPORT_FILE)
    except Exception as e:
        logger.critical(f"An unhandled exception occurred in the main execution block: {e}", exc_info=True)