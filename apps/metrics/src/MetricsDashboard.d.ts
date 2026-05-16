interface Props {
    token?: string | null;
    period?: '7d' | '30d' | '90d';
    region?: 'seoul' | 'busan' | 'all';
    userId?: string;
    apiBase?: string;
}
export declare function MetricsDashboard({ token, period, region, userId, apiBase, }: Props): import("react/jsx-runtime").JSX.Element;
export default MetricsDashboard;
