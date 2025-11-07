import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { configurationService } from '../../../services/configurationService';
import type { PwaConfigFormData } from '../../../types/configuration';
import Alert from '../../common/Alert';
import type { AlertType } from '../../common/Alert';
import ToastContainer from '../../common/ToastContainer';

type IconKey = 'pwa_icon_192' | 'pwa_icon_512';

type MessageState = { type: AlertType; text: string } | null;

const fallbackForm: PwaConfigFormData = {
  pwa_name: '',
  pwa_short_name: '',
  pwa_theme_color: '#2563eb',
  pwa_background_color: '#0f172a',
  pwa_icon_192: '',
  pwa_icon_512: '',
};

const iconDefinitions: Array<{
  key: IconKey;
  label: string;
  helper: string;
  previewSize: number;
}> = [
  {
    key: 'pwa_icon_192',
    label: 'App Icon (192x192)',
    helper: 'Shown on install prompts and app launcher tiles.',
    previewSize: 96,
  },
  {
    key: 'pwa_icon_512',
    label: 'App Icon (512x512)',
    helper: 'High resolution icon used for splash screens and larger displays.',
    previewSize: 144,
  },
];

const isValidHexColor = (value: string) => /^#([0-9a-fA-F]{6})$/.test(value.trim());

const PWAConfiguration: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<PwaConfigFormData>(fallbackForm);
  const [message, setMessage] = useState<MessageState>(null);
  const availableKeys = useRef<Set<string>>(new Set());

  const showMessage = useCallback((type: AlertType, text: string) => {
    setMessage({ type, text });
  }, []);

  const fetchConfigurations = useCallback(async () => {
    try {
      setLoading(true);
      const configs = await configurationService.getAllPwaConfigurations();
      const configMap: Record<string, string> = {};
      const keys = new Set<string>();

      configs.forEach((config) => {
        configMap[config.configKey] = config.configValue;
        keys.add(config.configKey);
      });

      availableKeys.current = keys;

      setFormData({
        pwa_name: configMap.pwa_name ?? '',
        pwa_short_name: configMap.pwa_short_name ?? '',
        pwa_theme_color: configMap.pwa_theme_color ?? '#2563eb',
        pwa_background_color: configMap.pwa_background_color ?? '#0f172a',
        pwa_icon_192: configMap.pwa_icon_192 ?? '',
        pwa_icon_512: configMap.pwa_icon_512 ?? '',
      });
    } catch (error) {
      console.error('Error fetching PWA configurations:', error);
      showMessage('error', 'Failed to load PWA configurations. Using defaults for now.');
      availableKeys.current = new Set();
      setFormData(fallbackForm);
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchConfigurations();
  }, [fetchConfigurations]);

  const handleFieldChange = useCallback((key: keyof PwaConfigFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleIconUpload = useCallback((key: IconKey, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setFormData((prev) => ({ ...prev, [key]: result }));
    };
    reader.readAsDataURL(file);
  }, []);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    if (!formData.pwa_name.trim()) {
      errors.push('PWA name is required.');
    }

    if (!formData.pwa_short_name.trim()) {
      errors.push('PWA short name is required.');
    } else if (formData.pwa_short_name.trim().length > 12) {
      errors.push('Short name should be 12 characters or fewer.');
    }

    if (!isValidHexColor(formData.pwa_theme_color)) {
      errors.push('Theme color must be a valid 6-digit hex color (e.g., #2563eb).');
    }

    if (!isValidHexColor(formData.pwa_background_color)) {
      errors.push('Background color must be a valid 6-digit hex color.');
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
      const payload: Record<string, string> = {
        pwa_name: formData.pwa_name.trim(),
        pwa_short_name: formData.pwa_short_name.trim(),
        pwa_theme_color: formData.pwa_theme_color.trim(),
        pwa_background_color: formData.pwa_background_color.trim(),
      };

      (['pwa_icon_192', 'pwa_icon_512'] as IconKey[]).forEach((key) => {
        if (availableKeys.current.size === 0 || availableKeys.current.has(key)) {
          payload[key] = formData[key] ?? '';
        }
      });

      await configurationService.bulkUpdateConfigurations(payload, 'PWA');
      showMessage('success', 'PWA settings saved successfully.');
    } catch (error) {
      console.error('Error saving PWA configurations:', error);
      showMessage('error', 'Failed to save PWA settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [formData, showMessage, validationErrors]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="text-gray-600">Loading PWA configuration...</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="py-5 px-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">Brand Identity</h2>
            <p className="mt-1 text-sm text-gray-500">Update the metadata customers will see when installing the POS as a PWA.</p>
          </div>

          <div className="divide-y divide-gray-200">
            <div className="py-5 px-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <label className="font-semibold text-gray-800">Name</label>
                  <span className="text-gray-400" title="Full name displayed on install screens.">ⓘ</span>
                </div>
                <input
                  type="text"
                  value={formData.pwa_name}
                  onChange={(event) => handleFieldChange('pwa_name', event.target.value)}
                  placeholder="Point of Sale"
                  className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="py-5 px-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <label className="font-semibold text-gray-800">Short Name</label>
                  <span className="text-gray-400" title="Short label used on the home screen. Keep it under 12 characters.">ⓘ</span>
                </div>
                <div className="w-full md:w-1/2">
                  <input
                    type="text"
                    value={formData.pwa_short_name}
                    onChange={(event) => handleFieldChange('pwa_short_name', event.target.value)}
                    maxLength={20}
                    placeholder="POS"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="mt-1 text-xs text-gray-500 text-right">{formData.pwa_short_name.trim().length}/12 recommended</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="py-5 px-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">Theme &amp; Colors</h2>
            <p className="mt-1 text-sm text-gray-500">Choose colors for the launch screen and browser UI chrome.</p>
          </div>

          <div className="divide-y divide-gray-200">
            <div className="py-5 px-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-3">
                  <label className="font-semibold text-gray-800">Theme Color</label>
                  <span className="text-gray-400" title="Applied to the browser toolbar and splash screen accent.">ⓘ</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={isValidHexColor(formData.pwa_theme_color) ? formData.pwa_theme_color : '#2563eb'}
                    onChange={(event) => handleFieldChange('pwa_theme_color', event.target.value)}
                    className="h-10 w-14 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    value={formData.pwa_theme_color}
                    onChange={(event) => handleFieldChange('pwa_theme_color', event.target.value)}
                    placeholder="#2563eb"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="py-5 px-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-3">
                  <label className="font-semibold text-gray-800">Background Color</label>
                  <span className="text-gray-400" title="Used for the splash screen background.">ⓘ</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={isValidHexColor(formData.pwa_background_color) ? formData.pwa_background_color : '#0f172a'}
                    onChange={(event) => handleFieldChange('pwa_background_color', event.target.value)}
                    className="h-10 w-14 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    value={formData.pwa_background_color}
                    onChange={(event) => handleFieldChange('pwa_background_color', event.target.value)}
                    placeholder="#0f172a"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="py-5 px-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">App Icons</h2>
            <p className="mt-1 text-sm text-gray-500">Upload PNG images with transparent backgrounds for best results.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 p-6">
            {iconDefinitions.map(({ key, label, helper, previewSize }) => {
              const preview = formData[key];
              return (
                <div key={key} className="border border-gray-200 rounded-lg p-6 flex flex-col gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800">{label}</h3>
                      <span className="text-gray-400" title="Click upload to replace the current icon.">ⓘ</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{helper}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div
                      className="border border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden"
                      style={{ width: previewSize, height: previewSize }}
                    >
                      {preview ? (
                        <img src={preview} alt={label} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-3xl">🛍️</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md font-medium cursor-pointer hover:bg-blue-700">
                        Upload Icon
                        <input
                          type="file"
                          accept="image/png,image/svg+xml,image/webp,image/jpeg"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              handleIconUpload(key, file);
                            }
                          }}
                        />
                      </label>
                      {preview && (
                        <button
                          type="button"
                          onClick={() => handleFieldChange(key, '')}
                          className="text-sm text-red-500 hover:text-red-600"
                        >
                          Remove icon
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
            onClose={() => setMessage(null)}
          />
        </ToastContainer>
      )}
    </>
  );
};

export default PWAConfiguration;
