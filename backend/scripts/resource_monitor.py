#!/usr/bin/env python3
"""
resource_monitor.py — PhysiOps Banking System
Uses psutil to check actual RAM and Disk usage on the self-hosted runner (your PC).

Exit codes:
  0 = Resources within limits  (GitHub Actions: step SUCCESS → build_success webhook)
  1 = Threshold exceeded        (GitHub Actions: step FAILURE → ram_warning webhook)

Thresholds:
  RAM  > 85%  → warning
  Disk > 90%  → warning
"""

import os
import sys
import json
import psutil

# ── Thresholds ────────────────────────────────────────────────────────────────
RAM_THRESHOLD_PERCENT  = 85.0
DISK_THRESHOLD_PERCENT = 90.0

# ── RAM ───────────────────────────────────────────────────────────────────────
ram = psutil.virtual_memory()
ram_used_gb  = round(ram.used  / (1024 ** 3), 2)
ram_total_gb = round(ram.total / (1024 ** 3), 2)
ram_percent  = round(ram.percent, 1)

# ── Disk ──────────────────────────────────────────────────────────────────────
# Use C:/ on Windows, / on Linux
disk_path = "C:\\" if sys.platform == "win32" else "/"
disk = psutil.disk_usage(disk_path)
disk_used_gb  = round(disk.used  / (1024 ** 3), 1)
disk_total_gb = round(disk.total / (1024 ** 3), 1)
disk_percent  = round(disk.percent, 1)

# ── Report ────────────────────────────────────────────────────────────────────
report = {
    "ram": {
        "usedGB":   ram_used_gb,
        "totalGB":  ram_total_gb,
        "percent":  ram_percent,
        "warning":  ram_percent > RAM_THRESHOLD_PERCENT,
    },
    "disk": {
        "usedGB":   disk_used_gb,
        "totalGB":  disk_total_gb,
        "percent":  disk_percent,
        "warning":  disk_percent > DISK_THRESHOLD_PERCENT,
    },
    "thresholds": {
        "ramPercent":  RAM_THRESHOLD_PERCENT,
        "diskPercent": DISK_THRESHOLD_PERCENT,
    },
}

print(json.dumps(report, indent=2))

# ── Decision ──────────────────────────────────────────────────────────────────
warnings = []
if report["ram"]["warning"]:
    warnings.append(f"RAM at {ram_percent}% ({ram_used_gb}/{ram_total_gb} GB)")
if report["disk"]["warning"]:
    warnings.append(f"Disk at {disk_percent}% ({disk_used_gb}/{disk_total_gb} GB)")

if warnings:
    if "GITHUB_OUTPUT" in os.environ:
        with open(os.environ["GITHUB_OUTPUT"], "a") as f:
            f.write(f"ram_percent={int(ram_percent)}\n")
    print(f"\n[WARNING] Resource threshold exceeded: {' | '.join(warnings)}", file=sys.stderr)
    print("[WARNING] Possible infinite loop or resource leak in this build!", file=sys.stderr)
    sys.exit(1)

if "GITHUB_OUTPUT" in os.environ:
    with open(os.environ["GITHUB_OUTPUT"], "a") as f:
        f.write(f"ram_percent={int(ram_percent)}\n")

print(f"\n[OK] RAM: {ram_percent}% | Disk: {disk_percent}% — within limits.")
sys.exit(0)
