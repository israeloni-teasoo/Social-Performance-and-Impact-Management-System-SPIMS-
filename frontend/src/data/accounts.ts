import type { Role } from '../types';

export interface DemoAccount {
  role: Role;
  name: string;
  roleLabel: string;
  email: string;
  password: string;
}

// Demo credentials only — this is a client-side prototype with no real backend,
// so this is a hardcoded allow-list, not a real authentication system.
export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'exec', name: 'Amaka Okonkwo', roleLabel: 'Executive', email: 'amaka.okonkwo@seplat.com', password: 'Exec@2026' },
  { role: 'manager', name: 'Tunde Bello', roleLabel: 'Project Manager', email: 'tunde.bello@seplat.com', password: 'Manager@2026' },
  { role: 'field', name: 'Grace Idemudia', roleLabel: 'Field Officer', email: 'grace.idemudia@seplat.com', password: 'Field@2026' },
  { role: 'relations', name: 'Blessing Aganbi', roleLabel: 'Community Relations', email: 'blessing.aganbi@seplat.com', password: 'Relations@2026' },
];
