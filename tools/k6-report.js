const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node tools/k6-report.js <summary.json> <out.html>');
  process.exit(1);
}

const [summaryPath, outPath] = args;
if (!fs.existsSync(summaryPath)) {
  console.error('Summary file not found:', summaryPath);
  process.exit(2);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

function findP95(summary) {
  try {
    const metric = summary.metrics && (summary.metrics.http_req_duration || summary.metrics['http_req_duration']);
    if (metric) {
      if (metric.values && metric.values['p(95)'] !== undefined) return metric.values['p(95)'];
      if (metric['p(95)'] !== undefined) return metric['p(95)'];
      if (metric.ko && metric.ko['p(95)'] !== undefined) return metric.ko['p(95)'];
    }
  } catch (e) {}
  return null;
}

function findChecks(summary) {
  try {
    if (summary.metrics && (summary.metrics.checks || summary.metrics['checks'])) {
      const c = summary.metrics.checks;
      return { passes: c.passes || c['passes'] || 0, fails: c.fails || c['fails'] || 0 };
    }
    if (summary.checks) {
      return { passes: summary.checks.passes || 0, fails: summary.checks.fails || 0 };
    }
  } catch (e) {}
  return null;
}

const p95 = findP95(summary);
const checks = findChecks(summary);

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>K6 Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; }
    pre { background:#f6f8fa; padding:12px; border-radius:6px; overflow:auto }
    .metric { margin-bottom:12px }
    .ok { color: green }
    .bad { color: red }
  </style>
</head>
<body>
  <h1>K6 Summary Report</h1>
  <div class="metric"><strong>HTTP req p(95):</strong> ${p95 !== null ? p95 + ' ms' : 'N/A'}</div>
  <div class="metric"><strong>Checks:</strong> ${checks ? `${checks.passes} passed, ${checks.fails} failed` : 'N/A'}</div>
  <h2>Full Summary JSON</h2>
  <pre>${JSON.stringify(summary, null, 2)}</pre>
</body>
</html>`;

const outDir = path.dirname(outPath);
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, html, 'utf8');
console.log('Report written to', outPath);
