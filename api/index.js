const fs = require('fs');
const path = require('path');
module.exports = (req, res) => {
  const q = req.query || {};
  if (q.meta !== undefined) return res.json({ courses: fs.readdirSync(process.cwd()).filter(x => x.endsWith('_mcq.txt')).map(x => x.replace('_mcq.txt', '')).sort() });
  if (!q.course) return res.status(400).json({ error: 'Missing course' });
  const file = path.join(process.cwd(), `${q.course}_mcq.txt`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Course not found' });
  const buckets = {};
  fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).forEach((line, index) => { const p=line.split('|'); if(p.length<7)return; (buckets[p[0]] ||= []).push({id:`${q.course}-${index}`,section:p[0],question:p[1],options:p.slice(2,6),answer:p[6].replace(/^Option\s*/i,'').trim(),explanation:p[7]||''}); });
  const sections=Object.keys(buckets).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})); const used=new Set(String(q.used||'').split(',').filter(Boolean)); const out=[];
  const pick=a=>a.filter(x=>!used.has(x.id)&&!out.some(y=>y.id===x.id)).sort(()=>Math.random()-.5)[0];
  sections.forEach(s=>{const x=pick(buckets[s]);if(x)out.push(x)}); while(out.length<60){const x=pick(sections.flatMap(s=>buckets[s]));if(!x)break;out.push(x)}
  res.setHeader('Cache-Control','no-store'); res.json({course:q.course,total:fs.readFileSync(file,'utf8').split(/\r?\n/).filter(Boolean).length,sections,questions:out.length===60?out.sort(()=>Math.random()-.5):[],exhausted:out.length<60});
};
