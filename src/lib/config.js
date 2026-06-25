// v2 "Amplop" app configuration. In the prototype this was the fixed CFG in
// amplop-app.jsx. Per plan §5.2/§7.4 the budget figures (monthly/shopWeekly/
// weekendBudget) become server-provided / user-editable in a later phase; for
// Phase 1 they live here as constants.

export const CFG = {
  accent: '#5b63d3',
  cellH: 78,
  catPalette: ['#d35d4a', '#4968c4', '#9b59c0', '#2f9e8f', '#e0962a'],
  monthly: 5000000,
  shopWeekly: 600000,
  weekendBudget: 200000,
}

export const FLEX_COLOR = '#e0962a' // amber — distinct from the Belanja Mingguan blue

/** The budget subset passed to the engine's computeAmplop. */
export function budgetConfig() {
  return { monthly: CFG.monthly, shopWeekly: CFG.shopWeekly, weekendBudget: CFG.weekendBudget }
}
