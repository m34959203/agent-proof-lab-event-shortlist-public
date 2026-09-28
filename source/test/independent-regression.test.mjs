// Independent saved-evidence regression probes. No installs, model calls or writes.
// Run from a candidate project root, or set AUDIT_PRODUCT_ROOT to its absolute path.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const candidate=path.resolve(process.env.AUDIT_PRODUCT_ROOT||process.cwd());
const {createEmbeddings,PROFILE,ModelError}=await import(pathToFileURL(path.join(candidate,'lib/embeddings.mjs')));
const {recommend}=await import(pathToFileURL(path.join(candidate,'lib/recommend.mjs')));
const vector=()=>[1,...Array(1023).fill(0)];
const query={locationId:'austin-tx',date:'2026-10-17',eventType:'Conference',category:'Event host/MC',budgetUsdCents:200000,language:'English',hours:4,style:'calm'};
function fixture(changeDuringEmbed=false){
 let digest=PROFILE.digest,embeds=0;const calls=[];
 const adapter=createEmbeddings({transport:async(url,options)=>{
  const endpoint=new URL(url).pathname;calls.push(endpoint);
  if(endpoint==='/api/version')return{ok:true,json:async()=>({version:PROFILE.version})};
  if(endpoint==='/api/tags')return{ok:true,json:async()=>({models:[{name:PROFILE.model,digest}]})};
  assert.equal(endpoint,'/api/embed');embeds++;
  if(changeDuringEmbed)digest='a'.repeat(64);
  return{ok:true,json:async()=>({model:PROFILE.model,embeddings:JSON.parse(options.body).input.map(vector)})};
 }});
 return{adapter,calls,setDigest:d=>digest=d,get embeds(){return embeds;}};
}
test('R1: changed digest during inference rejects instead of returning pinned cards',async()=>{
 const f=fixture(true);
 await assert.rejects(()=>recommend(query,f.adapter),ModelError);
});
test('R1: detected mismatch invalidates cache before retry at restored digest',async()=>{
 const f=fixture();await f.adapter.embed(['cached']);f.setDigest('b'.repeat(64));
 await assert.rejects(()=>f.adapter.embed(['cached']),ModelError);
 f.setDigest(PROFILE.digest);await f.adapter.embed(['cached']);
 assert.equal(f.embeds,2,'retry after identity failure must re-embed, not reuse suspect cache');
});
test('R2: eviction retains every vector required by the current response',async()=>{
 const f=fixture();await f.adapter.embed(Array.from({length:512},(_,i)=>`text-${i}`));
 const result=await f.adapter.embed(['new-query','text-0']);
 assert.equal(result.length,2);
 assert(result.every(v=>Array.isArray(v)&&v.length===1024),'eviction lost a required current vector');
});
test('R2: 520 valid changing-style recommendations never fail at cache capacity',async()=>{
 const f=fixture();
 for(let i=0;i<520;i++){
  const result=await recommend({...query,style:`calm request ${i}`},f.adapter);
  assert.equal(result.cards.length,3,`request ${i+1}`);
  assert(result.cards.every(c=>Number.isFinite(c.score)),`request ${i+1}`);
 }
});
