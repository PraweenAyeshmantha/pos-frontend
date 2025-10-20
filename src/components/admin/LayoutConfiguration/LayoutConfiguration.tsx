import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { configurationService } from '../../../services/configurationService';
import type { LayoutConfigFormData } from '../../../types/configuration';
import Alert from '../../common/Alert';
import type { AlertType } from '../../common/Alert';
import ToastContainer from '../../common/ToastContainer';

const defaultLayoutForm: LayoutConfigFormData = {
  layout_gradient_primary_color: '#4A90E2',
  layout_gradient_secondary_color: '#357ABD',
  layout_font_size: '14',
};

const colorFieldDefinitions = [
  {
    key: 'layout_gradient_primary_color' as const,
    label: 'Gradient Primary Color',
    helper: 'Starting color for gradients used across the POS interface.',
  },
  {
    key: 'layout_gradient_secondary_color' as const,
    label: 'Gradient Secondary Color',
    helper: 'Ending color that blends with the primary gradient.',
  },
];

type ColorFieldKey = (typeof colorFieldDefinitions)[number]['key'];
type MessageState = { type: AlertType; text: string } | null;

const isValidHexColor = (value: string) => /^#([0-9a-fA-F]{6})$/.test(value.trim());

const LayoutConfiguration: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<LayoutConfigFormData>({ ...defaultLayoutForm });
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
      const configs = await configurationService.getAllLayoutConfigurations();
      const configMap: Record<string, string> = {};

      configs.forEach((config) => {
        configMap[config.configKey] = config.configValue;
      });

      setFormData({
        layout_gradient_primary_color:
          configMap.layout_gradient_primary_color ?? defaultLayoutForm.layout_gradient_primary_color,
        layout_gradient_secondary_color:
          configMap.layout_gradient_secondary_color ?? defaultLayoutForm.layout_gradient_secondary_color,
        layout_font_size: configMap.layout_font_size ?? defaultLayoutForm.layout_font_size,
      });
    } catch (error) {
      console.error('Error fetching layout configurations:', error);
      showMessage('error', 'Failed to load layout configurations. Using default values.');
      setFormData({ ...defaultLayoutForm });
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchConfigurations();
  }, [fetchConfigurations]);

  const handleFieldChange = useCallback(<K extends keyof LayoutConfigFormData>(key: K, value: LayoutConfigFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const colorErrors = useMemo(() => {
    const errors: Partial<Record<ColorFieldKey, string>> = {};
    colorFieldDefinitions.forEach(({ key, label }) => {
      if (!isValidHexColor(formData[key])) {
        errors[key] = `${label} must be a valid hex color (e.g., #0055AA).`;
      }
    });
    return errors;
  }, [formData]);

  const fontSizeError = useMemo(() => {
    const rawValue = formData.layout_font_size.trim();
    if (rawValue === '') {
      return 'Font size is required.';
    }

    if (!/^\d+$/.test(rawValue)) {
      return 'Font size must be a whole number in pixels.';
    }

    const numericValue = Number(rawValue);
    if (numericValue < 10 || numericValue > 24) {
      return 'Font size should be between 10px and 24px.';
    }

    return '';
  }, [formData.layout_font_size]);

  const gradientPreviewStyle = useMemo(() => {
    const primaryColor = isValidHexColor(formData.layout_gradient_primary_color)
      ? formData.layout_gradient_primary_color
      : defaultLayoutForm.layout_gradient_primary_color;

    const secondaryColor = isValidHexColor(formData.layout_gradient_secondary_color)
      ? formData.layout_gradient_secondary_color
      : defaultLayoutForm.layout_gradient_secondary_color;

    return {
      background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
    } as React.CSSProperties;
  }, [formData]);

  const handleSave = useCallback(async () => {
    const invalidColor = colorFieldDefinitions.find(({ key }) => !isValidHexColor(formData[key]));
    if (invalidColor) {
      showMessage('error', `${invalidColor.label} must be a valid hex color (e.g., #0055AA).`);
      return;
    }

    if (fontSizeError) {
      showMessage('error', fontSizeError);
      return;
    }

    try {
      setSaving(true);
      const payload: Record<string, string> = {
        layout_gradient_primary_color: formData.layout_gradient_primary_color.trim(),
        layout_gradient_secondary_color: formData.layout_gradient_secondary_color.trim(),
        layout_font_size: formData.layout_font_size.trim(),
      };

      await configurationService.bulkUpdateConfigurations(payload, 'LAYOUT');
      showMessage('success', 'Layout settings saved successfully.');
    } catch (error) {
      console.error('Error saving layout configurations:', error);
      showMessage('error', 'Failed to save layout settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [fontSizeError, formData, showMessage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="text-gray-600">Loading layout configuration...</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="py-5 px-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">Gradient Colors</h2>
            <p className="mt-1 text-sm text-gray-500">Pick the brand colors that define your POS look and feel.</p>
          </div>

          <div className="divide-y divide-gray-200">
            {colorFieldDefinitions.map(({ key, label, helper }) => {
              const inputValue = isValidHexColor(formData[key])
                ? formData[key]
                : defaultLayoutForm[key];

              return (
                <div key={key} className="py-5 px-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <label className="font-semibold text-gray-800">{label}</label>
                        <span className="text-gray-400" title={helper}>ⓘ</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{helper}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={inputValue}
                        onChange={(event) => handleFieldChange(key, event.target.value)}
                        className="h-10 w-14 border border-gray-300 rounded"
                      />
                      <input
                        type="text"
                        value={formData[key]}
                        onChange={(event) => handleFieldChange(key, event.target.value)}
                        placeholder={defaultLayoutForm[key]}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  {colorErrors[key] && (
                    <p className="mt-2 text-sm text-red-500">{colorErrors[key]}</p>
                  )}
                </div>
              );
            })}

            <div className="py-5 px-6 bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <h3 className="font-semibold text-gray-800">Preview</h3>
                  <p className="mt-1 text-sm text-gray-500">Real-time preview of how the gradient will appear in the POS.</p>
                </div>
                <div
                  className="h-16 rounded-md shadow-inner w-full md:w-1/2"
                  style={gradientPreviewStyle}
                  aria-label="Gradient preview"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="py-5 px-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">Typography</h2>
            <p className="mt-1 text-sm text-gray-500">Adjust the base font size to keep interface text sharp and readable.</p>
          </div>

          <div className="py-5 px-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <label className="font-semibold text-gray-800">Font Size</label>
                  <span className="text-gray-400" title="Applies to most labels and buttons inside the POS.">ⓘ</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">Choose between 10px and 24px based on counter display visibility.</p>
              </div>
              <div className="w-full md:w-1/3">
                <div className="relative">
                  <input
                    type="number"
                    min={10}
                    max={24}
                    value={formData.layout_font_size}
                    onChange={(event) => handleFieldChange('layout_font_size', event.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">px</span>
                </div>
              </div>
            </div>
            {fontSizeError && (
              <p className="mt-2 text-sm text-red-500">{fontSizeError}</p>
            )}
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

export default LayoutConfiguration;
