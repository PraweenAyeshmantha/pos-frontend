export type RecordStatus = 'ACTIVE' | 'INACTIVE';

export interface Configuration {
  id: number;
  configKey: string;
  configValue: string;
  category: string;
  description: string;
  dataType: 'BOOLEAN' | 'STRING' | 'NUMBER';
  createdDate: string;
  version: number;
}

export interface ApiResponse<T> {
  code: string;
  message: string;
  timestamp: string;
  path: string;
  data: T;
}

export interface BulkUpdateRequest {
  configurations: Record<string, string>;
}

export type BusinessMode = 'RETAIL' | 'RESTAURANT_CAFE';

export interface GeneralConfigFormData {
  license_key: string;
  module_enabled: boolean;
  inventory_type: 'CUSTOM' | 'CENTRALIZED';
  default_order_status: string;
  default_barcode_type: 'PRODUCT_ID' | 'SKU';
  enable_order_emails: boolean;
  enable_split_payment: boolean;
  enable_order_note: boolean;
  enable_offline_orders: boolean;
  enable_custom_product: boolean;
  enable_cash_drawer_popup: boolean;
  show_variations_as_products: boolean;
  enable_weight_based_pricing: boolean;
  auto_send_to_kitchen_on_hold: boolean;
  logo_url: string;
  default_customer_id: string;
  pos_endpoint: string;
  kitchen_endpoint: string;
  business_mode: BusinessMode;
}

export interface PwaConfigFormData {
  pwa_name: string;
  pwa_short_name: string;
  pwa_theme_color: string;
  pwa_background_color: string;
  pwa_icon_192: string;
  pwa_icon_512: string;
}

export interface LoginConfigFormData {
  login_heading_text: string;
  login_footer_text: string;
  login_button_text: string;
  enable_remember_me: boolean;
  enable_forgot_password: boolean;
  login_bg_primary_color: string;
  login_bg_secondary_color: string;
  login_font_color: string;
}

export interface PrinterConfigFormData {
  barcode_page_width: string;
  barcode_page_height: string;
  barcode_page_margin: string;
  barcode_margin: string;
  barcode_orientation: 'HORIZONTAL' | 'VERTICAL';
  invoice_page_width: string;
  invoice_page_height: string;
  invoice_page_margin: string;
}

export interface LayoutConfigFormData {
  layout_gradient_primary_color: string;
  layout_gradient_secondary_color: string;
  layout_font_size: string;
}
