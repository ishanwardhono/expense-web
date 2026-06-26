// Subscription catalog CRUD (definitions only — paid status is a /month
// concern). Edits to alloc/due_day version from the current month.

import { useState } from 'react'

const DEFAULT_COLOR = '#5b63d3'

function SubForm({ initial, onSubmit, onCancel }) {
  const [name, setName] = useState(initial ? initial.name : '')
  const [color, setColor] = useState(initial ? initial.color || DEFAULT_COLOR : DEFAULT_COLOR)
  const [alloc, setAlloc] = useState(initial ? String(initial.alloc) : '')
  const [dueDay, setDueDay] = useState(initial ? String(initial.due_day) : '')
  const [err, setErr] = useState('')

  function submit() {
    const a = parseInt(alloc, 10)
    const d = parseInt(dueDay, 10)
    if (!name.trim()) { setErr('Nama wajib diisi'); return }
    if (!Number.isInteger(a) || a <= 0) { setErr('Alokasi harus angka > 0'); return }
    if (!Number.isInteger(d) || d < 1 || d > 31) { setErr('Jatuh tempo harus 1–31'); return }
    onSubmit({ name: name.trim(), color, alloc: a, due_day: d })
  }

  return (
    <div className="sub-form">
      {err ? <div className="form-err">⚠️ {err}</div> : null}
      <label className="f-label">Nama</label>
      <div className="sub-name-row">
        <input className="f-in" type="color" aria-label="Warna" value={color} onChange={(e) => setColor(e.target.value)} />
        <input className="f-in" type="text" placeholder="Netflix" aria-label="Nama" value={name}
          onChange={(e) => { setName(e.target.value); setErr('') }} />
      </div>
      <div className="form-row">
        <div className="form-col">
          <label className="f-label">Alokasi</label>
          <div className="amt-wrap">
            <span className="amt-rp">Rp</span>
            <input className="amt-in" type="number" inputMode="numeric" step="1000" min="1" aria-label="Alokasi"
              value={alloc} onChange={(e) => { setAlloc(e.target.value); setErr('') }} />
          </div>
        </div>
        <div className="form-col">
          <label className="f-label">Jatuh tempo (tgl)</label>
          <input className="f-in" type="number" inputMode="numeric" min="1" max="31" aria-label="Jatuh tempo"
            value={dueDay} onChange={(e) => { setDueDay(e.target.value); setErr('') }} />
        </div>
      </div>
      <div className="btn-row">
        <button className="btn ghost" onClick={onCancel}>Batal</button>
        <button className="btn primary" onClick={submit}>Simpan</button>
      </div>
    </div>
  )
}

export function SubscriptionsSection({ subs, fmtRp, onCreate, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(null) // null | 'new' | sub id

  return (
    <div className="card set-card">
      <div className="set-sec-title">Langganan</div>

      {subs.length === 0 ? (
        <div className="empty-note">Belum ada langganan</div>
      ) : (
        subs.map((s) => (
          editing === s.id ? (
            <SubForm key={s.id} initial={s}
              onSubmit={(body) => { onUpdate(s.id, body); setEditing(null) }}
              onCancel={() => setEditing(null)} />
          ) : (
            <div className="sub-row" key={s.id}>
              <span className="cat-dot" style={{ background: s.color || DEFAULT_COLOR }}></span>
              <span className="sub-main">
                <span className="sub-name">{s.name}</span>
                <span className="sub-sub">{fmtRp(s.alloc)} · jatuh tempo tgl {s.due_day}</span>
              </span>
              <span className="sub-acts">
                <button className="link-btn" onClick={() => setEditing(s.id)}>Ubah</button>
                <button className="link-btn danger" onClick={() => onDelete(s.id)}>Hapus</button>
              </span>
            </div>
          )
        ))
      )}

      {editing === 'new' ? (
        <SubForm onSubmit={(body) => { onCreate(body); setEditing(null) }} onCancel={() => setEditing(null)} />
      ) : (
        <button className="btn ghost full set-add" onClick={() => setEditing('new')}>+ Tambah langganan</button>
      )}
    </div>
  )
}
