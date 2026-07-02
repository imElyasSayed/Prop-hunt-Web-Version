import { NodeIO } from '@gltf-transform/core';
import fs from 'fs';
const io = new NodeIO();
const dir = 'public/models';
for (const f of fs.readdirSync(dir).filter(f=>f.endsWith('.glb')).sort()) {
  const doc = await io.read(`${dir}/${f}`);
  const root = doc.getRoot();
  // compute world bbox over all mesh primitive POSITION accessors with node transforms
  let min=[Infinity,Infinity,Infinity], max=[-Infinity,-Infinity,-Infinity];
  const mul = (m,v)=>[
    m[0]*v[0]+m[4]*v[1]+m[8]*v[2]+m[12],
    m[1]*v[0]+m[5]*v[1]+m[9]*v[2]+m[13],
    m[2]*v[0]+m[6]*v[1]+m[10]*v[2]+m[14],
  ];
  const walk=(node)=>{
    const wm = node.getWorldMatrix();
    const mesh = node.getMesh();
    if (mesh) for (const p of mesh.listPrimitives()){
      const pos=p.getAttribute('POSITION'); if(!pos) continue;
      for(let i=0;i<pos.getCount();i++){const v=[]; pos.getElement(i,v); const w=mul(wm,v);
        for(let k=0;k<3;k++){min[k]=Math.min(min[k],w[k]);max[k]=Math.max(max[k],w[k]);}}
    }
    node.listChildren().forEach(walk);
  };
  root.listScenes()[0].listChildren().forEach(walk);
  const size=[0,1,2].map(k=>+(max[k]-min[k]).toFixed(2));
  const ctr=[0,1,2].map(k=>+((max[k]+min[k])/2).toFixed(2));
  let tris=0; for(const m of root.listMeshes()) for(const p of m.listPrimitives()){const idx=p.getIndices(); tris+= idx? idx.getCount()/3 : (p.getAttribute('POSITION')?.getCount()||0)/3;}
  console.log(f.padEnd(18), 'W×H×D', size.join(' × ').padEnd(22), 'baseY', min[1].toFixed(2).padStart(6), 'ctrXZ', `${ctr[0]},${ctr[2]}`.padEnd(10), 'tris', Math.round(tris));
}
