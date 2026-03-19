import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../api/report.api';

export const useTasteReportQuery = () => {
  return useQuery({
    queryKey: ['report', 'taste'],
    queryFn: reportApi.getTasteReport,
    staleTime: 1000 * 60 * 5,
  });
};
