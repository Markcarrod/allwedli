const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const root = __dirname;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
function api(req, res) {
  const q = url.parse(req.url, true).query;
  if (q.course) {
    const file = path.join(root, `${q.course}_mcq.txt`);
    if (!fs.existsSync(file)) return send(res, 404, { error: 'Course not found' });
    const rows = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean);
    const buckets = {};
    rows.forEach((line, index) => {
      const p = line.split('|'); if (p.length < 7) return;
      const section = p[0].trim();
      (buckets[section] ||= []).push({ id: `${q.course}-${index}`, section, question: p[1], options: p.slice(2, 6), answer: p[6].replace(/^Option\s*/i, '').trim(), explanation: p[7] || '' });
    });
    const sections = Object.keys(buckets).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const used = new Set(String(q.used || '').split(',').filter(Boolean));
    const selected = [];
    sections.forEach(section => {
      const bucket = buckets[section].filter(x => !used.has(x.id));
      if (bucket.length) selected.push(shuffle(bucket)[0]);
    });
    while (selected.length < 60) {
      const all = sections.flatMap(s => buckets[s]).filter(x => !selected.some(y => y.id === x.id) && !used.has(x.id));
      if (!all.length) break;
      selected.push(shuffle(all)[0]);
    }
    if (selected.length < 60) return send(res, 200, { exhausted: true, total: rows.length, sections, questions: [] });
    return send(res, 200, { course: q.course, total: rows.length, sections, questions: shuffle(selected).slice(0, 60) });
  }
  if (q.meta !== undefined) {
    const courses = fs.readdirSync(root).filter(x => x.endsWith('_mcq.txt')).map(x => x.replace('_mcq.txt', '')).sort();
    return send(res, 200, { courses });
  }
  send(res, 404, { error: 'Use ?meta=1 or ?course=course_name' });
}
function shuffle(a) { return [...a].sort(() => Math.random() - 0.5); }
function send(res, status, data) { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); }
const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) return api(req, res);
  let file = req.url === '/' ? '/index.html' : req.url;
  file = path.join(root, 'public', file.replace(/^\//, ''));
  if (!fs.existsSync(file)) file = path.join(root, 'public', 'index.html');
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'text/plain' }); fs.createReadStream(file).pipe(res);
});
server.listen(process.env.PORT || 3000, () => console.log('Quiz app running on http://localhost:' + (process.env.PORT || 3000)));
