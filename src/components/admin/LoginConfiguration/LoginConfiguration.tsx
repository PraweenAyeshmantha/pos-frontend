import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { configurationService } from '../../../services/configurationService';
import type { LoginConfigFormData } from '../../../types/configuration';
import Alert from '../../common/Alert';
import type { AlertType } from '../../common/Alert';
import ToastContainer from '../../common/ToastContainer';

const defaultForm: LoginConfigFormData = {
  login_heading_text: 'Welcome to POS System',
  login_footer_text: 'Copyright 2025 POS System. All rights reserved.',
  login_button_text: 'Sign In',
  enable_remember_me: true,
  enable_forgot_password: true,
  login_bg_primary_color: '#4A90E2',
  login_bg_secondary_color: '#357ABD',
  login_font_color: '#FFFFFF',
};

const colorFieldDefinitions = [
  {
    key: 'login_bg_primary_color' as const,
    label: 'Background Primary Color',
    helper: 'Primary color used for the login screen background gradient.',
    fallback: '#4A90E2',
  },
  {
    key: 'login_bg_secondary_color' as const,
    label: 'Background Secondary Color',
    helper: 'Secondary color that blends with the primary gradient.',
    fallback: '#357ABD',
  },
  {
    key: 'login_font_color' as const,
    label: 'Font Color',
    helper: 'Text color applied to the login screen elements.',
    fallback: '#FFFFFF',
  },
];

type ColorFieldKey = (typeof colorFieldDefinitions)[number]['key'];

type MessageState = { type: AlertType; text: string } | null;

const isValidHexColor = (value: string) => /^#([0-9a-fA-F]{6})$/.test(value.trim());

const LoginConfiguration: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<LoginConfigFormData>(defaultForm);
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
      const configs = await configurationService.getAllLoginConfigurations();
      const configMap: Record<string, string> = {};

      configs.forEach((config) => {
        configMap[config.configKey] = config.configValue;
      });

      setFormData({
        login_heading_text: configMap.login_heading_text ?? defaultForm.login_heading_text,
        login_footer_text: configMap.login_footer_text ?? defaultForm.login_footer_text,
        login_button_text: configMap.login_button_text ?? defaultForm.login_button_text,
        enable_remember_me: (configMap.enable_remember_me ?? 'true') === 'true',
        enable_forgot_password: (configMap.enable_forgot_password ?? 'true') === 'true',
        login_bg_primary_color: configMap.login_bg_primary_color ?? defaultForm.login_bg_primary_color,
        login_bg_secondary_color: configMap.login_bg_secondary_color ?? defaultForm.login_bg_secondary_color,
        login_font_color: configMap.login_font_color ?? defaultForm.login_font_color,
      });
    } catch (error) {
      console.error('Error fetching login configurations:', error);
      showMessage('error', 'Failed to load login configurations. Using default values.');
      setFormData(defaultForm);
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchConfigurations();
  }, [fetchConfigurations]);

  const handleFieldChange = useCallback(<K extends keyof LoginConfigFormData>(key: K, value: LoginConfigFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const colorErrors = useMemo(() => {
    const errors: Partial<Record<ColorFieldKey, string>> = {};
    colorFieldDefinitions.forEach(({ key, label }) => {
      if (!isValidHexColor(formData[key])) {
        errors[key] = `${label} must be a valid hex color (e.g., #123ABC).`;
      }
    });
    return errors;
  }, [formData]);

  const handleSave = useCallback(async () => {
    if (!formData.login_heading_text.trim()) {
      showMessage('error', 'Heading text is required.');
      return;
    }

    if (!formData.login_button_text.trim()) {
      showMessage('error', 'Login button text is required.');
      return;
    }

    const invalidColor = colorFieldDefinitions.find(({ key }) => !isValidHexColor(formData[key]));
    if (invalidColor) {
      showMessage('error', `${invalidColor.label} must be a valid hex color (e.g., #123ABC).`);
      return;
    }

    try {
      setSaving(true);
      const payload: Record<string, string> = {
        login_heading_text: formData.login_heading_text.trim(),
        login_footer_text: formData.login_footer_text.trim(),
        login_button_text: formData.login_button_text.trim(),
        enable_remember_me: String(formData.enable_remember_me),
        enable_forgot_password: String(formData.enable_forgot_password),
        login_bg_primary_color: formData.login_bg_primary_color.trim(),
        login_bg_secondary_color: formData.login_bg_secondary_color.trim(),
        login_font_color: formData.login_font_color.trim(),
      };

      await configurationService.bulkUpdateConfigurations(payload, 'LOGIN');
      showMessage('success', 'Login settings saved successfully.');
    } catch (error) {
      console.error('Error saving login configurations:', error);
      showMessage('error', 'Failed to save login settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [formData, showMessage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="text-gray-600">Loading login configuration...</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="py-5 px-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">Login Messaging</h2>
            <p className="mt-1 text-sm text-gray-500">Customize the text users see when accessing the POS login screen.</p>
          </div>

          <div className="divide-y divide-gray-200">
            <div className="py-5 px-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <label className="font-semibold text-gray-800">Heading Text</label>
                  <span className="text-gray-400" title="Displayed prominently at the top of the login form.">ⓘ</span>
                </div>
                <input
                  type="text"
                  value={formData.login_heading_text}
                  onChange={(event) => handleFieldChange('login_heading_text', event.target.value)}
                  placeholder="Welcome to Point of Sale"
                  className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="py-5 px-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <label className="font-semibold text-gray-800">Footer Text</label>
                  <span className="text-gray-400" title="Appears beneath the login form for notices or help text.">ⓘ</span>
                </div>
                <input
                  type="text"
                  value={formData.login_footer_text}
                  onChange={(event) => handleFieldChange('login_footer_text', event.target.value)}
                  placeholder="Thanks for using the Point of Sale"
                  className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="py-5 px-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <label className="font-semibold text-gray-800">Login Button Text</label>
                  <span className="text-gray-400" title="Shown on the primary login action button.">ⓘ</span>
                </div>
                <input
                  type="text"
                  value={formData.login_button_text}
                  onChange={(event) => handleFieldChange('login_button_text', event.target.value)}
                  placeholder="Log in"
                  className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="py-5 px-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">Login Options</h2>
            <p className="mt-1 text-sm text-gray-500">Toggle optional features to tailor the login experience for staff.</p>
          </div>

          <div className="divide-y divide-gray-200">
            <div className="py-5 px-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <label className="font-semibold text-gray-800">Enable Remember Me Option</label>
                  <span className="text-gray-400" title="Allow staff to stay signed in between sessions.">ⓘ</span>
                </div>
                <label className="inline-flex items-center gap-3 text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.enable_remember_me}
                    onChange={(event) => handleFieldChange('enable_remember_me', event.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  Remember Me
                </label>
              </div>
            </div>

            <div className="py-5 px-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <label className="font-semibold text-gray-800">Enable Forgot Password Option</label>
                  <span className="text-gray-400" title="Show the password recovery link for quick reset support.">ⓘ</span>
                </div>
                <label className="inline-flex items-center gap-3 text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.enable_forgot_password}
                    onChange={(event) => handleFieldChange('enable_forgot_password', event.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  Forgot Password
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="py-5 px-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">Styling</h2>
            <p className="mt-1 text-sm text-gray-500">Adjust colors to align the login page with your brand guidelines.</p>
          </div>

          <div className="divide-y divide-gray-200">
            {colorFieldDefinitions.map(({ key, label, helper, fallback }) => {
              const inputValue = isValidHexColor(formData[key]) ? formData[key] : fallback;
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
                        placeholder={fallback}
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

export default LoginConfiguration;
