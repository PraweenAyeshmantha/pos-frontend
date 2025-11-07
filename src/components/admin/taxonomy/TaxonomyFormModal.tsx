import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import type { RecordStatus } from '../../../types/configuration';
import type { TaxonomyFormValues } from '../../../types/taxonomy';

interface TaxonomyFormModalProps {
  open: boolean;
  mode: 'create' | 'edit' | 'view';
  entityName: string;
  onClose: () => void;
  initialValues?: TaxonomyFormValues;
  onSubmit: (values: TaxonomyFormValues) => Promise<void>;
}

const DEFAULT_FORM_VALUES: TaxonomyFormValues = {
  name: '',
  description: '',
  recordStatus: 'ACTIVE',
};

const RESOLVED_STATUS_OPTIONS: Array<{ label: string; value: RecordStatus }> = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

const resolveErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    return data?.message ?? data?.error ?? fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message || fallbackMessage;
  }

  return fallbackMessage;
};

const TaxonomyFormModal: React.FC<TaxonomyFormModalProps> = ({
  open,
  mode,
  entityName,
  onClose,
  initialValues,
  onSubmit,
}) => {
  const [formValues, setFormValues] = useState<TaxonomyFormValues>(() => ({
    ...DEFAULT_FORM_VALUES,
    ...initialValues,
  }));
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFormValues({
        ...DEFAULT_FORM_VALUES,
        ...initialValues,
      });
      setError(null);
    }
  }, [initialValues, open]);

  const title = useMemo(() => {
    if (mode === 'view') return `View ${entityName}`;
    return `${mode === 'edit' ? 'Edit' : 'Add'} ${entityName}`;
  }, [entityName, mode]);
  const submitLabel = mode === 'edit' ? 'Save Changes' : `Create ${entityName}`;

  const handleOverlayClick = useCallback(() => {
    if (!saving) {
      onClose();
    }
  }, [onClose, saving]);

  const handleContentClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  }, []);

  const handleFieldChange = useCallback(<K extends keyof TaxonomyFormValues>(field: K, value: TaxonomyFormValues[K]) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (saving) {
        return;
      }

      const trimmedName = formValues.name.trim();
      if (!trimmedName) {
        setError(`${entityName} name is required.`);
        return;
      }

      setSaving(true);
      setError(null);

      try {
        await onSubmit({
          name: trimmedName,
          description: formValues.description?.trim() ? formValues.description.trim() : undefined,
          recordStatus: formValues.recordStatus,
        });
      } catch (err) {
        setError(resolveErrorMessage(err, `Unable to ${mode === 'edit' ? 'update' : 'create'} ${entityName.toLowerCase()}.`));
        return;
      } finally {
        setSaving(false);
      }
    },
    [entityName, formValues.description, formValues.name, formValues.recordStatus, mode, onSubmit, saving],
  );

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
        onClick={handleContentClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="taxonomy-modal-title"
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-5">
          <div>
            <h2 id="taxonomy-modal-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {mode === 'view'
                ? `View the ${entityName.toLowerCase()} details.`
                : mode === 'edit'
                ? `Update the ${entityName.toLowerCase()} details and availability.`
                : `Provide details for the new ${entityName.toLowerCase()}.`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOverlayClick}
            className="rounded-full bg-white p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 01-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.414-1.414L8.586 10l-4.95-4.95A1 1 0 115.05 3.636L10 8.586z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="taxonomy-name" className="text-sm font-medium text-gray-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="taxonomy-name"
              type="text"
              value={formValues.name}
              onChange={(event) => handleFieldChange('name', event.target.value)}
              disabled={mode === 'view'}
              className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-500"
              maxLength={150}
              placeholder={`Enter ${entityName.toLowerCase()} name`}
              autoComplete="off"
              autoFocus={mode !== 'view'}
            />
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <label htmlFor="taxonomy-description" className="text-sm font-medium text-gray-700">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="taxonomy-description"
              value={formValues.description ?? ''}
              onChange={(event) => handleFieldChange('description', event.target.value)}
              disabled={mode === 'view'}
              className="min-h-[96px] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-500"
              maxLength={255}
              placeholder={`Add a short description for the ${entityName.toLowerCase()}`}
            />
            <p className="text-xs text-gray-500">Limit of 255 characters.</p>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <label htmlFor="taxonomy-status" className="text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="taxonomy-status"
              value={formValues.recordStatus}
              onChange={(event) => handleFieldChange('recordStatus', event.target.value as RecordStatus)}
              disabled={mode === 'view'}
              className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-500"
            >
              {RESOLVED_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleOverlayClick}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              {mode === 'view' ? 'Close' : 'Cancel'}
            </button>
            {mode !== 'view' && (
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? 'Saving...' : submitLabel}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};

export default TaxonomyFormModal;
