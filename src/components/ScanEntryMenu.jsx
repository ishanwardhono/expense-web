// FAB entry menu (Import dari images / Input manual). Ported from scan-flow.jsx.
//
// The AI scan flow is deferred to Phase 5, so the Import option is present but
// stubbed: tapping it shows a "segera hadir" (coming soon) note rather than
// opening the (not-yet-built) scan flow. The manual path is the critical path.

import { useState } from 'react'

export function ScanEntryMenu({ onManual, onClose }) {
  const [stub, setStub] = useState(false)
  return (
    <div className="menu-ovl" onClick={onClose}>
      <div className="scan-menu" onClick={(e) => e.stopPropagation()}>
        <button className="scan-menu-item" onClick={() => setStub(true)} aria-disabled="true">
          <span className="smi-ic scan" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="3" /><path d="M9 18h6" /><path d="m8.5 8.5 2.5 2.5 4-4.5" /></svg>
          </span>
          <span className="smi-tx">
            <span className="smi-t">Impor dari images</span>
            <span className="smi-s">{stub ? 'Segera hadir di fase berikutnya' : 'Screenshot GoPay & Livin’'}</span>
          </span>
        </button>
        <button className="scan-menu-item" onClick={onManual}>
          <span className="smi-ic" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
          </span>
          <span className="smi-tx">
            <span className="smi-t">Input manual</span>
            <span className="smi-s">Isi jumlah &amp; kategori sendiri</span>
          </span>
        </button>
      </div>
      <div className="scan-menu-caret"></div>
    </div>
  )
}
