export interface OutletSettings {
  displayCategoryCards: boolean;
  enableSounds: boolean;
  pageWidthMm: number;
  pageHeightMm: number;
  pageMarginMm: number;
}

export interface UpdateOutletSettingsRequest {
  displayCategoryCards?: boolean;
  enableSounds?: boolean;
  pageWidthMm?: number;
  pageHeightMm?: number;
  pageMarginMm?: number;
}

export interface AccountSettings {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
}

export interface UpdateAccountSettingsRequest {
  firstName: string;
  lastName: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SwitchOutletRequest {
  outletId: number;
}

export interface Outlet {
  id: number;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  mode: string;
  isActive: boolean;
  paymentMethods: any[];
}