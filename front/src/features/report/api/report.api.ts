import { api } from '@/lib/axios';
import { API_PATH } from '@/constants/api-path';
import { TasteReportResponse } from '../types/report.types';

export const reportApi = {
  getTasteReport: async (): Promise<TasteReportResponse> => {
    const { data } = await api.get<{ data: TasteReportResponse }>(API_PATH.REPORT.TASTE);
    return data.data;
  },
};
