import React, { memo, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { customerService } from '../../../services/customerService';
import type { Customer, CustomerFormValues, CreateCustomerRequest } from '../../../types/customer';
import type { RecordStatus } from '../../../types/configuration';

interface EditCustomerModalProps {
  customer: Customer;
  onClose: () => void;
  onSuccess: (customer: Customer) => void;
  mode?: 'edit' | 'view';
}

const STATUS_OPTIONS: Array<{ label: string; value: RecordStatus }> = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

const parseAddress = (address?: string): { line1: string; line2: string; city: string; state: string; postcode: string } => {
  if (!address) {
    return { line1: '', line2: '', city: '', state: '', postcode: '' };
  }
  const parts = address.split(',').map((part) => part.trim());
  return {
    line1: parts[0] || '',
    line2: parts[1] || '',
    city: parts[2] || '',
    state: parts[3] || '',
    postcode: parts[4] || '',
  };
};

const EditCustomerModal: React.FC<EditCustomerModalProps> = ({ customer, onClose, onSuccess, mode = 'edit' }) => {
  const isViewMode = mode === 'view';
  const addressParts = parseAddress(customer.address);

  const [formData, setFormData] = useState<CustomerFormValues>({
    name: customer.name || '',
    email: customer.email || '',
    phone: customer.phone || '',
    addressLine1: addressParts.line1,
    addressLine2: addressParts.line2,
    city: addressParts.city,
    state: addressParts.state,
    country: 'United States (US)',
    postcode: addressParts.postcode,
    taxNumber: customer.taxNumber || '',
    loyaltyPoints: String(customer.loyaltyPoints || 0),
    recordStatus: customer.recordStatus || 'ACTIVE',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleChange = useCallback((field: keyof CustomerFormValues, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  const handleDismiss = useCallback(() => {
    if (saving) {
      return;
    }
    onClose();
  }, [saving, onClose]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      
      if (isViewMode) {
        handleDismiss();
        return;
      }

      setError(null);

      if (!formData.name.trim()) {
        setError('Customer name is required');
        return;
      }

      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }

      setSaving(true);

      try {
        const fullAddress = [
          formData.addressLine1,
          formData.addressLine2,
          formData.city,
          formData.state,
          formData.postcode,
        ]
          .filter(Boolean)
          .join(', ');

        const payload: CreateCustomerRequest = {
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          address: fullAddress || undefined,
          taxNumber: formData.taxNumber.trim() || undefined,
          loyaltyPoints: parseInt(formData.loyaltyPoints) || 0,
          recordStatus: formData.recordStatus,
        };

        const updated = await customerService.update(customer.id, payload);
        onSuccess(updated);
      } catch (err) {
        console.error('Failed to update customer:', err);
        setError(err instanceof Error ? err.message : 'Failed to update customer');
        setSaving(false);
      }
    },
    [customer.id, formData, isViewMode, handleDismiss, onSuccess],
  );

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleDismiss}
      role="presentation"
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="presentation"
      >
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {isViewMode ? 'View Customer' : 'Edit Customer'}
            </h2>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-full p-2 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 focus:outline-none"
              aria-label={isViewMode ? 'Close view customer modal' : 'Close edit customer modal'}
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="max-h-[calc(100vh-12rem)] space-y-6 overflow-y-auto px-6 py-6">
            {error ? (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-customer-name" className="text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-customer-name"
                  type="text"
                  value={formData.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                  placeholder="Enter Name"
                  required
                  disabled={isViewMode}
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-customer-email" className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="edit-customer-email"
                  type="email"
                  value={formData.email}
                  onChange={(event) => handleChange('email', event.target.value)}
                  placeholder="Enter Email"
                  disabled={isViewMode}
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="edit-customer-phone" className="text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                id="edit-customer-phone"
                type="tel"
                value={formData.phone}
                onChange={(event) => handleChange('phone', event.target.value)}
                placeholder="Enter Phone Number"
                disabled={isViewMode}
                className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="edit-customer-address-1" className="text-sm font-medium text-gray-700">
                Address Line 1
              </label>
              <input
                id="edit-customer-address-1"
                type="text"
                value={formData.addressLine1}
                onChange={(event) => handleChange('addressLine1', event.target.value)}
                placeholder="Enter Address Line 1"
                disabled={isViewMode}
                className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="edit-customer-address-2" className="text-sm font-medium text-gray-700">
                Address Line 2
              </label>
              <input
                id="edit-customer-address-2"
                type="text"
                value={formData.addressLine2}
                onChange={(event) => handleChange('addressLine2', event.target.value)}
                placeholder="Enter Address Line 2"
                disabled={isViewMode}
                className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-customer-country" className="text-sm font-medium text-gray-700">
                  Country
                </label>
                <select
                  id="edit-customer-country"
                  value={formData.country}
                  onChange={(event) => handleChange('country', event.target.value)}
                  disabled={isViewMode}
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                  <option value="United States (US)">United States (US)</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-customer-state" className="text-sm font-medium text-gray-700">
                  State
                </label>
                <select
                  id="edit-customer-state"
                  value={formData.state}
                  onChange={(event) => handleChange('state', event.target.value)}
                  disabled={isViewMode}
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                  <option value="">Select State</option>
                  <option value="Alabama">Alabama</option>
                  <option value="Alaska">Alaska</option>
                  <option value="Arizona">Arizona</option>
                  <option value="Arkansas">Arkansas</option>
                  <option value="California">California</option>
                  <option value="Colorado">Colorado</option>
                  <option value="Connecticut">Connecticut</option>
                  <option value="Delaware">Delaware</option>
                  <option value="Florida">Florida</option>
                  <option value="Georgia">Georgia</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-customer-city" className="text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  id="edit-customer-city"
                  type="text"
                  value={formData.city}
                  onChange={(event) => handleChange('city', event.target.value)}
                  placeholder="Enter City"
                  disabled={isViewMode}
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-customer-postcode" className="text-sm font-medium text-gray-700">
                  Postcode
                </label>
                <input
                  id="edit-customer-postcode"
                  type="text"
                  value={formData.postcode}
                  onChange={(event) => handleChange('postcode', event.target.value)}
                  placeholder="Enter Postcode"
                  disabled={isViewMode}
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-customer-tax-number" className="text-sm font-medium text-gray-700">
                  Tax Number
                </label>
                <input
                  id="edit-customer-tax-number"
                  type="text"
                  value={formData.taxNumber}
                  onChange={(event) => handleChange('taxNumber', event.target.value)}
                  placeholder="Enter Tax Number"
                  disabled={isViewMode}
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-customer-loyalty-points" className="text-sm font-medium text-gray-700">
                  Loyalty Points
                </label>
                <input
                  id="edit-customer-loyalty-points"
                  type="number"
                  min="0"
                  value={formData.loyaltyPoints}
                  onChange={(event) => handleChange('loyaltyPoints', event.target.value)}
                  disabled={isViewMode}
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="edit-customer-status" className="text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="edit-customer-status"
                value={formData.recordStatus}
                onChange={(event) => handleChange('recordStatus', event.target.value as RecordStatus)}
                disabled={isViewMode}
                className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              type="button"
              onClick={handleDismiss}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isViewMode ? 'Close' : 'Cancel'}
            </button>
            {!isViewMode ? (
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? 'Saving...' : 'Update Customer'}
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default memo(EditCustomerModal);
