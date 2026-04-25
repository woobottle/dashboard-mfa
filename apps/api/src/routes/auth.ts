import type { FastifyInstance } from 'fastify';
import type { LoginRequest, LoginResponse } from '@dashboard/shared-types';
import { SEED_USERS } from '../data.js';
import { authenticate } from '../auth-guard.js';

export async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: LoginRequest }>('/auth/login', async (request, reply) => {
    const { username } = request.body ?? ({} as LoginRequest);
    if (!username) {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'username 이 필요해요.',
      });
    }
    const seed = SEED_USERS.find((u) => u.username === username);
    if (!seed) {
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: `등록되지 않은 사용자예요: ${username}. (admin / viewer / cx 중 하나)`,
      });
    }
    const token = await reply.jwtSign(
      { sub: seed.username, name: seed.name, role: seed.role },
      { expiresIn: '12h' }
    );
    const body: LoginResponse = {
      token,
      user: { id: seed.username, name: seed.name, role: seed.role },
    };
    return body;
  });

  app.get('/auth/me', { preHandler: authenticate }, async (request) => {
    const { sub, name, role } = request.user;
    return { id: sub, name, role };
  });
}
