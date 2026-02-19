const fs = require('fs');
const path = process.argv[2] || 'scripts/oxygen-embabi-store-log-export-2026-02-18T18-53-57.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const byFunction = {};
data.forEach((entry) => {
  const fn = entry.function || 'unknown';
  byFunction[fn] = (byFunction[fn] || 0) + 1;
});
const sorted = Object.entries(byFunction).sort((a, b) => b[1] - a[1]);
console.log('Route/Function | Count (1h sample)\n' + sorted.map(([k, v]) => k + ' | ' + v).join('\n'));
