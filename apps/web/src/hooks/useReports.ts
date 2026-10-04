import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import type {
  CommunityReport,
  ReportCategory,
  ReportEvents,
} from '@geowatch/shared';
import { api } from '../api/client';
export function useReports(
  country: string,
  category: ReportCategory | 'all',
  bbox: [number, number, number, number] | null,
) {
  const client = useQueryClient();
  const [connected, setConnected] = useState(false);
  const params = new URLSearchParams({ countryCode: country });
  if (category !== 'all') params.set('category', category);
  if (bbox) params.set('bbox', bbox.join(','));
  const query = useQuery({
    queryKey: ['reports', country, category, bbox],
    queryFn: () => api.reports(params),
    refetchInterval: 60_000,
  });
  useEffect(() => {
    const socket: Socket<ReportEvents, Record<string, never>> = io({
      transports: ['websocket', 'polling'],
    });
    const refresh = () => {
      void client.invalidateQueries({ queryKey: ['reports'] });
    };
    const update = (report: CommunityReport) => {
      refresh();
      client.setQueryData(['report', report.id], report);
    };
    socket.on('connect', () => {
      setConnected(true);
      refresh();
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));
    socket.on('report.created', update);
    socket.on('report.confirmed', update);
    return () => {
      socket.disconnect();
    };
  }, [client]);
  return { ...query, connected };
}
