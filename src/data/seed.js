// Seed data for the v2 static shell (Phase 1, offline). June 2026.
// Ported from the prototype's expense-data.jsx. In Phase 2 the store fetches
// this from the backend; here it is the initial offline dataset.

export const SEED_EXPENSES = [
  { id: 'e01', date: '2026-06-01', time: '12:10', amount: 18000, cat: 'Makan', note: 'Nasi padang' },
  { id: 'e02', date: '2026-06-01', time: '15:30', amount: 12000, cat: 'Jajan', note: 'Kopi susu' },
  { id: 'e03', date: '2026-06-01', time: '19:05', amount: 15000, cat: 'Makan', note: 'Ayam geprek' },
  { id: 'e04', date: '2026-06-02', time: '12:40', amount: 22000, cat: 'Makan', note: 'Soto ayam' },
  { id: 'e05', date: '2026-06-02', time: '16:20', amount: 35000, cat: 'Jajan', note: 'Boba + roti' },
  { id: 'e06', date: '2026-06-03', time: '12:25', amount: 30000, cat: 'Makan', note: 'Warteg + es teh' },
  { id: 'e07', date: '2026-06-03', time: '17:45', amount: 8000, cat: 'Lainnya', note: 'Parkir' },
  { id: 'e08', date: '2026-06-04', time: '13:00', amount: 25000, cat: 'Makan', note: '' },
  { id: 'e09', date: '2026-06-04', time: '19:30', amount: 40000, cat: 'Belanja', note: 'Sabun & odol' },
  { id: 'e10', date: '2026-06-05', time: '12:15', amount: 20000, cat: 'Makan', note: '' },
  { id: 'e11', date: '2026-06-05', time: '15:00', amount: 10000, cat: 'Jajan', note: 'Cilok' },
  { id: 'e12', date: '2026-06-05', time: '18:40', amount: 20000, cat: 'Cash', note: 'Tarik tunai' },
  { id: 'e13', date: '2026-06-06', time: '10:30', amount: 145000, cat: 'Belanja', note: 'Belanja mingguan' },
  { id: 'e14', date: '2026-06-06', time: '19:00', amount: 65000, cat: 'Makan', note: 'Makan keluarga' },
  { id: 'e15', date: '2026-06-07', time: '11:00', amount: 85000, cat: 'Makan', note: 'Brunch' },
  { id: 'e16', date: '2026-06-07', time: '14:20', amount: 28000, cat: 'Jajan', note: 'Es krim' },
  { id: 'e17', date: '2026-06-07', time: '16:45', amount: 160000, cat: 'Belanja', note: 'Skincare' },
  { id: 'e18', date: '2026-06-08', time: '12:30', amount: 19000, cat: 'Makan', note: '' },
  { id: 'e19', date: '2026-06-08', time: '15:10', amount: 9000, cat: 'Jajan', note: 'Gorengan' },
  { id: 'e20', date: '2026-06-09', time: '12:45', amount: 26000, cat: 'Makan', note: 'Mie ayam' },
  { id: 'e21', date: '2026-06-09', time: '17:00', amount: 30000, cat: 'Lainnya', note: 'Kado kantor' },
  { id: 'e22', date: '2026-06-10', time: '12:20', amount: 24000, cat: 'Makan', note: '' },
  { id: 'e23', date: '2026-06-10', time: '16:30', amount: 14000, cat: 'Jajan', note: 'Kopi' },
  { id: 'e24', date: '2026-06-11', time: '12:50', amount: 32000, cat: 'Makan', note: 'Padang lagi' },
  { id: 'e25', date: '2026-06-11', time: '18:15', amount: 50000, cat: 'Cash', note: 'Tarik tunai' },
  { id: 'e26', date: '2026-06-12', time: '08:15', amount: 16000, cat: 'Makan', note: 'Sarapan bubur' },
]

export const SEED_SUBS = [
  { id: 's1', name: 'Netflix', color: '#c8403c', alloc: 187000, due: '2026-06-05', paid: { date: '2026-06-05', amount: 186000 } },
  { id: 's2', name: 'Spotify', color: '#1faa5d', alloc: 55000, due: '2026-06-10', paid: { date: '2026-06-10', amount: 65000 } },
  { id: 's3', name: 'YouTube Premium', color: '#d04545', alloc: 59000, due: '2026-06-18', paid: null },
  { id: 's4', name: 'iCloud+', color: '#4a7fd6', alloc: 29000, due: '2026-06-28', paid: null },
]
