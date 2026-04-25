import '@fastify/jwt';
import type { Role } from '@dashboard/shared-types';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; name: string; role: Role };
    user: { sub: string; name: string; role: Role };
  }
}
