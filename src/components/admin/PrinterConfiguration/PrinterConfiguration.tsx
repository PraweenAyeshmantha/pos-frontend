import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { configurationService } from '../../../services/configurationService';
import type { PrinterConfigFormData } from '../../../types/configuration';
import Alert from '../../common/Alert';
import type { AlertType } from '../../common/Alert';
import ToastContainer from '../../common/ToastContainer';

type MessageState = { type: AlertType; text: string } | null;

type NumericFieldKey =
  | 'barcode_page_width'
  | 'barcode_page_height'
  | 'barcode_page_margin'
  | 'barcode_margin'
  | 'invoice_page_width'
  | 'invoice_page_height'
  | 'invoice_page_margin';

type FieldMeta = {
  label: string;
  helper: string;
  unit?: string;
  allowZero?: boolean;
};

type OrientationOption = {
  value: PrinterConfigFormData['barcode_orientation'];
  label: string;
};

const fallbackForm: PrinterConfigFormData = {
  barcode_page_width: '80',
  barcode_page_height: '40',
  barcode_page_margin: '5',
  barcode_margin: '2',
  barcode_orientation: 'HORIZONTAL',
  invoice_page_width: '80',
  invoice_page_height: '297',
  invoice_page_margin: '10',
};

const numericFieldMeta: Record<NumericFieldKey, FieldMeta> = {
  barcode_page_width: {
    label: 'Page Width (in mm)',
    helper: 'Defines the available width for printing barcode labels.',
    unit: 'mm',
  },
  barcode_page_height: {
    label: 'Page Height (in mm)',
    helper: 'Determines the height of each printable barcode panel.',
    unit: 'mm',
  },
  barcode_page_margin: {
    label: 'Page Margin (in mm)',
    helper: 'Sets outer padding to prevent cutting off barcode content.',
    unit: 'mm',
    allowZero: true,
  },
  barcode_margin: {
    label: 'Barcode Margin (in mm)',
    helper: 'Controls spacing between individual barcode labels.',
    unit: 'mm',
    allowZero: true,
  },
  invoice_page_width: {
    label: 'Page Width (in mm)',
    helper: 'Defines the width for printed invoices or receipts.',
    unit: 'mm',
  },
  invoice_page_height: {
    label: 'Page Height (in mm)',
    helper: 'Determines the printable height for invoices.',
    unit: 'mm',
  },
  invoice_page_margin: {
    label: 'Page Margin (in mm)',
    helper: 'Sets the blank space around invoice content.',
    unit: 'mm',
    allowZero: true,
  },
};

const barcodeNumericFields: NumericFieldKey[] = [
  'barcode_page_width',
  'barcode_page_height',
  'barcode_page_margin',
  'barcode_margin',
];

const invoiceNumericFields: NumericFieldKey[] = [
  'invoice_page_width',
  'invoice_page_height',
  'invoice_page_margin',
];

const numericFieldKeys: NumericFieldKey[] = [...barcodeNumericFields, ...invoiceNumericFields];

const orientationOptions: OrientationOption[] = [
  { value: 'HORIZONTAL', label: 'Horizontal' },
  { value: 'VERTICAL', label: 'Vertical' },
];

