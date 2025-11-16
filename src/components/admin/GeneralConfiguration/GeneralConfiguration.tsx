import React, { useState, useEffect, memo, useCallback } from 'react';
import { configurationService } from '../../../services/configurationService';
import type { BusinessMode, GeneralConfigFormData, SystemCurrency } from '../../../types/configuration';
import Alert from '../../common/Alert';
import type { AlertType } from '../../common/Alert';
import ToastContainer from '../../common/ToastContainer';
import PaymentsConfiguration from '../PaymentsConfiguration/PaymentsConfiguration';
import PWAConfiguration from '../PWAConfiguration/PWAConfiguration';
import LoginConfiguration from '../LoginConfiguration/LoginConfiguration';
import PrinterConfiguration from '../PrinterConfiguration/PrinterConfiguration';
import LayoutConfiguration from '../LayoutConfiguration/LayoutConfiguration';
import AdminPageHeader from '../../layout/AdminPageHeader';
import { persistSystemCurrency } from '../../../hooks/useSystemCurrency';

const BUSINESS_MODE_STORAGE_KEY = 'posBusinessMode';

const tabDefinitions = [
  { key: 'general', label: 'General' },
  { key: 'payments', label: 'Payments' },
  { key: 'pwa', label: 'PWA' },
  { key: 'login', label: 'Login' },
  { key: 'printer', label: 'Printer' },
  { key: 'layout', label: 'Layout' },
] as const;

type TabKey = typeof tabDefinitions[number]['key'];

const tabDescriptions: Record<TabKey, string> = {
  general: 'Configure global POS defaults and feature toggles.',
  payments: 'Manage tender types available to cashiers.',
  pwa: 'Adjust Progressive Web App install and kiosk options.',
  login: 'Control authentication behavior and session rules.',
  printer: 'Connect receipt printers and manage output settings.',
  layout: 'Customize register layout, shortcuts, and panels.',
};

const persistBusinessMode = (mode: BusinessMode) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(BUSINESS_MODE_STORAGE_KEY, mode);
  }
};

