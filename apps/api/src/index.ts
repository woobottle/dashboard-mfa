import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { authRoutes } from './routes/auth.js';
import { metricsRoutes } from './routes/metrics.js';
import { usersRoutes } from './routes/users.js';

const PORT = Number(process.env.PORT ?? 4000);
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-do-not-use-in-prod';

async function start() {
  const app = Fastify({ logger: { transport: { target: 'pino-pretty' } } });

  await app.register(cors, {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.register(jwt, { secret: JWT_SECRET });

  await app.register(authRoutes);
  await app.register(metricsRoutes, { prefix: '/api' });
  await app.register(usersRoutes, { prefix: '/api' });

  app.get('/health', async () => ({ ok: true }));

  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    app.log.info(`api ready on http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
