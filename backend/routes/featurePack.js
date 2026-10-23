const express=require('express');
// No-provider guard: .env reloads in auth middleware must not enable provider calls here.
delete process.env.OPENROUTER_API_KEY; delete process.env.OPENAI_API_KEY;
const core=require('../services/featurePackCore');
const { authenticateToken } = require('../middleware/auth');
const router=express.Router();
const store=[]; let seq=1;
const FEATURES={'workflow-task-priority':{kind:'priority'},'exception-risk-summary':{kind:'risk'},'automation-workload':{kind:'workload'}};
router.use(authenticateToken);
function recordsFrom(req){const b=req.body||{};const r=b.records||b.tasks||b.items;return Array.isArray(r)?r.map((t,i)=>({id:t.id??i+1,title:String(t.title||''),description:String(t.description||''),status:String(t.status||'todo'),priority:String(t.priority||'medium').toLowerCase(),assignee:String(t.assignee||''),category:String(t.category||'')})):store;}
router.get('/tasks',(req,res)=>{const rows=core.filterTasks(store,{search:req.query.search||req.query.q||'',status:req.query.status||'',priority:req.query.priority||''});res.json({data:rows,tasks:rows,total:rows.length,count:rows.length});});
router.post('/tasks',(req,res)=>{const t=core.normalizeTask(req.body||{});if(!t.title)return res.status(400).json({error:'title is required'});const now=new Date().toISOString();const row={id:seq++,title:t.title,description:t.description,status:t.status,priority:t.priority,assignee:t.assignee,category:t.category,owner:req.user?.email||req.user?.id||null,createdAt:now,updatedAt:now};store.push(row);res.status(201).json(row);});
router.get('/tasks/export.csv',(req,res)=>{const rows=core.filterTasks(store,{search:req.query.search||req.query.q||'',status:req.query.status||'',priority:req.query.priority||''});res.type('text/csv');res.setHeader('Content-Disposition','attachment; filename="tasks.csv"');res.send(core.toCsv(rows));});
router.get('/tasks/export.json',(req,res)=>{const rows=core.filterTasks(store,{search:req.query.search||req.query.q||'',status:req.query.status||'',priority:req.query.priority||''});res.type('application/json');res.setHeader('Content-Disposition','attachment; filename="tasks.json"');res.send(JSON.stringify({data:rows,tasks:rows,total:rows.length},null,2));});
router.get('/tasks/export',(req,res)=>{const fmt=String(req.query.format||'json').toLowerCase();const rows=core.filterTasks(store,{search:req.query.search||req.query.q||'',status:req.query.status||'',priority:req.query.priority||''});if(fmt==='csv'){res.type('text/csv');return res.send(core.toCsv(rows));}return res.json({data:rows,tasks:rows,total:rows.length});});
router.get('/tasks/:id',(req,res)=>{const row=store.find(t=>String(t.id)===String(req.params.id));if(!row)return res.status(404).json({error:'not found'});res.json(row);});
function update(req,res){const row=store.find(t=>String(t.id)===String(req.params.id));if(!row)return res.status(404).json({error:'not found'});const t=core.normalizeTask({...row,...(req.body||{})});if(!t.title)return res.status(400).json({error:'title is required'});Object.assign(row,t,{updatedAt:new Date().toISOString()});res.json(row);}
router.put('/tasks/:id',update); router.patch('/tasks/:id',update);
// Domain AI over own records: deterministic fallback only.
router.post('/ai/:feature',(req,res)=>{const f=FEATURES[req.params.feature];if(!f)return res.status(404).json({error:'unknown feature'});const recs=recordsFrom(req);let result;if(f.kind==='priority')result=core.priorityRanking(recs);else if(f.kind==='risk')result=core.riskSummary(recs);else result=core.workloadSummary(recs);res.json(core.fallback(req.params.feature,result));});
router.get('/ai/:feature',(req,res)=>{const f=FEATURES[req.params.feature];if(!f)return res.status(404).json({error:'unknown feature'});let result;if(f.kind==='priority')result=core.priorityRanking(store);else if(f.kind==='risk')result=core.riskSummary(store);else result=core.workloadSummary(store);res.json(core.fallback(req.params.feature,result));});
module.exports=router; module.exports.store=store;
