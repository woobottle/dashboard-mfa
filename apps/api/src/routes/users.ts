import type { FastifyInstance } from 'fastify';
import type { UserListResponse } from '@dashboard/shared-types';
import { banUser, listUsers } from '../data.js';
import { requireRole } from '../auth-guard.js';

export async function usersRoutes(app: FastifyInstance) {
  app.get('/users', { preHandler: requireRole('admin', 'cx') }, async (): Promise<UserListResponse> => {
    return { users: listUsers() };
  });

  app.post<{ Params: { id: string } }>(
    '/users/:id/ban',
    { preHandler: requireRole('admin', 'cx') },
    async (request, reply) => {
      const target = banUser(request.params.id);
      if (!target) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `해당 유저를 찾을 수 없어요: ${request.params.id}`,
        });
      }
      return target;
    }
  );
}
