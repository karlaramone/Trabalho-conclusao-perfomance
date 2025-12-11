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

function extractMetrics(summary) {
  const metrics = {
    p95: 0, p90: 0, avg: 0, min: 0, max: 0,
    checks_passed: 0, checks_failed: 0,
    http_reqs: 0, iterations: 0,
    data_sent: 0, data_received: 0,
    status: 'FAILED'
  };

  try {
    const httpReqDuration = summary.metrics?.['http_req_duration{expected_response:true}'] || summary.metrics?.['http_req_duration'];
    if (httpReqDuration) {
      metrics.p95 = Math.round(httpReqDuration['p(95)'] || 0);
      metrics.p90 = Math.round(httpReqDuration['p(90)'] || 0);
      metrics.avg = Math.round(httpReqDuration.avg || 0);
      metrics.min = Math.round(httpReqDuration.min || 0);
      metrics.max = Math.round(httpReqDuration.max || 0);
    }

    const checks = summary.metrics?.checks;
    if (checks) {
      metrics.checks_passed = checks.passes || 0;
      metrics.checks_failed = checks.fails || 0;
    }

    const httpReqs = summary.metrics?.http_reqs;
    if (httpReqs) metrics.http_reqs = httpReqs.count || 0;

    const iterations = summary.metrics?.iterations;
    if (iterations) metrics.iterations = iterations.count || 0;

    const dataSent = summary.metrics?.data_sent;
    if (dataSent) metrics.data_sent = Math.round((dataSent.count || 0) / 1024);

    const dataReceived = summary.metrics?.data_received;
    if (dataReceived) metrics.data_received = Math.round((dataReceived.count || 0) / 1024);

    metrics.status = metrics.checks_failed === 0 ? 'PASSED' : 'FAILED';
  } catch (e) {
    console.error('Error extracting metrics:', e);
  }

  return metrics;
}

const metrics = extractMetrics(summary);

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>K6 Performance Report</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; }
    .status-badge { display: inline-block; padding: 10px 20px; border-radius: 50px; font-weight: bold; margin-top: 15px; font-size: 1.1em; }
    .status-badge.passed { background: #4caf50; color: white; }
    .status-badge.failed { background: #f44336; color: white; }
    .content { padding: 40px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px; }
    .metric-card { background: #f5f5f5; border-left: 5px solid #667eea; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .metric-card h3 { color: #666; font-size: 0.9em; text-transform: uppercase; margin-bottom: 10px; }
    .metric-card .value { font-size: 2em; font-weight: bold; color: #667eea; }
    .metric-card.checks-passed { border-left-color: #4caf50; }
    .metric-card.checks-failed { border-left-color: #f44336; }
    .charts-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 30px; margin-bottom: 40px; }
    .chart-wrapper { background: #f9f9f9; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .chart-wrapper h3 { color: #333; margin-bottom: 20px; text-align: center; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 0.9em; }
    .threshold-status { margin-top: 10px; padding: 10px; border-radius: 4px; font-weight: bold; }
    .threshold-pass { background: #c8e6c9; color: #2e7d32; }
    .threshold-fail { background: #ffcdd2; color: #c62828; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>��� K6 Performance Test Report</h1>
      <p>Teste de Performance - API Checkout</p>
      <span class="status-badge ${metrics.status === 'PASSED' ? 'passed' : 'failed'}">${metrics.status === 'PASSED' ? '✓ PASSED' : '✗ FAILED'}</span>
    </div>
    <div class="content">
      <h2 style="margin-bottom: 30px; color: #333;">��� Métricas Principais</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <h3>P95 Latência</h3>
          <div class="value">${metrics.p95}ms</div>
          <div class="threshold-status ${metrics.p95 < 2000 ? 'threshold-pass' : 'threshold-fail'}">${metrics.p95 < 2000 ? '✓ Dentro do limite' : '✗ Acima do limite'}</div>
        </div>
        <div class="metric-card"><h3>P90 Latência</h3><div class="value">${metrics.p90}ms</div></div>
        <div class="metric-card"><h3>Latência Média</h3><div class="value">${metrics.avg}ms</div></div>
        <div class="metric-card"><h3>Tempo Máximo</h3><div class="value">${metrics.max}ms</div></div>
        <div class="metric-card checks-passed"><h3>✓ Checks Passaram</h3><div class="value">${metrics.checks_passed}</div></div>
        <div class="metric-card ${metrics.checks_failed > 0 ? 'checks-failed' : ''}"><h3>✗ Checks Falharam</h3><div class="value">${metrics.checks_failed}</div></div>
        <div class="metric-card"><h3>Total de Requests</h3><div class="value">${metrics.http_reqs}</div></div>
        <div class="metric-card"><h3>Total de Iterações</h3><div class="value">${metrics.iterations}</div></div>
        <div class="metric-card"><h3>Dados Enviados</h3><div class="value">${metrics.data_sent} KB</div></div>
        <div class="metric-card"><h3>Dados Recebidos</h3><div class="value">${metrics.data_received} KB</div></div>
      </div>
      <div class="charts-container">
        <div class="chart-wrapper"><h3>Distribuição de Latência</h3><canvas id="latencyChart"></canvas></div>
        <div class="chart-wrapper"><h3>Status dos Checks</h3><canvas id="checksChart"></canvas></div>
      </div>
      <script>
        new Chart(document.getElementById('latencyChart').getContext('2d'), {
          type: 'bar', data: { labels: ['Min', 'P90', 'Média', 'P95', 'Max'], datasets: [{ label: 'Latência (ms)', data: [${metrics.min}, ${metrics.p90}, ${metrics.avg}, ${metrics.p95}, ${metrics.max}], backgroundColor: '#667eea', borderColor: '#764ba2', borderWidth: 2 }] }, options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
        new Chart(document.getElementById('checksChart').getContext('2d'), {
          type: 'doughnut', data: { labels: ['Passaram', 'Falharam'], datasets: [{ data: [${metrics.checks_passed}, ${metrics.checks_failed}], backgroundColor: ['#4caf50', '#f44336'], borderColor: ['#2e7d32', '#c62828'], borderWidth: 2 }] }, options: { responsive: true }
        });
      </script>
    </div>
    <div class="footer"><p>Relatório gerado automaticamente pelo K6 • ${new Date().toLocaleString('pt-BR')}</p></div>
  </div>
</body>
</html>`;

const outDir = path.dirname(outPath);
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, html, 'utf8');
console.log('Report written to', outPath);
