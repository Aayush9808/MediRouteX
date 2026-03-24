export type PortalRole = 'patient' | 'driver' | 'hospital' | 'user' | 'blood_bank';
export type AppRole = PortalRole | 'admin';

const ROLE_ALIASES: Record<string, AppRole> = {
  dispatcher: 'admin',
  hospital_staff: 'hospital',
  hospital_admin: 'hospital',
  requester: 'user',
};

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Admin',
  patient: 'Patient',
  driver: 'Driver',
  hospital: 'Hospital',
  user: 'Requester',
  blood_bank: 'Blood Bank',
};

export const normalizeRole = (role?: string): string => {
  if (!role) return 'admin';
  return ROLE_ALIASES[role] || role;
};

export const isPortalRole = (role: string): role is PortalRole => {
  return role === 'patient' || role === 'driver' || role === 'hospital' || role === 'user' || role === 'blood_bank';
};

export const getRoleLabel = (role?: string): string => {
  const normalized = normalizeRole(role);
  if (normalized in ROLE_LABELS) {
    return ROLE_LABELS[normalized as AppRole];
  }

  return normalized
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};
