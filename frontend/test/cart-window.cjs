const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const code=ts.transpileModule(fs.readFileSync('frontend/src/components/cart/windowGeometry.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exportsObject={}; vm.runInNewContext(code,{exports:exportsObject});
const {fitWindow,initialWindow,resizeWindow}=exportsObject;
function inside(r,v){assert.ok(r.x>=0&&r.y>=0);assert.ok(r.width>0&&r.height>0);assert.ok(r.x+r.width<=v.width+0.01);assert.ok(r.y+r.height<=v.height+0.01);}
test('initial window and viewport shrink keep the entire frame reachable',()=>{
 for(const v of [{width:1440,height:900},{width:800,height:600},{width:390,height:844},{width:320,height:240}]){
  inside(initialWindow(v),v);
  inside(fitWindow({x:1300,y:800,width:900,height:800},v),v);
 }
});
test('dragging clamps every side without changing window size',()=>{
 const v={width:1200,height:800},r=initialWindow(v);
 for(const dx of [-9999,0,9999])for(const dy of [-9999,0,9999]){
  const next=fitWindow({...r,x:r.x+dx,y:r.y+dy},v);inside(next,v);assert.equal(next.width,r.width);assert.equal(next.height,r.height);
 }
});
test('all eight resize handles preserve min size and viewport bounds',()=>{
 const v={width:1200,height:800},r=initialWindow(v);
 for(const edge of ['n','s','e','w','ne','nw','se','sw'])for(const dx of [-9999,-40,0,40,9999])for(const dy of [-9999,-40,0,40,9999]){
  const next=resizeWindow(r,edge,dx,dy,v);inside(next,v);assert.ok(next.width>=380);assert.ok(next.height>=320);
  if(edge.includes('w'))assert.equal(next.x+next.width,r.x+r.width);
  if(edge.includes('n'))assert.equal(next.y+next.height,r.y+r.height);
 }
});
