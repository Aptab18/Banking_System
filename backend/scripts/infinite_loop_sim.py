"""
infinite_loop_sim.py — RAM Consumer with Safety Cap + HOLD MODE
Simulates RAM stress safely for CI/demo use.

NEW BEHAVIOR:
- RAM target hit hote hi immediately stop nahi karega
- Target hit hone ke baad memory HOLD karega for --seconds duration
- Workflow ko time milega current high RAM detect karne ka
- Phir memory release hogi

Usage:
    python infinite_loop_sim.py
    python infinite_loop_sim.py --max-percent 85 --seconds 30 --chunk-mb 50
"""

import time
import sys
import argparse
import psutil

parser = argparse.ArgumentParser()
parser.add_argument('--max-percent', type=float, default=85.0,
                    help='Target RAM %% (default: 85)')
parser.add_argument('--seconds', type=int, default=30,
                    help='Target hit hone ke baad kitne seconds RAM hold karni hai (default: 30)')
parser.add_argument('--chunk-mb', type=int, default=50,
                    help='Har step mein kitna MB allocate karein (default: 50)')
args = parser.parse_args()

print(f"[RAM Stress] Starting...")
print(f"[RAM Stress] Target RAM: {args.max_percent}%")
print(f"[RAM Stress] Hold after target: {args.seconds}s")
print(f"[RAM Stress] Ctrl+C se band karo\n")

memory_hog = []
chunk_size = args.chunk_mb * 1024 * 1024
start_time = time.time()
step = 0
target_reached = False
peak_ram = 0.0

try:
    # Phase 1: Increase RAM until target is reached
    while True:
        current_ram = psutil.virtual_memory().percent
        peak_ram = max(peak_ram, current_ram)

        # If target reached, stop allocating but KEEP memory alive
        if current_ram >= args.max_percent:
            print(f"[RAM Stress] 🎯 Target reached! RAM: {current_ram:.1f}% >= {args.max_percent}%")
            print(f"[RAM Stress] Holding allocated memory for {args.seconds}s so CI can detect high RAM...")
            target_reached = True
            break

        # Allocate one chunk
        try:
            chunk = bytearray(chunk_size)
            memory_hog.append(chunk)
            step += 1
            total_mb = step * args.chunk_mb
            elapsed = time.time() - start_time
            print(f"[RAM Stress] Step {step:3d}: {total_mb:5d} MB | RAM: {current_ram:.1f}% | {elapsed:.1f}s")
        except MemoryError:
            print("[RAM Stress] ⚠️ MemoryError while allocating. Holding current memory.")
            target_reached = True
            break

        time.sleep(0.5)

    # Phase 2: Hold memory so workflow can inspect actual high RAM
    hold_start = time.time()
    while time.time() - hold_start < args.seconds:
        current_ram = psutil.virtual_memory().percent
        peak_ram = max(peak_ram, current_ram)
        remaining = args.seconds - int(time.time() - hold_start)
        print(f"[RAM Stress] Holding... RAM: {current_ram:.1f}% | {remaining}s left")
        time.sleep(1)

except KeyboardInterrupt:
    print("\n[RAM Stress] Ctrl+C pressed — stopping.")

finally:
    final_ram = psutil.virtual_memory().percent
    peak_ram = max(peak_ram, final_ram)

    print(f"\n[RAM Stress] Peak RAM observed: ~{peak_ram:.1f}%")
    print("[RAM Stress] Releasing allocated memory...")
    memory_hog.clear()

    # Small pause to let OS reclaim memory
    time.sleep(2)

    released_ram = psutil.virtual_memory().percent
    print(f"[RAM Stress] Done. RAM released. Current RAM: {released_ram:.1f}%")
    sys.exit(0)
