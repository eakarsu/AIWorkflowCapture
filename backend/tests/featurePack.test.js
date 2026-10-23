// Offline gate: unset provider keys BEFORE importing app code; router also deletes them (no-provider guard).
delete process.env.OPENROUTER_API_KEY; delete process.env.OPENAI_API_KEY;
process.env.JWT_SECRET = process.env.JWT_SECRET && process.env.JWT_SECRET.length>=32 ? process.env.JWT_SECRET : 'test-jwt-secret-feature-pack-0123456789';
const test=require('node:test'); const assert=require('node:assert/strict');
const jwt=require('jsonwebtoken'); const express=require('express');
const router=require('../routes/featurePack');
test('feature pack: auth, CRUD, search/filter, export, AI fallback', async () => {
  const app=express(); app.use(express.json()); app.use('/api', router);
  const srv=await new Promise(r=>{ const s=app.listen(0,()=>r(s)); });
  const base=`http://127.0.0.1:${srv.address().port}/api`;
  const token=jwt.sign({id:1,email:'test@example.com',role:'analyst'}, process.env.JWT_SECRET);
  const H={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};
  try {
    assert.equal((await fetch(`${base}/tasks`)).status,401);
    const c=await fetch(`${base}/tasks`,{method:'POST',headers:H,body:JSON.stringify({title:'Review checkout workflow capture',priority:'critical',assignee:'lead',status:'todo'})});
    assert.equal(c.status,201); const created=await c.json(); assert.ok(created.id);
    const c2=await fetch(`${base}/tasks`,{method:'POST',headers:H,body:JSON.stringify({title:'Routine check',priority:'low',status:'done'})}); assert.equal(c2.status,201);
    const list=await (await fetch(`${base}/tasks`,{headers:H})).json(); assert.equal((list.data||list.tasks).length,2);
    const filtered=await (await fetch(`${base}/tasks?search=${encodeURIComponent('checkout')}&priority=critical`,{headers:H})).json(); assert.equal((filtered.data||filtered.tasks).length,1);
    const upd=await fetch(`${base}/tasks/${created.id}`,{method:'PUT',headers:H,body:JSON.stringify({title:created.title,status:'done',priority:'critical',assignee:'lead'})}); assert.equal(upd.status,200); assert.equal((await upd.json()).status,'done');
    const csv=await fetch(`${base}/tasks/export.csv`,{headers:H}); assert.match(csv.headers.get('content-type')||'',/text\/csv/); assert.match(await csv.text(),/title/);
    const jsonExp=await fetch(`${base}/tasks/export.json`,{headers:H}); assert.match(jsonExp.headers.get('content-type')||'',/json/); assert.equal((await jsonExp.json()).total>=1,true);
    for (const f of ['workflow-task-priority','exception-risk-summary','automation-workload']) { const r=await fetch(`${base}/ai/${f}`,{method:'POST',headers:H,body:JSON.stringify({records:(list.data||list.tasks)})}); assert.equal(r.status,200); const b=await r.json(); assert.equal(b.aiGenerated,false); assert.equal(b.providerCalled,false); }
    // Empty/false/zero preservation in core formatting helpers is covered via counts on empty set.
    const core=require('../services/featurePackCore');
    assert.equal(core.counts([]).total,0); assert.equal(core.counts([]).completionRate,0); assert.equal(core.fallback('x',{}).aiGenerated,false);
  } finally { await new Promise(r=>srv.close(r)); }
});
