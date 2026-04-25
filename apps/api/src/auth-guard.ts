import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Role } from '@dashboard/shared-types';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.code(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: '토큰이 없거나 만료됐어요.',
    });
  }
}

export function requireRole(...allowed: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
    if (reply.sent) return;
    const role = request.user.role;
    if (!allowed.includes(role)) {
      return reply.code(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: `이 리소스는 ${allowed.join(', ')} 역할만 접근할 수 있어요. 현재: ${role}`,
      });
    }
  };
}
