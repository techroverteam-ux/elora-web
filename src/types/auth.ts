export interface PermissionSet {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface Role {
  _id: string;
  name: string;
  code: string;
  permissions: Record<string, PermissionSet>;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  roles: Role[];
  isActive: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
