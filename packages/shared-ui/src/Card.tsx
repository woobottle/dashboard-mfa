import type { CSSProperties, ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  style?: CSSProperties;
}

const baseStyle: CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 16,
  background: '#fff',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
};

const titleStyle: CSSProperties = {
  margin: 0,
  marginBottom: 12,
  fontSize: 14,
  fontWeight: 600,
  color: '#374151',
};

export function Card({ title, children, style }: CardProps) {
  return (
    <div style={{ ...baseStyle, ...style }}>
      {title ? <h3 style={titleStyle}>{title}</h3> : null}
      {children}
    </div>
  );
}
