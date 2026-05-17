import { Radar, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { SensorPayload, DeviceStatus } from '../types';
import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

interface Props {
  payload: SensorPayload | null;
  status: DeviceStatus;
  history: { time: number; distance: number }[];
  lastSeen: Date | null;
}

function fmtAgo(d: Date | null) {
  if (!d) return null;
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s ago`;
}

export function RangeSensorCard({ payload, status, history, lastSeen }: Props) {
  const isFault = status === 'FAULT';
  const hasData = payload !== null;

  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-4 col-span-2 transition-all
      ${isFault ? 'border-red-500/40 bg-red-950/20' : hasData ? 'border-emerald-500/30 bg-slate-800/60' : 'border-slate-700/50 bg-slate-800/40'}`}>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isFault ? 'bg-red-500/10' : 'bg-sky-500/10'}`}>
            <Radar className={`w-5 h-5 ${isFault ? 'text-red-400' : 'text-sky-400'}`} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Ultrasonic Range Sensor</p>
            <p className="text-sm font-semibold text-slate-200">{payload?.device_id ?? 'sensor_node_1'}</p>
            <p className="text-xs text-slate-500">{payload?.location ?? 'zone_1'}</p>
          </div>
        </div>
        <StatusBadge status={hasData ? status : 'UNKNOWN'} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MetricBox
          label="Distance"
          value={hasData ? `${payload!.distance_cm} cm` : '—'}
          highlight={isFault}
          highlightColor="red"
        />
        <MetricBox
          label="Threshold"
          value="< 10 cm"
          sub="fault zone"
        />
        <MetricBox
          label="Event"
          value={hasData ? (isFault ? 'FAULT' : 'CLEARED') : '—'}
          icon={hasData ? (isFault ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />) : null}
        />
      </div>

      {history.length > 1 && (
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isFault ? '#f87171' : '#38bdf8'} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={isFault ? '#f87171' : '#38bdf8'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis domain={[0, 'auto']} hide />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
                labelFormatter={() => ''}
                formatter={(v: number) => [`${v} cm`, 'Distance']}
              />
              <Area
                type="monotone"
                dataKey="distance"
                stroke={isFault ? '#f87171' : '#38bdf8'}
                strokeWidth={2}
                fill="url(#distGrad)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {lastSeen && (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Clock className="w-3 h-3" />
          Last update {fmtAgo(lastSeen)}
        </div>
      )}

      {!hasData && (
        <p className="text-xs text-slate-500 italic">Waiting for sensor data…</p>
      )}
    </div>
  );
}

function MetricBox({
  label, value, sub, highlight, highlightColor = 'sky', icon,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  highlightColor?: 'sky' | 'red';
  icon?: React.ReactNode;
}) {
  const color = highlight
    ? highlightColor === 'red' ? 'text-red-400' : 'text-sky-400'
    : 'text-slate-200';

  return (
    <div className="rounded-xl bg-slate-900/60 px-3 py-3 border border-slate-700/40">
      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        {icon}
        <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
      </div>
      {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}
