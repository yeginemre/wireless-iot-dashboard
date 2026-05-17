import {
  Thermometer, Droplets, Move, Activity, DoorOpen,
  Gauge, Camera, FlameKindling, type LucideIcon,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export type PlaceholderType =
  | 'temperature'
  | 'humidity'
  | 'motion'
  | 'vibration'
  | 'door'
  | 'pressure'
  | 'camera'
  | 'gas';

interface Props {
  type: PlaceholderType;
  id: string;
  zone: string;
}

interface TypeConfig {
  label: string;
  unit: string;
  icon: LucideIcon;
  mockValue: string;
  color: string;
  bg: string;
}

const TYPE_CONFIG: Record<PlaceholderType, TypeConfig> = {
  temperature: { label: 'Temperature Sensor',  unit: '°C',  icon: Thermometer, mockValue: '—',   color: 'text-orange-400', bg: 'bg-orange-500/10' },
  humidity:    { label: 'Humidity Sensor',      unit: '%RH', icon: Droplets,    mockValue: '—',   color: 'text-sky-400',    bg: 'bg-sky-500/10' },
  motion:      { label: 'Motion Detector',      unit: '',    icon: Move,        mockValue: '—',   color: 'text-violet-400', bg: 'bg-violet-500/10' },
  vibration:   { label: 'Vibration Sensor',     unit: 'g',   icon: Activity,    mockValue: '—',   color: 'text-red-400',    bg: 'bg-red-500/10' },
  door:        { label: 'Door Sensor',          unit: '',    icon: DoorOpen,    mockValue: '—',   color: 'text-amber-400',  bg: 'bg-amber-500/10' },
  pressure:    { label: 'Pressure Sensor',      unit: 'bar', icon: Gauge,       mockValue: '—',   color: 'text-emerald-400',bg: 'bg-emerald-500/10' },
  camera:      { label: 'IP Camera',            unit: '',    icon: Camera,      mockValue: '—',   color: 'text-slate-400',  bg: 'bg-slate-600/20' },
  gas:         { label: 'Gas Detector',         unit: 'ppm', icon: FlameKindling,mockValue:'—',   color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
};

export function PlaceholderDeviceCard({ type, id, zone }: Props) {
  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;

  return (
    <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-5 flex flex-col gap-3 opacity-55 hover:opacity-70 transition-opacity">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${cfg.bg}`}>
            <Icon className={`w-5 h-5 ${cfg.color}`} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Sensor Module</p>
            <p className="text-sm font-semibold text-slate-300">{cfg.label}</p>
            <p className="text-xs text-slate-500">{id} · {zone}</p>
          </div>
        </div>
        <StatusBadge status="PLACEHOLDER" size="sm" />
      </div>

      <div className="rounded-xl bg-slate-900/40 px-3 py-3 border border-slate-700/30">
        <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Reading</p>
        <p className="text-2xl font-bold text-slate-600 tabular-nums">{cfg.mockValue} {cfg.unit}</p>
      </div>

      <p className="text-[11px] text-amber-400/60 italic">Not yet deployed — placeholder module</p>
    </div>
  );
}
