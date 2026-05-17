import type { DeviceStatus, ModuleStatus } from '../types';

type AnyStatus = DeviceStatus | ModuleStatus | 'CONNECTING' | 'UNKNOWN';

interface Props {
  status: AnyStatus;
  size?: 'sm' | 'md';
}

const config: Record<AnyStatus, { label: string; dot: string; text: string; bg: string }> = {
  OK:          { label: 'OK',          dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  ONLINE:      { label: 'ONLINE',      dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  FAULT:       { label: 'FAULT',       dot: 'bg-red-400',     text: 'text-red-400',     bg: 'bg-red-400/10' },
  OFFLINE:     { label: 'OFFLINE',     dot: 'bg-slate-500',   text: 'text-slate-400',   bg: 'bg-slate-500/10' },
  PLACEHOLDER: { label: 'PLACEHOLDER', dot: 'bg-amber-400',   text: 'text-amber-400',   bg: 'bg-amber-400/10' },
  CONNECTING:  { label: 'CONNECTING',  dot: 'bg-sky-400',     text: 'text-sky-400',     bg: 'bg-sky-400/10' },
  UNKNOWN:     { label: 'UNKNOWN',     dot: 'bg-slate-500',   text: 'text-slate-400',   bg: 'bg-slate-500/10' },
};

export function StatusBadge({ status, size = 'md' }: Props) {
  const c = config[status] ?? config.UNKNOWN;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide ${padding} ${c.text} ${c.bg}`}>
      <span className={`relative flex h-2 w-2`}>
        {(status === 'OK' || status === 'ONLINE') && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${c.dot}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${c.dot}`} />
      </span>
      {c.label}
    </span>
  );
}