const GeneralConfiguration: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [message, setMessage] = useState<{ type: AlertType; text: string } | null>(null);
  
  const [formData, setFormData] = useState<GeneralConfigFormData>({
    license_key: '',
    module_enabled: true,
    inventory_type: 'CUSTOM',
    default_order_status: 'PENDING',
    default_barcode_type: 'PRODUCT_ID',
    system_currency: 'USD',
    enable_order_emails: false,
    enable_split_payment: true,
    enable_order_note: true,
    enable_offline_orders: false,
    enable_custom_product: true,
    enable_cash_drawer_popup: true,
    show_variations_as_products: false,
    enable_weight_based_pricing: false,
    auto_send_to_kitchen_on_hold: false,
    logo_url: '',
    default_customer_id: '',
    pos_endpoint: '/pos',
    kitchen_endpoint: '/kitchen',
    business_mode: 'RETAIL',
  });

  const [logoPreview, setLogoPreview] = useState<string>('');

  const fetchConfigurations = useCallback(async () => {
    try {
      setLoading(true);
      const configs = await configurationService.getAllGeneralConfigurations();
      
      // Convert array of configs to form data
      const configMap: Record<string, string> = {};
      configs.forEach(config => {
        configMap[config.configKey] = config.configValue;
      });

      const resolvedMode = (configMap.business_mode as BusinessMode) || 'RETAIL';
      const resolvedCurrency: SystemCurrency = configMap.system_currency === 'LKR' ? 'LKR' : 'USD';
      const nextFormData: GeneralConfigFormData = {
        license_key: configMap.license_key || '',
        module_enabled: configMap.module_enabled === 'true',
        inventory_type: (configMap.inventory_type || 'CUSTOM') as 'CUSTOM' | 'CENTRALIZED',
        default_order_status: configMap.default_order_status || 'PENDING',
        default_barcode_type: (configMap.default_barcode_type || 'PRODUCT_ID') as 'PRODUCT_ID' | 'SKU',
        system_currency: resolvedCurrency,
        enable_order_emails: configMap.enable_order_emails === 'true',
        enable_split_payment: configMap.enable_split_payment === 'true',
        enable_order_note: configMap.enable_order_note === 'true',
        enable_offline_orders: configMap.enable_offline_orders === 'true',
        enable_custom_product: configMap.enable_custom_product === 'true',
        enable_cash_drawer_popup: configMap.enable_cash_drawer_popup === 'true',
        show_variations_as_products: configMap.show_variations_as_products === 'true',
        enable_weight_based_pricing: configMap.enable_weight_based_pricing === 'true',
        auto_send_to_kitchen_on_hold: configMap.auto_send_to_kitchen_on_hold === 'true',
        logo_url: configMap.logo_url || '',
        default_customer_id: configMap.default_customer_id || '',
        pos_endpoint: configMap.pos_endpoint || '/pos',
        kitchen_endpoint: configMap.kitchen_endpoint || '/kitchen',
        business_mode: resolvedMode,
      };

      setFormData(nextFormData);
      persistBusinessMode(resolvedMode);
      persistSystemCurrency(resolvedCurrency);

      if (configMap.logo_url) {
        setLogoPreview(configMap.logo_url);
      }
    } catch (error) {
      console.error('Error fetching configurations:', error);
  setMessage({ type: 'error', text: 'Failed to load configurations. Using default values.' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch configurations on component mount
  useEffect(() => {
    fetchConfigurations();
  }, [fetchConfigurations]);

  const handleInputChange = useCallback((key: keyof GeneralConfigFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Convert form data to configuration format
      const configurations: Record<string, string> = {
        license_key: formData.license_key,
        module_enabled: String(formData.module_enabled),
        inventory_type: formData.inventory_type,
        default_order_status: formData.default_order_status,
        default_barcode_type: formData.default_barcode_type,
        system_currency: formData.system_currency,
        enable_order_emails: String(formData.enable_order_emails),
        enable_split_payment: String(formData.enable_split_payment),
        enable_order_note: String(formData.enable_order_note),
        enable_offline_orders: String(formData.enable_offline_orders),
        enable_custom_product: String(formData.enable_custom_product),
        enable_cash_drawer_popup: String(formData.enable_cash_drawer_popup),
        show_variations_as_products: String(formData.show_variations_as_products),
        enable_weight_based_pricing: String(formData.enable_weight_based_pricing),
        auto_send_to_kitchen_on_hold: String(formData.auto_send_to_kitchen_on_hold),
        logo_url: formData.logo_url,
        default_customer_id: formData.default_customer_id,
        pos_endpoint: formData.pos_endpoint,
        kitchen_endpoint: formData.kitchen_endpoint,
        business_mode: formData.business_mode,
      };

      await configurationService.bulkUpdateConfigurations(configurations);
      persistBusinessMode(formData.business_mode);
      persistSystemCurrency(formData.system_currency as SystemCurrency);
  setMessage({ type: 'success', text: 'Configurations saved successfully!' });
    } catch (error) {
      console.error('Error saving configurations:', error);
      setMessage({ type: 'error', text: 'Failed to save configurations' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setFormData(prev => ({ ...prev, logo_url: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  const activeTabLabel = tabDefinitions.find((tab) => tab.key === activeTab)?.label ?? 'General';
  const activeTabDescription = tabDescriptions[activeTab];

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title={`${activeTabLabel} Configuration`}
        description={activeTabDescription}
      />

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50/70 px-3 py-2 sm:px-5">
          {tabDefinitions.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                activeTab === tab.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 sm:p-8">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Activate License */}
              <div className="flex items-center justify-between border-b border-gray-200 py-4">
                <div className="flex items-center space-x-3">
                  <label className="font-semibold text-gray-800">Activate License</label>
                  <button className="text-gray-400 hover:text-gray-600" title="License activation information">
                    ⓘ
                  </button>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    className={`px-4 py-2 font-medium hover:opacity-90 rounded ${
                      formData.license_key ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {formData.license_key ? 'Activated' : 'Activate'}
                  </button>
                  <a href="#" className="text-sm text-blue-600 hover:underline">
                    How to find your purchase code?
                  </a>
                </div>
              </div>

              {/* Enable/Disable Module */}
              <div className="flex items-center justify-between border-b border-gray-200 py-4">
                <div className="flex items-center space-x-3">
                  <label className="font-semibold text-gray-800">Enable/Disable</label>
                  <button className="text-gray-400 hover:text-gray-600" title="Enable/Disable information">
                    ⓘ
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.module_enabled}
                    onChange={(e) => handleInputChange('module_enabled', e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Enable MultiPOS - Point of Sale for WooCommerce</span>
                </div>
              </div>

              {/* Inventory Type */}
              <div className="flex items-center justify-between border-b border-gray-200 py-4">
                <div className="flex items-center space-x-3">
                  <label className="font-semibold text-gray-800">Inventory Type</label>
                  <button className="text-gray-400 hover:text-gray-600" title="Inventory Type information">
                    ⓘ
                  </button>
                </div>
                <select
                  value={formData.inventory_type}
                  onChange={(e) => handleInputChange('inventory_type', e.target.value)}
                  className="min-w-[300px] rounded-md border border-gray-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CUSTOM">Custom/Manual Stock</option>
                  <option value="CENTRALIZED">Centralized Stock</option>
                </select>
              </div>

              {/* Business Mode */}
              <div className="flex flex-col gap-2 border-b border-gray-200 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <label className="font-semibold text-gray-800">Business Mode</label>
                    <button className="text-gray-400 hover:text-gray-600" title="Business mode information">
                      ⓘ
                    </button>
                  </div>
                  <select
                    value={formData.business_mode}
                    onChange={(event) => handleInputChange('business_mode', event.target.value as BusinessMode)}
                    className="min-w-[300px] rounded-md border border-gray-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="RETAIL">Retail / Grocery</option>
                    <option value="RESTAURANT_CAFE">Restaurant / Cafe</option>
                  </select>
                </div>
                <p className="text-sm text-slate-500">
                  Restaurant mode unlocks tables, kitchen routing, and dine-in workflows. Choose Retail for counter-only operations.
                </p>
              </div>

              {/* Order Status */}
              <div className="flex items-center justify-between border-b border-gray-200 py-4">
                <div className="flex items-center space-x-3">
                  <label className="font-semibold text-gray-800">Order Status</label>
                  <button className="text-gray-400 hover:text-gray-600" title="Order Status information">
                    ⓘ
                  </button>
                </div>
                <select
                  value={formData.default_order_status}
                  onChange={(e) => handleInputChange('default_order_status', e.target.value)}
                  className="min-w-[300px] rounded-md border border-gray-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING">Pending</option>
                  <option value="PREPARING">Preparing</option>
                  <option value="READY">Ready</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="REFUNDED">Refunded</option>
                  <option value="ON_HOLD">On Hold</option>
                </select>
              </div>

              {/* Default Product Barcode */}
              <div className="flex items-center justify-between border-b border-gray-200 py-4">
                <div className="flex items-center space-x-3">
                  <label className="font-semibold text-gray-800">Default Product Barcode</label>
                  <button className="text-gray-400 hover:text-gray-600" title="Barcode information">
                    ⓘ
                  </button>
                </div>
                <select
                  value={formData.default_barcode_type}
                  onChange={(e) => handleInputChange('default_barcode_type', e.target.value)}
                  className="min-w-[300px] rounded-md border border-gray-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PRODUCT_ID">Product ID</option>
                  <option value="SKU">SKU</option>
                </select>
              </div>

              {/* System Currency */}
              <div className="flex items-center justify-between border-b border-gray-200 py-4">
                <div className="flex items-center space-x-3">
                  <label className="font-semibold text-gray-800">System Currency</label>
                  <button className="text-gray-400 hover:text-gray-600" title="System currency information">
                    ⓘ
                  </button>
                </div>
                <select
                  value={formData.system_currency}
                  onChange={(e) => handleInputChange('system_currency', e.target.value as SystemCurrency)}
                  className="min-w-[300px] rounded-md border border-gray-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD — US Dollar ($)</option>
                  <option value="LKR">LKR — Sri Lankan Rupee (Rs)</option>
                </select>
              </div>

              {/* Enable Order Mails */}
              <div className="flex items-center justify-between border-b border-gray-200 py-4">
                <div className="flex items-center space-x-3">
                  <label className="font-semibold text-gray-800">Enable/Disable</label>
                  <button className="text-gray-400 hover:text-gray-600" title="Order Mails information">
                    ⓘ
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.enable_order_emails}
                    onChange={(e) => handleInputChange('enable_order_emails', e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Enable Order Mails</span>
                </div>
              </div>

              {/* Enable Split/Multiple Payment Methods */}
              <div className="flex items-center justify-between border-b border-gray-200 py-4">
                <div className="flex items-center space-x-3">
                  <label className="font-semibold text-gray-800">Enable/Disable</label>
                  <button className="text-gray-400 hover:text-gray-600" title="Split Payment information">
                    ⓘ
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.enable_split_payment}
                    onChange={(e) => handleInputChange('enable_split_payment', e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Enable Split/Multiple Payment Methods</span>
                </div>
              </div>

              {/* Enable Order Note */}
              <div className="flex items-center justify-between border-b border-gray-200 py-4">
                <div className="flex items-center space-x-3">
                  <label className="font-semibold text-gray-800">Enable/Disable</label>
                  <button className="text-gray-400 hover:text-gray-600" title="Order Note information">
                    ⓘ
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.enable_order_note}
                    onChange={(e) => handleInputChange('enable_order_note', e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Enable Order Note</span>
                </div>
              </div>

              {/* Enable Offline Orders */}
              <div className="flex items-center justify-between border-b border-gray-200 py-4">
                <div className="flex items-center space-x-3">
                  <label className="font-semibold text-gray-800">Enable/Disable</label>
                  <button className="text-gray-400 hover:text-gray-600" title="Offline Orders information">
                    ⓘ
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.enable_offline_orders}
                    onChange={(e) => handleInputChange('enable_offline_orders', e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Enable Offline Orders for Online Mode (Fast Orders)</span>
                </div>
              </div>

              {/* Enable Adding Custom Product */}
              <div className="flex items-center justify-between border-b border-gray-200 py-4">
                <div className="flex items-center space-x-3">
                  <label className="font-semibold text-gray-800">Enable/Disable</label>
                  <button className="text-gray-400 hover:text-gray-600" title="Custom Product information">
                    ⓘ
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.enable_custom_product}
                    onChange={(e) => handleInputChange('enable_custom_product', e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Enable Adding Custom Product</span>
                </div>
              </div>

              {/* Enable Open Cash Drawer Popup */}
              <div className="flex items-center justify-between border-b border-gray-200 py-4">
                <div className="flex items-center space-x-3">
                  <label className="font-semibold text-gray-800">Enable/Disable</label>
                  <button className="text-gray-400 hover:text-gray-600" title="Cash Drawer information">
                    ⓘ
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.enable_cash_drawer_popup}
                    onChange={(e) => handleInputChange('enable_cash_drawer_popup', e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Enable Open Cash Drawer Popup</span>
                </div>
              </div>

              {/* Show Variations as Different Products */}
              <div className="flex items-center justify-between border-b border-gray-200 py-4">
                <div className="flex items-center space-x-3">
                  <label className="font-semibold text-gray-800">Enable/Disable</label>
                  <button className="text-gray-400 hover:text-gray-600" title="Product Variations information">
                    ⓘ
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.show_variations_as_products}
                    onChange={(e) => handleInputChange('show_variations_as_products', e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Show Variations as Different Products</span>
                </div>
              </div>

              {/* Enable Unit/Weight Based Pricing */}
              <div className="flex items-center justify-between border-b border-gray-200 py-4">
                <div className="flex items-center space-x-3">
                  <label className="font-semibold text-gray-800">Enable/Disable</label>
                  <button className="text-gray-400 hover:text-gray-600" title="Weight Based Pricing information">
                    ⓘ
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.enable_weight_based_pricing}
                    onChange={(e) => handleInputChange('enable_weight_based_pricing', e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Enable Unit/Weight Based Pricing</span>
                </div>
              </div>

              {/* Automatic Send Orders to Kitchen */}
              <div className="flex items-center justify-between border-b border-gray-200 py-4">
                <div className="flex items-center space-x-3">
                  <label className="font-semibold text-gray-800">Enable/Disable</label>
                  <button className="text-gray-400 hover:text-gray-600" title="Kitchen Orders information">
                    ⓘ
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.auto_send_to_kitchen_on_hold}
                    onChange={(e) => handleInputChange('auto_send_to_kitchen_on_hold', e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Automatic Send Orders to Kitchen When Put to Hold</span>
                </div>
              </div>

              {/* Logo */}
              <div className="flex items-center justify-between border-b border-gray-200 py-4">
                <div className="flex items-center space-x-3">
                  <label className="font-semibold text-gray-800">Logo</label>
                  <button className="text-gray-400 hover:text-gray-600" title="Logo information">
                    ⓘ
                  </button>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-teal-400">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      <div className="text-4xl text-white">🏪</div>
                    )}
                  </div>
                  <label className="cursor-pointer rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
                    Upload Icon
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Select Default/Guest Customer */}
              <div className="flex items-center justify-between border-b border-gray-200 py-4">
                <div className="flex items-center space-x-3">
                  <label className="font-semibold text-gray-800">Select Default/Guest Customer</label>
                  <button className="text-gray-400 hover:text-gray-600" title="Default Customer information">
                    ⓘ
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.default_customer_id}
                  onChange={(e) => handleInputChange('default_customer_id', e.target.value)}
                  placeholder="(#2) customer <customer@email.com>"
                  className="min-w-[300px] rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Endpoint */}
              <div className="flex items-center justify-between border-b border-gray-200 py-4">
                <div className="flex items-center space-x-3">
                  <label className="font-semibold text-gray-800">Endpoint</label>
                  <button className="text-gray-400 hover:text-gray-600" title="Endpoint information">
                    ⓘ
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.pos_endpoint}
                  onChange={(e) => handleInputChange('pos_endpoint', e.target.value)}
                  className="min-w-[300px] rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Kitchen Endpoint */}
              <div className="flex items-center justify-between border-b border-gray-200 py-4">
                <div className="flex items-center space-x-3">
                  <label className="font-semibold text-gray-800">Kitchen Endpoint</label>
                  <button className="text-gray-400 hover:text-gray-600" title="Kitchen Endpoint information">
                    ⓘ
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.kitchen_endpoint}
                  onChange={(e) => handleInputChange('kitchen_endpoint', e.target.value)}
                  className="min-w-[300px] rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Rating Message */}
              <div className="py-4 text-sm italic text-gray-600">
                If you really like our plugin, please leave us a ⭐⭐⭐⭐⭐ rating, we'll really appreciate it.
              </div>

              {/* Save Button */}
              <div className="pt-6">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`rounded px-8 py-3 font-medium text-white transition disabled:cursor-not-allowed disabled:bg-gray-400 ${
                    saving ? 'bg-blue-600 opacity-75' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'payments' && <PaymentsConfiguration />}

          {activeTab === 'pwa' && <PWAConfiguration />}

          {activeTab === 'login' && <LoginConfiguration />}

          {activeTab === 'printer' && <PrinterConfiguration />}

          {activeTab === 'layout' && <LayoutConfiguration />}
        </div>
      </section>

      {message && activeTab === 'general' && (
        <ToastContainer>
          <Alert
            type={message.type}
            title={message.type.charAt(0).toUpperCase() + message.type.slice(1)}
            message={message.text}
            onClose={() => setMessage(null)}
          />
        </ToastContainer>
      )}
    </div>
  );
};

export default memo(GeneralConfiguration);
