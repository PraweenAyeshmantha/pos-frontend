import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type {
  ReportDefinition,
  ReportGenerationPayload,
  ReportFormat,
  GeneratedReportPayload,
} from '../types/report';

interface ReportDefinitionsResponse extends ApiResponse<ReportDefinition[]> {}

const extractFileName = (headerValue?: string | null): string | null => {
  if (!headerValue) {
    return null;
  }
  const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(headerValue);
  if (match) {
    return decodeURIComponent(match[1] ?? match[2] ?? '');
  }
  return null;
};

const normalizePayload = (payload: ReportGenerationPayload): GeneratedReportPayload => ({
  type: payload.type,
  format: payload.format,
  parameters: payload.parameters,
});

export const reportService = {
  async getDefinitions(): Promise<ReportDefinition[]> {
    const response = await apiClient.get<ReportDefinitionsResponse>('/reports/types');
    return response.data.data ?? [];
  },

  async generate(payload: ReportGenerationPayload): Promise<{ fileName: string; blob: Blob; format: ReportFormat }> {
    const response = await apiClient.post<Blob>('/reports/generate', normalizePayload(payload), {
      responseType: 'blob',
    });
    const contentDisposition = response.headers['content-disposition'];
    const fileName = extractFileName(contentDisposition) ?? `${payload.type}.${payload.format === 'PDF' ? 'pdf' : 'xlsx'}`;
    const blob = new Blob([response.data], { type: response.headers['content-type'] ?? 'application/octet-stream' });
    return { fileName, blob, format: payload.format };
  },
};
