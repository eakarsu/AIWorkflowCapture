// routes/workflowExtras.js — POST /workflows/:id/run creates a replay_runs row
const express=require('express');
const pool=require('../config/database');
const router=express.Router();
router.post('/workflows/:id/run', async (req,res)=>{
  try {
    const w=await pool.query('SELECT name FROM workflows WHERE id=$1',[req.params.id]);
    if(!w.rows.length) return res.status(404).json({error:'workflow not found'});
    const name=w.rows[0].name;
    const r=await pool.query("INSERT INTO replay_runs (workflow_name,status,duration_ms) VALUES ($1,'running',0) RETURNING *",[name]);
    res.json(r.rows[0]);
  } catch(e){ res.status(500).json({error:e.message}); }
});
module.exports=router;