export type UserRole = 'admin' | 'employee';

export interface AuthUser {
  role: UserRole;
  nip?: string;
  nama: string;
  departemen?: string;
  avatarInitials?: string;
}
