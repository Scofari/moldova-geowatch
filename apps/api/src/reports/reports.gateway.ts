import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server } from 'socket.io';
import type { CommunityReport, ReportEvents } from '@geowatch/shared';
import { env } from '../config.js';
@WebSocketGateway({
  cors: { origin: env.WEB_ORIGIN },
  transports: ['websocket', 'polling'],
  allowRequest: (
    req: { headers: { origin?: string } },
    callback: (err: string | null, allowed: boolean) => void,
  ) => {
    callback(
      null,
      !req.headers.origin || req.headers.origin === env.WEB_ORIGIN,
    );
  },
})
export class ReportsGateway {
  @WebSocketServer() server!: Server<Record<string, never>, ReportEvents>;
  created(report: CommunityReport) {
    this.server.emit('report.created', report);
  }
  confirmed(report: CommunityReport) {
    this.server.emit('report.confirmed', report);
  }
}
