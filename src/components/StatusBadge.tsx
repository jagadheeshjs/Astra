import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { HealthStatus } from '../types/astra';

interface StatusIndicatorProps {
  status: HealthStatus;
  compact?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, compact = false }) => {
  if (status === 'WARNING') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium text-[#B83232] whitespace-nowrap ${
          compact
            ? 'text-xs'
            : 'text-xs bg-[#FDF4F4] border border-[#F2CECE] px-2.5 py-1 rounded-md'
        }`}
      >
        <ShieldAlert className="w-3.5 h-3.5 text-[#C53B3B] shrink-0" />
        <span>Warning</span>
      </span>
    );
  }

  if (status === 'ATTENTION') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium text-[#A86211] whitespace-nowrap ${
          compact
            ? 'text-xs'
            : 'text-xs bg-[#FEF8EE] border border-[#F5DFBA] px-2.5 py-1 rounded-md'
        }`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-[#C97B18] shrink-0" />
        <span>Attention</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium text-[#1E7E53] whitespace-nowrap ${
        compact
          ? 'text-xs'
          : 'text-xs bg-[#EFF8F3] border border-[#CBE7D8] px-2.5 py-1 rounded-md'
      }`}
    >
      <CheckCircle2 className="w-3.5 h-3.5 text-[#238E5E] shrink-0" />
      <span>Normal</span>
    </span>
  );
};

interface AvatarInitialsProps {
  initials: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AvatarInitials: React.FC<AvatarInitialsProps> = ({
  initials,
  color,
  size = 'md',
}) => {
  const sizeClass =
    size === 'sm'
      ? 'w-8 h-8 text-xs'
      : size === 'lg'
        ? 'w-12 h-12 text-base'
        : 'w-10 h-10 text-sm';

  return (
    <div
      className={`${sizeClass} rounded-lg flex items-center justify-center font-semibold text-white shrink-0 select-none tracking-tight`}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
};
