// Claude Code statusLine: reads session JSON on stdin, records rate-limit usage for the boss.
// Writes coord/usage.json { five_hour, seven_day, at } and prints "5h 42% | week 61%".
const fs = require('fs');
const path = require('path');

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let five = null, week = null;
  try {
    const j = JSON.parse(raw);
    const rl = j.rate_limits || {};
    five = rl.five_hour?.used_percentage ?? null;
    week = rl.seven_day?.used_percentage ?? null;
  } catch {}
  const fmt = (v) => (typeof v === 'number' ? `${Math.round(v)}%` : '?');
  try {
    fs.writeFileSync(
      path.join(__dirname, 'usage.json'),
      JSON.stringify({ five_hour: five, seven_day: week, at: new Date().toISOString() }, null, 2)
    );
  } catch {}
  process.stdout.write(`5h ${fmt(five)} | week ${fmt(week)}`);
});
