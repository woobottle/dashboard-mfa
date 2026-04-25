import type { FastifyInstance } from 'fastify';
import type { MetricsQuery, MetricsResponse, Period, Region } from '@dashboard/shared-types';
import { buildMetrics } from '../data.js';
import { requireRole } from '../auth-guard.js';

const VALID_PERIODS: Period[] = ['7d', '30d', '90d'];
const VALID_REGIONS: Region[] = ['seoul', 'busan', 'all'];

export async function metricsRoutes(app: FastifyInstance) {
  app.get<{ Querystring: MetricsQuery }>(
    '/metrics',
    { preHandler: requireRole('admin', 'viewer', 'cx') },
    async (request) => {
      const period = (VALID_PERIODS as string[]).includes(request.query.period ?? '')
        ? (request.query.period as Period)
        : '7d';
      const region = (VALID_REGIONS as string[]).includes(request.query.region ?? '')
        ? (request.query.region as Region)
        : 'all';
      const userId = request.query.userId;
      const points = buildMetrics({ period, region, userId });
      const body: MetricsResponse = { period, region, userId, points };
      return body;
    }
  );
}
