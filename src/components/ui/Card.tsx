import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover, onClick }: CardProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`rounded-xl border border-slate-200 bg-white p-4 text-left ${
        hover
          ? 'transition-all hover:border-slate-300 hover:shadow-sm'
          : ''
      } ${onClick ? 'w-full' : ''} ${className}`}
    >
      {children}
    </Tag>
  );
}
