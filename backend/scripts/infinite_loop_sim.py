"""
infinite_loop_sim.py — Continuous RAM Stress Generator
IMPORTANT:
- Ye script 85% pe stop nahi karegi
- Ye continuously RAM allocate karegi
- Workflow / monitor parallel me RAM check karega
- Jab workflow detect karega ki threshold hit ho gaya, tab workflow process kill karega

Usage:
    python infinite_loop_sim.py
    python infinite_loop_sim.py --seconds 60 --chunk-mb 20
"""

import time
import sys
import argparse
import psutil

parser = argparse.ArgumentParser()
parser.add_argument('--seconds', type=int, default=60,
                    help='Kitne seconds tak stress run karna hai (default: 60)')
parser.add_argument('--chunk-mb', type=int, default=20,
                    help='Har step mein kitna MB allocate karein (default: 20)')
args = parser.parse_args()

print(f"[RAM Stress] Starting continuous RAM stress...")
print(f"[RAM Stress] Duration: {args.seconds}s")
print(f"[RAM Stress] Chunk size: {args.chunk_mb} MB")
print(f"[RAM Stress] Ctrl+C se band karo\n")

memory_hog = []
chunk_size = args.chunk_mb * 1024 * 1024
start_time = time.time()
step = 0
peak_ram = 0.0

try:
    while True:
        elapsed = time.time() - start_time
        if elapsed >= args.seconds:
            print(f"[RAM Stress] ⏰ Time limit reached ({args.seconds}s).")
            break

        current_ram = psutil.virtual_memory().percent
        peak_ram = max(peak_ram, current_ram)

        try:
            chunk = bytearray(chunk_size)
            memory_hog.append(chunk)
            step += 1
            total_mb = step * args.chunk_mb
            print(f"[RAM Stress] Step {step:3d}: {total_mb:5d} MB | RAM: {current_ram:.1f}% | {elapsed:.1f}s")
        except MemoryError:
            print("[RAM Stress] ⚠️ MemoryError reached. Holding current memory until process is killed or timeout.")
            while (time.time() - start_time) < args.seconds:
                current_ram = psutil.virtual_memory().percent
                peak_ram = max(peak_ram, current_ram)
                print(f"[RAM Stress] Holding... RAM: {current_ram:.1f}%")
                time.sleep(1)
            break

        time.sleep(0.3)

except KeyboardInterrupt:
    print("\n[RAM Stress] Ctrl+C pressed — stopping.")

finally:
    final_ram = psutil.virtual_memory().percent
    peak_ram = max(peak_ram, final_ram)

    print(f"\n[RAM Stress] Peak RAM observed: ~{peak_ram:.1f}%")
    print("[RAM Stress] Releasing allocated memory...")
    memory_hog.clear()
    time.sleep(2)
    released_ram = psutil.virtual_memory().percent
    print(f"[RAM Stress] Done. RAM released. Current RAM: {released_ram:.1f}%")
    sys.exit(0)
