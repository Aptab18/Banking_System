"""
infinite_loop_sim.py — RAM Consumer with Safety Cap
Simulates an infinite loop that consumes RAM.
Automatically stops when RAM exceeds --max-percent (default: 90%).
This prevents PC crash while still triggering the ESP32 buzzer alert.

Usage: python infinite_loop_sim.py
       python infinite_loop_sim.py --max-percent 92 --seconds 60
"""

import time
import sys
import argparse
import psutil

parser = argparse.ArgumentParser()
parser.add_argument('--max-percent', type=float, default=90.0,
                    help='RAM % pe cap — iske upar nahi jaega (default: 90)')
parser.add_argument('--seconds', type=int, default=0,
                    help='Kitne seconds baad stop karo (0 = jab tak RAM cap na ho)')
parser.add_argument('--chunk-mb', type=int, default=50,
                    help='Har step mein kitna MB allocate karein (default: 50)')
args = parser.parse_args()

print(f"[RAM Stress] Starting...")
print(f"[RAM Stress] Safety cap: {args.max_percent}% — iske upar kabhi nahi jaega")
print(f"[RAM Stress] Ctrl+C se band karo\n")

memory_hog = []
chunk_size  = args.chunk_mb * 1024 * 1024
start_time  = time.time()
step        = 0

try:
    while True:
        # ── Safety Check PEHLE ──────────────────────────────────────────────────
        current_ram = psutil.virtual_memory().percent
        if current_ram >= args.max_percent:
            print(f"[RAM Stress] 🛑 Safety cap reached! RAM: {current_ram}% >= {args.max_percent}%")
            print(f"[RAM Stress] ✅ Stopping allocation — PC safe hai!")
            break

        # ── Time limit check ────────────────────────────────────────────────────
        if args.seconds > 0:
            elapsed = time.time() - start_time
            if elapsed >= args.seconds:
                print(f"[RAM Stress] ⏰ {args.seconds}s time limit reached — stopping.")
                break

        # ── Allocate one chunk ──────────────────────────────────────────────────
        # Check if next chunk would exceed cap
        ram = psutil.virtual_memory()
        next_usage = ((ram.used + chunk_size) / ram.total) * 100
        if next_usage >= args.max_percent:
            print(f"[RAM Stress] 🛑 Next chunk would exceed cap ({next_usage:.1f}%) — stopping safely.")
            break

        chunk = bytearray(chunk_size)
        memory_hog.append(chunk)
        step += 1
        total_mb = step * args.chunk_mb
        elapsed  = time.time() - start_time
        print(f"[RAM Stress] Step {step:3d}: {total_mb:5d} MB | RAM: {current_ram:.1f}% | {elapsed:.1f}s")
        time.sleep(0.5)

except KeyboardInterrupt:
    print("\n[RAM Stress] Ctrl+C pressed — stopping.")

finally:
    final_ram = psutil.virtual_memory().percent
    print(f"\n[RAM Stress] Peak RAM reached: ~{final_ram:.1f}%")
    print("[RAM Stress] Releasing allocated memory...")
    memory_hog.clear()
    print("[RAM Stress] Done. RAM released.")
    sys.exit(0)
