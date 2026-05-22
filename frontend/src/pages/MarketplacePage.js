import React, { useEffect, useState } from 'react';
import { marketplaceApi, canWrite } from '../services/api';

export default function MarketplacePage() {
  const writer = canWrite();
  const [listings, setListings] = useState([]);
  const [err, setErr] = useState(null);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [draft, setDraft] = useState({ workflow_name: '', title: '', description: '', category: 'general', version: '1.0.0' });
  const [review, setReview] = useState({ rating: 5, comment: '' });

  async function refresh() {
    setErr(null);
    try { setListings(await marketplaceApi.listListings(filter)); }
    catch (e) { setErr(e.message); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  async function open(id) {
    setSelected(id);
    try { setDetail(await marketplaceApi.getListing(id)); } catch (e) { setErr(e.message); }
  }
  async function install(id) {
    try { await marketplaceApi.install(id); await refresh(); if (selected === id) await open(id); }
    catch (e) { setErr(e.message); }
  }
  async function publish() {
    try { await marketplaceApi.create(draft); setDraft({ workflow_name: '', title: '', description: '', category: 'general', version: '1.0.0' }); await refresh(); }
    catch (e) { setErr(e.message); }
  }
  async function addReview() {
    try { await marketplaceApi.addReview(selected, review); setReview({ rating: 5, comment: '' }); await open(selected); }
    catch (e) { setErr(e.message); }
  }

  return (
    <div>
      <div className="page-header"><div><h2>Workflow Marketplace</h2><p>Publish, share, install workflows across tenants. Ratings + reviews + install counts.</p></div></div>
      {err && <div className="ai-error">{err}</div>}
      {writer && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Publish a workflow</h3>
          <div className="form-grid">
            <div className="form-group"><label>Workflow name</label><input value={draft.workflow_name} onChange={(e) => setDraft({ ...draft, workflow_name: e.target.value })} /></div>
            <div className="form-group"><label>Title</label><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
            <div className="form-group"><label>Category</label><input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} /></div>
            <div className="form-group"><label>Version</label><input value={draft.version} onChange={(e) => setDraft({ ...draft, version: e.target.value })} /></div>
            <div className="form-group full-width"><label>Description</label><textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
          </div>
          <button className="btn" onClick={publish}>Publish</button>
        </div>
      )}
      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Browse</h3>
        <div className="form-grid">
          <div className="form-group"><label>Category filter</label><input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="(any)" /></div>
          <div className="form-group"><label>&nbsp;</label><button className="btn secondary" onClick={refresh}>Search</button></div>
        </div>
        {listings.length === 0 ? <div className="empty-state">No listings yet.</div> : (
          <table className="data-table">
            <thead><tr><th>#</th><th>Title</th><th>Workflow</th><th>Publisher</th><th>Cat</th><th>Ver</th><th>Rating</th><th>Installs</th><th>Actions</th></tr></thead>
            <tbody>{listings.map((l) => (
              <tr key={l.id}>
                <td>{l.id}</td><td>{l.title}</td><td>{l.workflow_name}</td><td>{l.publisher}</td>
                <td>{l.category}</td><td>{l.version}</td><td>{l.rating}</td><td>{l.install_count}</td>
                <td>
                  <button className="btn secondary" onClick={() => open(l.id)}>View</button>
                  <button className="btn" onClick={() => install(l.id)}>Install</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      {detail && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>{detail.title} (v{detail.version})</h3>
          <p>{detail.description}</p>
          <h4>Reviews ({(detail.reviews || []).length})</h4>
          {(detail.reviews || []).length === 0 ? <div className="empty-state">No reviews yet.</div> : (
            <ul>{detail.reviews.map((r) => <li key={r.id}>{r.reviewer} · {r.rating}/5 — {r.comment}</li>)}</ul>
          )}
          <div className="form-grid">
            <div className="form-group"><label>Rating (1-5)</label><input type="number" min={1} max={5} value={review.rating} onChange={(e) => setReview({ ...review, rating: Number(e.target.value || 5) })} /></div>
            <div className="form-group full-width"><label>Comment</label><textarea value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} /></div>
          </div>
          <button className="btn" onClick={addReview}>Add review</button>
        </div>
      )}
    </div>
  );
}
