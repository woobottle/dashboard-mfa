import type { DirectoryUser, MetricPoint, Period, Region, Role } from '@dashboard/shared-types';

interface SeedUser {
  username: string;
  name: string;
  role: Role;
}

export const SEED_USERS: SeedUser[] = [
  { username: 'admin', name: '관리자 김', role: 'admin' },
  { username: 'viewer', name: '뷰어 박', role: 'viewer' },
  { username: 'cx', name: 'CX 이', role: 'cx' },
];

const REGIONS: Region[] = ['seoul', 'busan'];
const NAMES = [
  '이서준', '김도윤', '박시우', '최주원', '정하준', '강지호', '조은우', '윤도현',
  '한지후', '오시현', '서연우', '신민준', '권유준', '황선우', '안정우', '송예준',
  '류지환', '백건우', '문이안', '남지우', '구하늘', '편채원', '홍서아', '하지민',
];

const directoryUsers: DirectoryUser[] = NAMES.map((name, idx) => ({
  id: `u_${String(idx + 1).padStart(3, '0')}`,
  name,
  email: `${name.toLowerCase()}${idx + 1}@example.com`,
  region: REGIONS[idx % REGIONS.length],
  joinedAt: new Date(2024, idx % 12, ((idx * 7) % 28) + 1).toISOString().slice(0, 10),
  banned: false,
}));

export function listUsers(): DirectoryUser[] {
  return directoryUsers;
}

export function findUser(id: string): DirectoryUser | undefined {
  return directoryUsers.find((u) => u.id === id);
}

export function banUser(id: string): DirectoryUser | undefined {
  const target = findUser(id);
  if (!target) return undefined;
  target.banned = true;
  return target;
}

const PERIOD_DAYS: Record<Period, number> = { '7d': 7, '30d': 30, '90d': 90 };

function seededRandom(seed: number) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return value / 2147483647;
  };
}

function hashSeed(parts: Array<string | undefined>): number {
  return parts
    .filter(Boolean)
    .join('|')
    .split('')
    .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 17) >>> 0;
}

export function buildMetrics(opts: {
  period: Period;
  region: Region;
  userId?: string;
}): MetricPoint[] {
  const days = PERIOD_DAYS[opts.period];
  const rand = seededRandom(hashSeed([opts.period, opts.region, opts.userId]));
  const baseTraffic = opts.userId ? 200 : opts.region === 'seoul' ? 12000 : opts.region === 'busan' ? 7000 : 18000;
  const baseRevenue = baseTraffic * 18;
  const baseGmv = baseRevenue * 1.6;

  const points: MetricPoint[] = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const noise = 0.85 + rand() * 0.3;
    points.push({
      date,
      traffic: Math.round(baseTraffic * noise),
      revenue: Math.round(baseRevenue * noise),
      gmv: Math.round(baseGmv * noise),
    });
  }
  return points;
}
