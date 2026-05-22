import React, { useEffect, useState } from 'react';
import { recordingsApi, canWrite } from '../services/api';

export default function RecordingSessionsPage() {
  const writer = canWrite();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [selected, setSelected] = useState(null);
  const [frames, setFrames] = useState([]);
  const [events, setEvents] = useState([]);
  const [draft, setDraft] = useState({ workflow_name: '', operator: '', app_name: '', notes: '' });
  const [eventDraft, setEventDraft] = useState({ seq: 0, kind: 'click', target_selector: '', value: '' });

  async function refresh() {
    setLoading(true); setErr(null);
    try {
      const list = await recordingsApi.listSessions();
      setSessions(list);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);

  async function openSession(id) {
    setSelected(id);
    try {
      const [f, ev] = await Promise.all([recordingsApi.listFrames(id), recordingsApi.listEvents(id)]);
      setFrames(f); setEvents(ev);
    } catch (e) { setErr(e.message); }
  }

  async function createSession() {
    try {
      await recordingsApi.createSession(draft);
      setDraft({ workflow_name: '', operator: '', app_name: '', notes: '' });
      await refresh();
    } catch (e) { setErr(e.message); }
  }

  async function stopSession(id) {
    try { await recordingsApi.stopSession(id); await refresh(); }
    catch (e) { setErr(e.message); }
  }

  async function removeSession(id) {
    if (!window.confirm('Delete this recording session and all frames/events?')) return;
    try {
      await recordingsApi.removeSession(id);
      if (selected === id) { setSelected(null); setFrames([]); setEvents([]); }
      await refresh();
    } catch (e) { setErr(e.message); }
  }

  async function addEvent() {
    if (!selected) return;
    try {
      await recordingsApi.addEvent(selected, eventDraft);
      setEventDraft({ seq: (eventDraft.seq || 0) + 1, kind: 'click', target_selector: '', value: '' });
      const ev = await recordingsApi.listEvents(selected);
      setEvents(ev);
    } catch (e) { setErr(e.message); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Recording Sessions</h2>
          <p>Raw recording substrate: sessions, frames (screenshots), events (input stream).</p>
        </div>
      </div>
      {err && <div className="ai-error">{err}</div>}
      {writer && (
        <div className="card" style={{ marginBottom: 12 }}>
          <h3 style={{ marginTop: 0 }}>New recording session</h3>
          <div className="form-grid">
            <div className="form-group"><label>Workflow</label>
              <input value={draft.workflow_name} onChange={(e) => setDraft({ ...draft, workflow_name: e.target.value })} />
            </div>
            <div className="form-group"><label>Operator</label>
              <input value={draft.operator} onChange={(e) => setDraft({ ...draft, operator: e.target.value })} />
            </div>
            <div className="form-group"><label>App</label>
              <input value={draft.app_name} onChange={(e) => setDraft({ ...draft, app_name: e.target.value })} />
            </div>
            <div className="form-group full-width"><label>Notes</label>
              <textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            </div>
          </div>
          <button className="btn" onClick={createSession}>Start session</button>
        </div>
      )}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Sessions ({sessions.length})</h3>
        {loading && <div className="empty-state">Loading...</div>}
        {!loading && sessions.length === 0 && <div className="empty-state">No recording sessions yet.</div>}
        {!loading && sessions.length > 0 && (
          <table className="data-table">
            <thead><tr><th>#</th><th>Workflow</th><th>Operator</th><th>App</th><th>Status</th><th>Started</th><th>Actions</th></tr></thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.workflow_name}</td>
                  <td>{s.operator}</td>
                  <td>{s.app_name}</td>
                  <td>{s.status}</td>
                  <td>{s.started_at ? new Date(s.started_at).toLocaleString() : ''}</td>
                  <td>
                    <button className="btn secondary" onClick={() => openSession(s.id)}>Open</button>
                    {writer && s.status !== 'stopped' && <button className="btn secondary" onClick={() => stopSession(s.id)}>Stop</button>}
                    {writer && <button className="btn secondary" onClick={() => removeSession(s.id)}>Delete</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selected && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>Session #{selected}</h3>
          <h4>Frames ({frames.length})</h4>
          {frames.length === 0 ? <div className="empty-state">No frames captured.</div> : (
            <ul>{frames.map((f) => <li key={f.id}>seq {f.seq} · {f.image_ref || '(no image)'} · {f.width}x{f.height}</li>)}</ul>
          )}
          <h4>Events ({events.length})</h4>
          {events.length === 0 ? <div className="empty-state">No events captured.</div> : (
            <table className="data-table">
              <thead><tr><th>seq</th><th>kind</th><th>target</th><th>value</th></tr></thead>
              <tbody>{events.map((ev) => (<tr key={ev.id}><td>{ev.seq}</td><td>{ev.kind}</td><td>{ev.target_selector}</td><td>{ev.value}</td></tr>))}</tbody>
            </table>
          )}
          {writer && (
            <div className="card" style={{ marginTop: 8 }}>
              <h4 style={{ marginTop: 0 }}>Append event</h4>
              <div className="form-grid">
                <div className="form-group"><label>seq</label><input type="number" value={eventDraft.seq} onChange={(e) => setEventDraft({ ...eventDraft, seq: Number(e.target.value || 0) })} /></div>
                <div className="form-group"><label>kind</label>
                  <select value={eventDraft.kind} onChange={(e) => setEventDraft({ ...eventDraft, kind: e.target.value })}>
                    {['click', 'keypress', 'scroll', 'navigate', 'file', 'select'].map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>target selector</label><input value={eventDraft.target_selector} onChange={(e) => setEventDraft({ ...eventDraft, target_selector: e.target.value })} /></div>
                <div className="form-group"><label>value</label><input value={eventDraft.value} onChange={(e) => setEventDraft({ ...eventDraft, value: e.target.value })} /></div>
              </div>
              <button className="btn" onClick={addEvent}>Append event</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
