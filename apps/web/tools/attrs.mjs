import { NodeIO } from '@gltf-transform/core';
import fs from 'fs';
const io = new NodeIO();
for (const f of ['blob_player.glb','blob_hunter.glb','crate_large.glb','plant_pot.glb']) {
  const doc = await io.read(`public/models/${f}`);
  const root = doc.getRoot();
  const meshes = root.listMeshes();
  const parts = [];
  for (const m of meshes) for (const p of m.listPrimitives()) {
    const attrs = p.listSemantics();
    const mat = p.getMaterial();
    const bc = mat?.getBaseColorFactor();
    parts.push(`{attrs:[${attrs.join(',')}] mat:${mat?.getName()||'-'} color:${bc?bc.slice(0,3).map(v=>v.toFixed(2)).join(','):'-'}}`);
  }
  console.log(f.padEnd(18), 'meshes:'+meshes.length, parts.join(' '));
}
