import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { paymentMethodService } from '../../../services/paymentMethodService';
import type { AlertType } from '../../common/Alert';
import type { RecordStatus } from '../../../types/configuration';
import Alert from '../../common/Alert';
import ToastContainer from '../../common/ToastContainer';

interface PaymentMethodFormState {
  id?: number;
  slug: string;
  name: string;
  description?: string;
  recordStatus: RecordStatus;
  isDefault?: boolean;
  tempId: string;
  isNew?: boolean;
  hasChanges?: boolean;
}

const PaymentsConfiguration: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodFormState[]>([]);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const [message, setMessage] = useState<{ type: AlertType; text: string } | null>(null);
  const messageTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMessage = useCallback((type: AlertType, text: string) => {
    if (messageTimeout.current) {
      clearTimeout(messageTimeout.current);
    }
    setMessage({ type, text });
    messageTimeout.current = setTimeout(() => setMessage(null), 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (messageTimeout.current) {
        clearTimeout(messageTimeout.current);
      }
    };
  }, []);

  const slugify = useCallback((value: string) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-_]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_');
  }, []);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      setLoading(true);
      const methods = await paymentMethodService.getAll();
      const normalized = methods.map((method) => ({
        id: method.id,
        slug: method.slug,
        name: method.name,
        description: method.description,
        recordStatus: method.recordStatus,
        isDefault: method.isDefault,
        tempId: `existing-${method.id}`,
        isNew: false,
        hasChanges: false,
      }));
      setPaymentMethods(normalized);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      showMessage('error', 'Failed to load payment methods.');
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  const handleAddRow = () => {
    const now = Date.now();
    setPaymentMethods((prev) => [
      ...prev,
      {
        tempId: `new-${now}`,
        id: undefined,
        slug: '',
        name: '',
        description: '',
        recordStatus: 'ACTIVE',
        isDefault: false,
        isNew: true,
        hasChanges: true,
      },
    ]);
  };

  const handleFieldChange = (tempId: string, field: 'name' | 'slug' | 'recordStatus', value: string | RecordStatus) => {
    setPaymentMethods((prev) =>
      prev.map((method) => {
        if (method.tempId !== tempId) {
          return method;
        }

        if (field === 'recordStatus') {
          return {
            ...method,
            recordStatus: value as RecordStatus,
            hasChanges: true,
          };
        }

        if (field === 'slug') {
          return {
            ...method,
            slug: slugify(String(value)),
            hasChanges: true,
          };
        }

        if (field === 'name') {
          const nextName = String(value);
          if (method.isNew && !method.slug) {
            const autoSlug = slugify(nextName);
            return {
              ...method,
              name: nextName,
              slug: autoSlug,
              hasChanges: true,
            };
          }

          return {
            ...method,
            name: nextName,
            hasChanges: true,
          };
        }

        return method;
      }),
    );
  };

  const handleDeleteRow = (tempId: string) => {
    setPaymentMethods((prev) => {
      const target = prev.find((method) => method.tempId === tempId);
      if (!target) {
        return prev;
      }

      if (target.isDefault) {
        showMessage('warning', 'The default payment method cannot be removed.');
        return prev;
      }

      if (target.id) {
        setDeletedIds((ids) => (ids.includes(target.id!) ? ids : [...ids, target.id!]));
      }

      return prev.filter((method) => method.tempId !== tempId);
    });
  };

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    const slugSet = new Set<string>();

    paymentMethods.forEach((method) => {
      const trimmedName = method.name.trim();
      if (!trimmedName) {
        errors.push('Payment method name is required.');
      }

      const trimmedSlug = method.slug.trim();
      if (method.isNew && !trimmedSlug) {
        errors.push('Slug is required for new payment methods.');
      }

      if (trimmedSlug) {
        const normalizedSlug = trimmedSlug.toLowerCase();
        if (slugSet.has(normalizedSlug)) {
          errors.push(`Duplicate slug detected: ${trimmedSlug}`);
        } else {
          slugSet.add(normalizedSlug);
        }
      }
    });

    return errors;
  }, [paymentMethods]);

  const handleSave = async () => {
    if (validationErrors.length > 0) {
      showMessage('error', validationErrors[0]);
      return;
    }

    try {
      setSaving(true);

      const creations = paymentMethods.filter((method) => method.isNew);
      const updates = paymentMethods.filter((method) => !method.isNew && method.hasChanges && method.id);

      if (deletedIds.length > 0) {
        await Promise.all(deletedIds.map((id) => paymentMethodService.remove(id)));
        setDeletedIds([]);
      }

      if (updates.length > 0) {
        await Promise.all(
          updates.map((method) =>
            paymentMethodService.update(method.id!, {
              name: method.name.trim(),
              description: method.description,
              recordStatus: method.recordStatus,
            }),
          ),
        );
      }

      if (creations.length > 0) {
        await Promise.all(
          creations.map((method) =>
            paymentMethodService.create({
              slug: method.slug.trim(),
              name: method.name.trim(),
              description: method.description,
              recordStatus: method.recordStatus,
              isDefault: method.isDefault ?? false,
            }),
          ),
        );
      }

      await fetchPaymentMethods();
      showMessage('success', 'Payment methods saved successfully.');
    } catch (error) {
      console.error('Error saving payment methods:', error);
      showMessage('error', 'Failed to save payment methods.');
      await fetchPaymentMethods();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-600">Loading payment methods...</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_56px] gap-4 bg-gray-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <div className="flex items-center space-x-2">
              <span>Name</span>
              <span className="text-gray-400" title="Customer-facing label displayed on the POS.">ⓘ</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Slug</span>
              <span className="text-gray-400" title="Unique identifier used by integrations.">ⓘ</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Status</span>
              <span className="text-gray-400" title="Enable or disable availability at the POS.">ⓘ</span>
            </div>
            <div className="flex items-center justify-end">
              <span className="sr-only">Actions</span>
            </div>
          </div>

          {paymentMethods.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-500 text-sm">
              No payment methods configured yet. Add one to get started.
            </div>
          ) : (
            paymentMethods.map((method) => (
              <div
                key={method.tempId}
                className="grid grid-cols-[repeat(3,minmax(0,1fr))_56px] gap-4 px-6 py-4 items-center text-sm border-t border-gray-200"
              >
                <input
                  type="text"
                  value={method.name}
                  onChange={(event) => handleFieldChange(method.tempId, 'name', event.target.value)}
                  placeholder="Cash"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  type="text"
                  value={method.slug}
                  onChange={(event) => handleFieldChange(method.tempId, 'slug', event.target.value)}
                  placeholder="cash"
                  disabled={!method.isNew}
                  className={`w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    method.isNew ? '' : 'bg-gray-100 cursor-not-allowed'
                  }`}
                />

                <select
                  value={method.recordStatus}
                  onChange={(event) => handleFieldChange(method.tempId, 'recordStatus', event.target.value as RecordStatus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="ACTIVE">Enabled</option>
                  <option value="INACTIVE">Disabled</option>
                </select>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDeleteRow(method.tempId)}
                    disabled={method.isDefault || saving}
                    className={`p-2 rounded hover:bg-red-50 transition-colors ${
                      method.isDefault || saving ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:text-red-600'
                    }`}
                    title={method.isDefault ? 'Default payment method cannot be removed' : 'Remove payment method'}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M10 7V5a2 2 0 0 1 2-2 2 2 0 0 1 2 2v2m3 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 bg-gray-50 border-t border-gray-200">
            <button
              type="button"
              onClick={handleAddRow}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 font-medium transition-colors disabled:border-gray-300 disabled:text-gray-400"
            >
              Add Row
            </button>
            <span className="text-gray-500 text-sm italic">
              If you really like our plugin, please leave us a ⭐⭐⭐⭐⭐ rating, we'll really appreciate it.
            </span>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`px-8 py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed ${
              saving ? 'opacity-80' : ''
            }`}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {message && (
        <ToastContainer>
          <Alert
            type={message.type}
            title={message.type.charAt(0).toUpperCase() + message.type.slice(1)}
            message={message.text}
          />
        </ToastContainer>
      )}
    </>
  );
};

export default PaymentsConfiguration;
