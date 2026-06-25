// Bottom-sheet wrapper. Tapping the overlay closes; taps inside don't bubble.
// Ported from the prototype's expense-components.jsx.

export function Sheet({ onClose, children }) {
  return (
    <div className="ovl" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab"></div>
        {children}
      </div>
    </div>
  )
}
