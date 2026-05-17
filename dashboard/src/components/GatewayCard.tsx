import { Wifi, WifiOff, Bluetooth, Clock, Server } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { GatewayStatusPayload, HeartbeatPayload } from '../types';

interface Props {
  gatewayStatus: GatewayStatusPayload | null;
  heartbeat: HeartbeatPayload | null;
  lastSeen: Date | null;
  placeholder?: boolean;
  label?: string;
}

function fmtTime(d: Date | null) {
  if (!d) return '—';
  return d.toLocaleTimeString();
}

function fmtAgo(d: Date | null) {
  if (!d) return null;
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  return `${Math.floor(secs / 60)}m ago`;
}

export function GatewayCard({ gatewayStatus, heartbeat, lastSeen, placeholder, label }: Props) {
  const isOnline = gatewayStatus?.status === 'ONLINE';
  const isPlaceholder = placeholder ?? false;

  const displayStatus = isPlaceholder
    ? 'PLACEHOLDER'
    : gatewayStatus
    ? gatewayStatus.status
    : 'OFFLINE';

  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-4 transition-all
      ${isPlaceholder ? 'border-amber-500/20 bg-amber-500/5 opacity-60' : isOnline ? 'border-emerald-500/30 bg-slate-800/60' : 'border-slate-700/50 bg-slate-800/40'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isPlaceholder ? 'bg-amber-500/10' : isOnline ? 'bg-emerald-500/10' : 'bg-slate-700/50'}`}>
            <Server className={`w-5 h-5 ${isPlaceholder ? 'text-amber-400' : isOnline ? 'text-emerald-400' : 'text-slate-500'}`} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Gateway</p>
            <p className="text-sm font-semibold text-slate-200">{label ?? gatewayStatus?.gateway_id ?? 'gateway_1'}</p>
          </div>
        </div>
        <StatusBadge status={displayStatus as any} />
      </div>

      {!isPlaceholder && (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <Stat icon={<Wifi className="w-3.5 h-3.5" />} label="MQTT" value={heartbeat?.mqtt_connected ? 'Connected' : '—'} ok={heartbeat?.mqtt_connected} />
          <Stat icon={<Bluetooth className="w-3.5 h-3.5" />} label="Bluetooth" value={heartbeat?.bluetooth_connected ? 'Connected' : '—'} ok={heartbeat?.bluetooth_connected} />
          <Stat icon={<Clock className="w-3.5 h-3.5" />} label="Last Heartbeat" value={fmtTime(lastSeen)} />
          <Stat icon={<WifiOff className="w-3.5 h-3.5" />} label="Broker" value={gatewayStatus?.broker ?? '—'} />
        </div>
      )}

      {isPlaceholder && (
        <p className="text-xs text-amber-400/70 italic">Not yet deployed — placeholder</p>
      )}

      {!isPlaceholder && lastSeen && (
        <p className="text-xs text-slate-600">Last message {fmtAgo(lastSeen)}</p>
      )}
    </div>
  );
}

function Stat({ icon, label, value, ok }: { icon: React.ReactNode; label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-slate-400">
      <span className={ok === true ? 'text-emerald-400' : ok === false ? 'text-slate-600' : 'text-slate-500'}>{icon}</span>
      <div>
        <p className="text-slate-600 text-[10px] uppercase tracking-wider">{label}</p>
        <p className="text-slate-300 font-medium">{value}</p>
      </div>
    </div>
  );
}
