import React, { useState, useEffect } from 'react';
import { configurationService } from '../../../services/configurationService';
import type { GeneralConfigFormData } from '../../../types/configuration';
import Alert from '../../common/Alert';
import type { AlertType } from '../../common/Alert';

const GeneralConfiguration: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [message, setMessage] = useState<{ type: AlertType; text: string } | null>(null);
  
  const [formData, setFormData] = useState<GeneralConfigFormData>({
    license_key: '',
    module_enabled: true,
    inventory_type: 'CUSTOM',
    default_order_status: 'PENDING',
    default_barcode_type: 'PRODUCT_ID',
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
  });

  const [logoPreview, setLogoPreview] = useState<string>('');

  // Fetch configurations on component mount
  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      const configs = await configurationService.getAllGeneralConfigurations();
      
      // Convert array of configs to form data
      const configMap: Record<string, string> = {};
      configs.forEach(config => {
        configMap[config.configKey] = config.configValue;
      });

      setFormData({
        license_key: configMap.license_key || '',
        module_enabled: configMap.module_enabled === 'true',
        inventory_type: (configMap.inventory_type || 'CUSTOM') as 'CUSTOM' | 'CENTRALIZED',
        default_order_status: configMap.default_order_status || 'PENDING',
        default_barcode_type: (configMap.default_barcode_type || 'PRODUCT_ID') as 'PRODUCT_ID' | 'SKU',
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
      });

      if (configMap.logo_url) {
        setLogoPreview(configMap.logo_url);
      }
    } catch (error) {
      console.error('Error fetching configurations:', error);
      setMessage({ type: 'error', text: 'Failed to load configurations. Using default values.' });
      // Use default values when backend is not available
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: keyof GeneralConfigFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

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
      };

      await configurationService.bulkUpdateConfigurations(configurations);
      setMessage({ type: 'success', text: 'Configurations saved successfully!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-gray-100 min-h-screen">
      {/* Header */}
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">General Configuration</h1>

      {/* Success/Error Message */}
      {message && (
        <div className="mb-6">
          <Alert
            type={message.type}
            title={message.type.charAt(0).toUpperCase() + message.type.slice(1)}
            message={message.text}
          />
        </div>
      )}

      {/* Tab Navigation - Attached to Form */}
      <div className="bg-white rounded-t-lg shadow-sm">
        <div className="flex border-b border-gray-200">
          {['General', 'Payments', 'PWA', 'Login', 'Printer', 'Layout'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === tab.toLowerCase()
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-white rounded-b-lg shadow-sm p-8 space-y-6">
        {/* Activate License */}
        <div className="flex items-center justify-between py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <label className="font-semibold text-gray-800">Activate License</label>
            <button
              className="text-gray-400 hover:text-gray-600"
              title="License activation information"
            >
              ⓘ
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
              {formData.license_key ? 'Activated' : 'Deactivate'}
            </button>
            <a href="#" className="text-blue-600 hover:underline text-sm">
              How to find your purchase code?
            </a>
          </div>
        </div>

        {/* Enable/Disable Module */}
        <div className="flex items-center justify-between py-4 border-b border-gray-200">
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
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Enable MultiPOS - Point of Sale for WooCommerce</span>
          </div>
        </div>

        {/* Inventory Type */}
        <div className="flex items-center justify-between py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <label className="font-semibold text-gray-800">Inventory Type</label>
            <button className="text-gray-400 hover:text-gray-600" title="Inventory Type information">
              ⓘ
            </button>
          </div>
          <select
            value={formData.inventory_type}
            onChange={(e) => handleInputChange('inventory_type', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[300px]"
          >
            <option value="CUSTOM">Custom/Manual Stock</option>
            <option value="CENTRALIZED">Centralized Stock</option>
          </select>
        </div>

        {/* Order Status */}
        <div className="flex items-center justify-between py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <label className="font-semibold text-gray-800">Order Status</label>
            <button className="text-gray-400 hover:text-gray-600" title="Order Status information">
              ⓘ
            </button>
          </div>
          <select
            value={formData.default_order_status}
            onChange={(e) => handleInputChange('default_order_status', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[300px]"
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
        <div className="flex items-center justify-between py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <label className="font-semibold text-gray-800">Default Product Barcode</label>
            <button className="text-gray-400 hover:text-gray-600" title="Barcode information">
              ⓘ
            </button>
          </div>
          <select
            value={formData.default_barcode_type}
            onChange={(e) => handleInputChange('default_barcode_type', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[300px]"
          >
            <option value="PRODUCT_ID">Product ID</option>
            <option value="SKU">SKU</option>
          </select>
        </div>

        {/* Enable Order Mails */}
        <div className="flex items-center justify-between py-4 border-b border-gray-200">
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
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Enable Order Mails</span>
          </div>
        </div>

        {/* Enable Split/Multiple Payment Methods */}
        <div className="flex items-center justify-between py-4 border-b border-gray-200">
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
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Enable Split/Multiple Payment Methods</span>
          </div>
        </div>

        {/* Enable Order Note */}
        <div className="flex items-center justify-between py-4 border-b border-gray-200">
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
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Enable Order Note</span>
          </div>
        </div>

        {/* Enable Offline Orders */}
        <div className="flex items-center justify-between py-4 border-b border-gray-200">
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
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Enable Offline Orders for Online Mode (Fast Orders)</span>
          </div>
        </div>

        {/* Enable Adding Custom Product */}
        <div className="flex items-center justify-between py-4 border-b border-gray-200">
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
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Enable Adding Custom Product</span>
          </div>
        </div>

        {/* Enable Open Cash Drawer Popup */}
        <div className="flex items-center justify-between py-4 border-b border-gray-200">
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
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Enable Open Cash Drawer Popup</span>
          </div>
        </div>

        {/* Show Variations as Different Products */}
        <div className="flex items-center justify-between py-4 border-b border-gray-200">
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
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Show Variations as Different Products</span>
          </div>
        </div>

        {/* Enable Unit/Weight Based Pricing */}
        <div className="flex items-center justify-between py-4 border-b border-gray-200">
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
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Enable Unit/Weight Based Pricing</span>
          </div>
        </div>

        {/* Automatic Send Orders to Kitchen */}
        <div className="flex items-center justify-between py-4 border-b border-gray-200">
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
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Automatic Send Orders to Kitchen When Put to Hold</span>
          </div>
        </div>

        {/* Logo */}
        <div className="flex items-center justify-between py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <label className="font-semibold text-gray-800">Logo</label>
            <button className="text-gray-400 hover:text-gray-600" title="Logo information">
              ⓘ
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-24 h-24 bg-teal-400 rounded-full flex items-center justify-center overflow-hidden">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="text-white text-4xl">🏪</div>
              )}
            </div>
            <label className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer font-medium">
              Upload Icon
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Select Default/Guest Customer */}
        <div className="flex items-center justify-between py-4 border-b border-gray-200">
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
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[300px]"
          />
        </div>

        {/* Endpoint */}
        <div className="flex items-center justify-between py-4 border-b border-gray-200">
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
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[300px]"
          />
        </div>

        {/* Kitchen Endpoint */}
        <div className="flex items-center justify-between py-4 border-b border-gray-200">
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
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[300px]"
          />
        </div>

        {/* Rating Message */}
        <div className="py-4 text-gray-600 text-sm italic">
          If you really like our plugin, please leave us a ⭐⭐⭐⭐⭐ rating, we'll really appreciate it.
        </div>

        {/* Save Button */}
        <div className="pt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-8 py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed ${
              saving ? 'opacity-75' : ''
            }`}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeneralConfiguration;