const PrinterConfiguration: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<PrinterConfigFormData>({ ...fallbackForm });
  const [message, setMessage] = useState<MessageState>(null);
  const messageTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearMessageTimeout = useCallback(() => {
    if (messageTimeout.current) {
      clearTimeout(messageTimeout.current);
      messageTimeout.current = null;
    }
  }, []);

  const showMessage = useCallback((type: AlertType, text: string) => {
    clearMessageTimeout();
    setMessage({ type, text });
    messageTimeout.current = setTimeout(() => setMessage(null), 3000);
  }, [clearMessageTimeout]);

  useEffect(() => clearMessageTimeout, [clearMessageTimeout]);

  const fetchConfigurations = useCallback(async () => {
    try {
      setLoading(true);
      const configs = await configurationService.getAllPrinterConfigurations();
      const configMap: Record<string, string> = {};

      configs.forEach((config) => {
        configMap[config.configKey] = config.configValue;
      });

      const orientation = (configMap.barcode_orientation ?? fallbackForm.barcode_orientation)
        .toString()
        .toUpperCase();

      const normalizedOrientation = orientationOptions.some((option) => option.value === orientation)
        ? (orientation as PrinterConfigFormData['barcode_orientation'])
        : fallbackForm.barcode_orientation;

      setFormData({
        barcode_page_width: configMap.barcode_page_width ?? fallbackForm.barcode_page_width,
        barcode_page_height: configMap.barcode_page_height ?? fallbackForm.barcode_page_height,
        barcode_page_margin: configMap.barcode_page_margin ?? fallbackForm.barcode_page_margin,
        barcode_margin: configMap.barcode_margin ?? fallbackForm.barcode_margin,
        barcode_orientation: normalizedOrientation,
        invoice_page_width: configMap.invoice_page_width ?? fallbackForm.invoice_page_width,
        invoice_page_height: configMap.invoice_page_height ?? fallbackForm.invoice_page_height,
        invoice_page_margin: configMap.invoice_page_margin ?? fallbackForm.invoice_page_margin,
      });
    } catch (error) {
      console.error('Error fetching printer configurations:', error);
      showMessage('error', 'Failed to load printer configurations. Using defaults for now.');
      setFormData({ ...fallbackForm });
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchConfigurations();
  }, [fetchConfigurations]);

  const handleNumericChange = useCallback((key: NumericFieldKey, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleOrientationChange = useCallback((value: PrinterConfigFormData['barcode_orientation']) => {
    setFormData((prev) => ({ ...prev, barcode_orientation: value }));
  }, []);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    numericFieldKeys.forEach((key) => {
      const rawValue = formData[key].toString().trim();
      const meta = numericFieldMeta[key];

      if (rawValue === '') {
        errors.push(`${meta.label} is required.`);
        return;
      }

      const numericValue = Number(rawValue);
      if (!Number.isFinite(numericValue)) {
        errors.push(`${meta.label} must be a number.`);
        return;
      }

      if (meta.allowZero ? numericValue < 0 : numericValue <= 0) {
        errors.push(`${meta.label} must be ${meta.allowZero ? 'zero or greater' : 'greater than zero'}.`);
      }
    });

    if (!orientationOptions.some((option) => option.value === formData.barcode_orientation)) {
      errors.push('Barcode orientation must be Horizontal or Vertical.');
    }

    return errors;
  }, [formData]);

  const handleSave = useCallback(async () => {
    if (validationErrors.length > 0) {
      showMessage('error', validationErrors[0]);
      return;
    }

    try {
      setSaving(true);
      const payload: Record<string, string> = {};

      (Object.keys(formData) as Array<keyof PrinterConfigFormData>).forEach((key) => {
        payload[key] = formData[key].toString().trim();
      });

      await configurationService.bulkUpdateConfigurations(payload, 'PRINTER');
      showMessage('success', 'Printer settings saved successfully.');
    } catch (error) {
      console.error('Error saving printer configurations:', error);
      showMessage('error', 'Failed to save printer settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [formData, showMessage, validationErrors]);

  const renderNumericField = useCallback((key: NumericFieldKey) => {
    const meta = numericFieldMeta[key];

    return (
      <div key={key} className="py-5 px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex items-start gap-3 md:max-w-xl">
            <div>
              <label className="font-semibold text-gray-800">{meta.label}</label>
              <p className="text-sm text-gray-500 mt-1">{meta.helper}</p>
            </div>
            <span className="text-gray-400 mt-1 cursor-default" title={meta.helper}>ⓘ</span>
          </div>
          <div className="w-full md:w-1/2 md:max-w-xs">
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                min={meta.allowZero ? 0 : 0.1}
                step="0.1"
                value={formData[key]}
                onChange={(event) => handleNumericChange(key, event.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-14"
              />
              {meta.unit && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">{meta.unit}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }, [formData, handleNumericChange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="text-gray-600">Loading printer configuration...</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="py-5 px-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">Barcode</h2>
            <p className="mt-1 text-sm text-gray-500">Fine-tune label dimensions to ensure barcodes print cleanly on every roll.</p>
          </div>

          <div className="divide-y divide-gray-200">
            {barcodeNumericFields.map(renderNumericField)}

            <div className="py-5 px-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div className="flex items-start gap-3 md:max-w-xl">
                  <div>
                    <label className="font-semibold text-gray-800">Barcode Orientation</label>
                    <p className="text-sm text-gray-500 mt-1">Switch between horizontal strips or vertical columns based on your printer feed.</p>
                  </div>
                  <span className="text-gray-400 mt-1 cursor-default" title="Determines how barcode labels are laid out on the page.">ⓘ</span>
                </div>
                <div className="w-full md:w-1/2 md:max-w-xs">
                  <select
                    value={formData.barcode_orientation}
                    onChange={(event) => handleOrientationChange(event.target.value as PrinterConfigFormData['barcode_orientation'])}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {orientationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="py-5 px-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">Invoice</h2>
            <p className="mt-1 text-sm text-gray-500">Match your receipt and invoice layout to the paper size you keep at the counter.</p>
          </div>

          <div className="divide-y divide-gray-200">
            {invoiceNumericFields.map(renderNumericField)}
          </div>
        </div>

        <p className="text-sm text-gray-500 italic">
          If you really like our plugin, please leave us a ⭐⭐⭐⭐⭐ rating, we'll really appreciate it.
        </p>

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

export default PrinterConfiguration;
