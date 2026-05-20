
import React, { useEffect, useState } from 'react';
const TOKEN_KEY = Object.keys(localStorage).find((k) => k.endsWith('_token')) || 'workflow_capture_token';
const API_BASE = 'http://localhost:4053/api';
export default function WorkflowLibraryWorkbench(){
  const [rows,setRows]=useState([]);const [busy,setBusy]=useState(null);const [msg,setMsg]=useState('');
  const load=()=>fetch(API_BASE+'/workflows',{headers:{Authorization:'Bearer '+localStorage.getItem(TOKEN_KEY)}}).then(r=>r.json()).then(setRows);
  useEffect(()=>{load();},[]);
  const run=async(w)=>{
    setBusy(w.id);setMsg('');
    const r=await fetch(API_BASE+'/workflows/'+w.id+'/run',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+localStorage.getItem(TOKEN_KEY)},body:JSON.stringify({parameters:{}})});
    const d=await r.json();
    setMsg(r.ok?'Started run #'+d.id+' for '+w.name:'Failed: '+(d.error||r.status));
    setBusy(null);
  };
  return (
    <div>
      <div className="page-header"><div><h2>Workflow Library</h2><p>Click Run to spawn an actual replay_runs row.</p></div></div>
      {msg&&<div className="card" style={{borderColor:'#10b981'}}>{msg}</div>}
      <div className="feature-grid">
        {rows.map(r=>(
          <div key={r.id} className="feature-card" style={{['--card-color']:'#3b82f6'}}>
            <div className="feature-card-icon" style={{background:'#3b82f622',color:'#3b82f6'}}>W</div>
            <h3>{r.name}</h3>
            <p>{r.intent}</p>
            <div style={{marginTop:12,display:'flex',gap:6,flexWrap:'wrap'}}>
              <span className="badge">{r.app_name}</span>
              <span className="badge">{r.step_count} steps</span>
              <span className={'badge '+(r.status||'')}>{r.status}</span>
            </div>
            <button className="btn" style={{marginTop:12,width:'100%'}} disabled={busy===r.id} onClick={()=>run(r)}>
              {busy===r.id?'Starting…':'▶ Run replay'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}