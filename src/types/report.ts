export type ReportType =
  | 'DAILY_SALES'
  | 'SALES_ANALYTICS'
  | 'GIFT_CARD_BREAKAGE'
  | 'SALES_PROFITABILITY'
  | 'EXPENSE_SUMMARY'
  | 'STOCK_VALUATION';

export type ReportFormat = 'PDF' | 'EXCEL';

export type ReportParameterType = 'DATE' | 'DATETIME' | 'OUTLET' | 'CASHIER' | 'NUMBER' | 'TEXT';

export interface ReportParameter {
  code: string;
  label: string;
  description?: string;
  type: ReportParameterType;
  required: boolean;
  defaultValue?: string | null;
}

export interface ReportDefinition {
  type: ReportType;
  title: string;
  description?: string;
  section?: string;
  parameters: ReportParameter[];
  formats: ReportFormat[];
}

export interface ReportGenerationPayload {
  type: ReportType;
  format: ReportFormat;
  parameters: Record<string, string>;
}

export type GeneratedReportPayload = ReportGenerationPayload;
