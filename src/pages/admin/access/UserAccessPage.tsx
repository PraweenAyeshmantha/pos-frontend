import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import ToastContainer from '../../../components/common/ToastContainer';
import Alert, { type AlertType } from '../../../components/common/Alert';
import { userService } from '../../../services/userService';
import { userAccessService } from '../../../services/userAccessService';
import type { UserAccount } from '../../../types/user';
import type { ApplicationScreen, UserAccessPermission } from '../../../types/access';

type PermissionToggleField = Exclude<keyof UserAccessPermission, 'screenCode'>;
const SCREEN_NAME_OVERRIDES: Record<string, string> = {
  CASHIER_DASHBOARD: 'POS Home',
  CASHIER_POS: 'POS Register',
};

const getScreenDisplayName = (screen: ApplicationScreen) => {
  const override = SCREEN_NAME_OVERRIDES[screen.screenCode?.toUpperCase() ?? ''];
  return override ?? screen.screenName;
};

const UserAccessPage: React.FC = () => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [screens, setScreens] = useState<ApplicationScreen[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [permissions, setPermissions] = useState<Record<string, UserAccessPermission>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: AlertType; title: string; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [userData, screenData] = await Promise.all([userService.getAll(), userAccessService.getScreens()]);
        setUsers(userData);
        setScreens(screenData);
      } catch (err) {
        console.error('Failed to load access data', err);
        setError('Unable to load user access data.');
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, []);

  const groupedScreens = useMemo(() => {
    const map = new Map<string, ApplicationScreen[]>();
    screens.forEach((screen) => {
      const section = screen.section ?? 'General';
      if (!map.has(section)) {
        map.set(section, []);
      }
      map.get(section)?.push(screen);
    });
    return Array.from(map.entries())
      .map(([section, sectionScreens]) => ({
        section,
        screens: sectionScreens.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
      }))
      .sort((a, b) => a.section.localeCompare(b.section));
  }, [screens]);

  const loadUserAccess = useCallback(async (userId: number) => {
    try {
      setError(null);
      const access = await userAccessService.getUserAccess(userId);
      const map: Record<string, UserAccessPermission> = {};
      access.forEach((entry) => {
        map[entry.screenCode.toUpperCase()] = {
          screenCode: entry.screenCode.toUpperCase(),
          canView: entry.canView,
          canCreate: entry.canCreate,
          canEdit: entry.canEdit,
          canDelete: entry.canDelete,
        };
      });
      setPermissions(map);
    } catch (err) {
      console.error('Failed to load user access', err);
      setError('Unable to load user access for the selected user.');
      setPermissions({});
    }
  }, []);

  const handleUserChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value ? Number(event.target.value) : '';
    setSelectedUserId(value);
    if (typeof value === 'number') {
      void loadUserAccess(value);
    } else {
      setPermissions({});
    }
  }, [loadUserAccess]);

  const ensurePermissionEntry = useCallback(
    (screenCode: string): UserAccessPermission => {
      const key = screenCode.toUpperCase();
      if (!permissions[key]) {
        return {
          screenCode: key,
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false,
        };
      }
      return permissions[key];
    },
    [permissions],
  );

  const handleToggle = useCallback((screenCode: string, field: PermissionToggleField, value: boolean) => {
    setPermissions((prev) => {
      const key = screenCode.toUpperCase();
      const current = prev[key] ?? ensurePermissionEntry(screenCode);
      const next: UserAccessPermission = {
        ...current,
        [field]: value,
      };
      if (field === 'canView' && !value) {
        next.canCreate = false;
        next.canEdit = false;
        next.canDelete = false;
      }
      return {
        ...prev,
        [key]: next,
      };
    });
  }, [ensurePermissionEntry]);

  const handleToggleRow = useCallback((screen: ApplicationScreen, permissionField: PermissionToggleField) => {
    const current = ensurePermissionEntry(screen.screenCode);
    const nextValue = permissionField === 'canView' ? !current.canView : !current[permissionField];
    handleToggle(screen.screenCode, permissionField, nextValue);
  }, [ensurePermissionEntry, handleToggle]);

  const handleSave = useCallback(async () => {
    if (typeof selectedUserId !== 'number') {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = Object.values(permissions);
      const updated = await userAccessService.updateUserAccess(selectedUserId, payload);
      const map: Record<string, UserAccessPermission> = {};
      updated.forEach((entry) => {
        map[entry.screenCode.toUpperCase()] = {
          screenCode: entry.screenCode.toUpperCase(),
          canView: entry.canView,
          canCreate: entry.canCreate,
          canEdit: entry.canEdit,
          canDelete: entry.canDelete,
        };
      });
      setPermissions(map);
      setAlert({ type: 'success', title: 'Saved', message: 'Access updated successfully.' });
    } catch (err) {
      console.error('Failed to update access', err);
      setError('Unable to save access changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [permissions, selectedUserId]);

  const renderToggle = (screen: ApplicationScreen, permissionKey: PermissionToggleField, label: string) => {
    const entry = ensurePermissionEntry(screen.screenCode);
    const disabled = permissionKey !== 'canView' && !entry.canView;
    const checked = entry[permissionKey];
    return (
      <label className={`flex items-center justify-center gap-1 rounded border px-2 py-1 text-xs ${disabled ? 'opacity-40' : ''}`}>
        <input
          type="checkbox"
          disabled={disabled}
          checked={checked}
          onChange={() => handleToggleRow(screen, permissionKey)}
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        {label}
      </label>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Access Control"
          description="Grant page-level and UI capabilities per user."
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <label className="text-sm font-medium text-slate-700">
              Select user
              <select
                value={selectedUserId}
                onChange={handleUserChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Choose a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.username})
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={saving || typeof selectedUserId !== 'number'}
              onClick={handleSave}
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
          )}

          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center text-slate-500">Loading...</div>
          ) : typeof selectedUserId !== 'number' ? (
            <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Select a user to manage access permissions.
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {groupedScreens.map((group) => (
                <div key={group.section} className="rounded-xl border border-slate-200">
                  <div className="border-b bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                    {group.section}
                  </div>
                  <div className="divide-y divide-slate-100">
                    {group.screens.map((screen) => (
                      <div key={screen.id} className="grid gap-3 px-4 py-3 text-sm md:grid-cols-3 md:items-center">
                        <div>
                          <div className="font-medium text-slate-900">{getScreenDisplayName(screen)}</div>
                          {screen.description && (
                            <div className="text-xs text-slate-500">{screen.description}</div>
                          )}
                          {screen.routePath && (
                            <div className="text-xs text-slate-400">{screen.routePath}</div>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <div className="flex flex-wrap gap-2">
                            {renderToggle(screen, 'canView', 'View')}
                            {renderToggle(screen, 'canCreate', 'Create')}
                            {renderToggle(screen, 'canEdit', 'Edit')}
                            {renderToggle(screen, 'canDelete', 'Delete')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ToastContainer>
        {alert && (
          <Alert type={alert.type} title={alert.title} message={alert.message} onClose={() => setAlert(null)} />
        )}
      </ToastContainer>
    </AdminLayout>
  );
};

export default UserAccessPage;
