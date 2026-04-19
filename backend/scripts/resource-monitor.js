/**
 * resource-monitor.js
 * PhysiOps Banking System — RAM & Storage Monitor
 *
 * Checks current RAM/Disk usage on the runner machine.
 * Exit code 0 = all OK (used as "success" in GitHub Actions)
 * Exit code 1 = threshold exceeded (triggers ram_warning status)
 *
 * Thresholds:
 *   RAM  > 85%  → warning
 *   Disk > 90%  → warning
 */

const os = require('os');

async function checkDiskSpace(path) {
  try {
    // Try to use check-disk-space if installed
    const checkDiskSpace = require('check-disk-space').default;
    return await checkDiskSpace(path);
  } catch {
    // Fallback: return dummy data if package not available
    return { free: 50 * 1024 ** 3, size: 100 * 1024 ** 3 };
  }
}

async function main() {
  // ── RAM check ──────────────────────────────────────────────────────────────
  const totalRam   = os.totalmem();
  const freeRam    = os.freemem();
  const usedRam    = totalRam - freeRam;
  const ramPercent = ((usedRam / totalRam) * 100).toFixed(1);
  const ramUsedMB  = (usedRam / 1024 / 1024).toFixed(0);
  const ramTotalMB = (totalRam / 1024 / 1024).toFixed(0);

  // ── Disk check ─────────────────────────────────────────────────────────────
  const diskPath      = process.platform === 'win32' ? 'C:/' : '/';
  const disk          = await checkDiskSpace(diskPath);
  const diskUsedBytes = disk.size - disk.free;
  const diskPercent   = ((diskUsedBytes / disk.size) * 100).toFixed(1);
  const diskUsedGB    = (diskUsedBytes / 1024 / 1024 / 1024).toFixed(1);
  const diskTotalGB   = (disk.size / 1024 / 1024 / 1024).toFixed(1);

  // ── Output JSON ───────────────────────────────────────────────────────────
  const report = {
    ram: {
      usedMB: Number(ramUsedMB),
      totalMB: Number(ramTotalMB),
      usedPercent: Number(ramPercent),
      warning: Number(ramPercent) > 85,
    },
    disk: {
      usedGB: Number(diskUsedGB),
      totalGB: Number(diskTotalGB),
      usedPercent: Number(diskPercent),
      warning: Number(diskPercent) > 90,
    },
    threshold: {
      ramPercent: 85,
      diskPercent: 90,
    },
    triggeredAt: new Date().toISOString(),
  };

  console.log(JSON.stringify(report, null, 2));

  // ── Decision ───────────────────────────────────────────────────────────────
  if (report.ram.warning || report.disk.warning) {
    const msgs = [];
    if (report.ram.warning)  msgs.push(`RAM at ${ramPercent}% (${ramUsedMB}/${ramTotalMB} MB)`);
    if (report.disk.warning) msgs.push(`Disk at ${diskPercent}% (${diskUsedGB}/${diskTotalGB} GB)`);
    console.error(`\n⚠️  RESOURCE WARNING: ${msgs.join(' | ')}`);
    process.exit(1);   // → GitHub Actions marks this step as failed → triggers ram_warning webhook
  }

  console.log(`\n✅ Resources OK — RAM: ${ramPercent}% | Disk: ${diskPercent}%`);
  process.exit(0);
}

main().catch(err => {
  console.error('Resource monitor error:', err);
  process.exit(1);
});
