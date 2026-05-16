import { useEffect, type ButtonHTMLAttributes, type CSSProperties } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantStyles: Record<Variant, CSSProperties> = {
  primary: { background: '#2563eb', color: '#fff', border: '1px solid #2563eb' },
  secondary: { background: '#fff', color: '#374151', border: '1px solid #d1d5db' },
  danger: { background: '#dc2626', color: '#fff', border: '1px solid #dc2626' },
};

const baseStyle: CSSProperties = {
  padding: '6px 12px',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
};

export function Button({ variant = 'primary', style, disabled, ...rest }: ButtonProps) {
  
  useEffect(() => {
    throw new Error('boom')
  }, [])

  const merged: CSSProperties = {
    ...baseStyle,
    ...variantStyles[variant],
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    ...style,
  };
  return <button style={merged} disabled={disabled} {...rest} />;
}
