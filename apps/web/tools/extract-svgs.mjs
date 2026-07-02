import fs from 'fs';
const html = fs.readFileSync('../../art2/SPLOTCH Asset Pack.dc.html','utf8');
// Grab each <figure>/<div class="card"> ... <svg>...</svg> ... <label/caption>
const svgRe = /<svg[\s\S]*?<\/svg>/g;
const svgs = html.match(svgRe) || [];
// Find a nearby label: look at ~400 chars after each svg for a bold/caption word
let idx = 0; const manifest = [];
let pos = 0;
for (const svg of svgs) {
  const at = html.indexOf(svg, pos); pos = at + svg.length;
  const after = html.slice(pos, pos+500).replace(/<[^>]+>/g,' ');
  const before = html.slice(Math.max(0,at-300), at).replace(/<[^>]+>/g,' ');
  const label = (after.match(/[A-Z][A-Za-z0-9 &"'-]{2,30}/) || before.match(/[A-Z][A-Za-z0-9 &"'-]{2,30}\s*$/) || [`asset`])[0].trim();
  const vb = (svg.match(/viewBox="([^"]+)"/)||[])[1] || '';
  const tint = /currentColor/.test(svg);
  const slug = `${String(idx).padStart(2,'0')}-${label.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,24)||'asset'}`;
  fs.writeFileSync(`public/art/${slug}.svg`, svg.startsWith('<svg xmlns')?svg:svg.replace('<svg','<svg xmlns="http://www.w3.org/2000/svg"'));
  manifest.push({slug,label,viewBox:vb,tint});
  idx++;
}
console.log('extracted',svgs.length,'svgs');
for (const m of manifest) console.log(m.slug.padEnd(30), 'vb:'+(m.viewBox||'-').padEnd(16), m.tint?'TINT':'    ', m.label);
