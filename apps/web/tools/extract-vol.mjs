// Extract inline <svg> assets from a SPLOTCH design catalog (.dc.html) into
// individually named .svg files, using a slug map keyed by document order.
//   node tools/extract-vol.mjs <catalog.dc.html> <outDir> <mapJson>
// mapJson: { "1": "skin-plain", "2": "skin-plain-card", ... } (index -> slug)
import fs from "fs";

const [, , src, outDir, mapJson] = process.argv;
const html = fs.readFileSync(src, "utf8");
const map = JSON.parse(mapJson);
fs.mkdirSync(outDir, { recursive: true });

const svgs = html.match(/<svg[\s\S]*?<\/svg>/g) || [];
let written = 0;
svgs.forEach((svg, i) => {
  const slug = map[String(i)];
  if (!slug) return; // only export mapped indices
  const out = svg.startsWith("<svg xmlns")
    ? svg
    : svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  fs.writeFileSync(`${outDir}/${slug}.svg`, out);
  written++;
});
console.log(`extracted ${written}/${svgs.length} svgs -> ${outDir}`);
