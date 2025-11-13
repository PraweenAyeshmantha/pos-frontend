export interface ApplicationScreen {
  id: number;
  screenCode: string;
  screenName: string;
  section?: string;
  category: string;
  description?: string;
  routePath?: string;
  navigationItem?: boolean;
  sortOrder?: number;
}

export interface UserAccessPermission {
  screenCode: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}
