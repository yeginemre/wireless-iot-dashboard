import { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, Loader2, Radio, AlertTriangle } from 'lucide-react';
import { useMqtt } from './hooks/useMqtt';
import { RangeSensorCard } from './components/RangeSensorCard';
import { GatewayCard } from './components/GatewayCard';
import { PlaceholderDeviceCard, type PlaceholderType } from './components/PlaceholderDeviceCard';
import { MessageLog } from './components/MessageLog';

const SITE_ID = 'factory_1';
const ZONE_ID = 'zone_1';
const BROKER = 'broker.hivemq.com';

const PLACEHOLDER_DEVICES: { id: string; type: PlaceholderType; zone: string }[] = [
  { id: 'temp_node_1',      type: 'temperature', zone: 'zone_1' },
  { id: 'humid_node_1',     type: 'humidity',    zone: 'zone_1' },
  { id: 'motion_node_1',    type: 'motion',      zone: 'zone_2' },
  { id: 'vibr_node_1',      type: 'vibration',   zone: 'zone_2' },
  { id: 'door_node_1',      type: 'door',        zone: 'zone_3' },
  { id: 'press_node_1',     type: 'pressure',    zone: 'zone_3' },
  { id: 'cam_node_1',       type: 'camera',      zone: 'zone_1' },
  { id: 'gas_node_1',       type: 'gas',         zone: 'zone_2' },
];

const PLACEHOLDER_GATEWAYS = [
  { id: 'gateway_2', label: 'gateway_2', zone: 'zone_2' },
  { id: 'gateway_3', label: 'gateway_3', zone: 'zone_3' },
];

interface HistoryPoint { time: number; distance: number }
const MAX_HISTORY = 60;

function ConnectionPill({ state }: { state: string }) {
  if (state === 'connected')
    return (
      <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold bg-emerald-400/10 px-3 py-1.5 rounded-full">
        <Wifi className="w-3.5 h-3.5" /> Connected to {BROKER}
      </span>
    );
  if (state === 'connecting')
    return (
      <span className="flex items-center gap-1.5 text-sky-400 text-xs font-semibold bg-sky-400/10 px-3 py-1.5 rounded-full">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting…
      </span>
    );
  if (state === 'error')
    return (
      <span className="flex items-center gap-1.5 text-red-400 text-xs font-semibold bg-red-400/10 px-3 py-1.5 rounded-full">
        <AlertTriangle className="w-3.5 h-3.5" /> Broker error
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold bg-slate-700/50 px-3 py-1.5 rounded-full">
      <WifiOff className="w-3.5 h-3.5" /> Disconnected
    </span>
  );
}

export default function App() {
  const { connectionState, sensorPayload, heartbeat, gatewayStatus, messages, sensorStatus, lastSeen } = useMqtt();
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (sensorPayload) {
      setHistory(prev => [
        ...prev.slice(-(MAX_HISTORY - 1)),
        { time: Date.now(), distance: sensorPayload.distance_cm },
      ]);
    }
  }, [sensorPayload]);

  // Force re-render every second so "X ago" timestamps stay fresh.
  useEffect(() => {
    intervalRef.current = setInterval(() => setTick(t => t + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  void tick;

  const faultCount = sensorStatus === 'FAULT' ? 1 : 0;
  const activeDevices = sensorPayload ? 1 : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10">
              <Radio className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100 leading-none">IoT Monitor</h1>
              <p className="text-xs text-slate-500 mt-0.5">{SITE_ID} · {ZONE_ID}</p>
            </div>
          </div>
          <ConnectionPill state={connectionState} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Devices" value={1 + PLACEHOLDER_DEVICES.length} sub="1 active" />
          <StatCard label="Active Sensors" value={activeDevices} sub={`of 1 deployed`} ok={activeDevices > 0} />
          <StatCard label="Active Faults" value={faultCount} sub="across all zones" warn={faultCount > 0} />
          <StatCard label="Messages Rx" value={messages.length} sub="this session" />
        </div>

        {/* Zone 1 — Live Devices */}
        <section>
          <SectionHeader title="Zone 1 — Active Hardware" badge="LIVE" badgeColor="emerald" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <RangeSensorCard
              payload={sensorPayload}
              status={sensorStatus}
              history={history}
              lastSeen={lastSeen}
            />
            <GatewayCard
              gatewayStatus={gatewayStatus}
              heartbeat={heartbeat}
              lastSeen={lastSeen}
            />
          </div>
        </section>

        {/* Placeholder Devices */}
        <section>
          <SectionHeader title="Planned Modules — Placeholders" badge="NOT DEPLOYED" badgeColor="amber" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {PLACEHOLDER_DEVICES.map(d => (
              <PlaceholderDeviceCard key={d.id} type={d.type} id={d.id} zone={d.zone} />
            ))}
          </div>
        </section>

        {/* Placeholder Gateways */}
        <section>
          <SectionHeader title="Planned Gateways" badge="NOT DEPLOYED" badgeColor="amber" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {PLACEHOLDER_GATEWAYS.map(gw => (
              <GatewayCard
                key={gw.id}
                gatewayStatus={null}
                heartbeat={null}
                lastSeen={null}
                placeholder
                label={gw.label}
              />
            ))}
          </div>
        </section>

        {/* Message Log */}
        <section>
          <SectionHeader title="MQTT Message Log" />
          <div className="mt-4">
            <MessageLog messages={messages} />
          </div>
        </section>

      </main>

      <footer className="border-t border-slate-800 mt-8 py-5">
        <p className="text-center text-xs text-slate-700">
          bbm460 · {SITE_ID} · broker.hivemq.com:8884 (WSS)
        </p>
      </footer>
    </div>
  );
}

function StatCard({ label, value, sub, ok, warn }: { label: string; value: number; sub?: string; ok?: boolean; warn?: boolean }) {
  const textColor = warn ? 'text-red-400' : ok ? 'text-emerald-400' : 'text-slate-100';
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 px-5 py-4">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-bold tabular-nums ${textColor}`}>{value}</p>
      {sub && <p className="text-xs text-slate-600 mt-1">{sub}</p>}
    </div>
  );
}

function SectionHeader({ title, badge, badgeColor }: { title: string; badge?: string; badgeColor?: 'emerald' | 'amber' | 'sky' }) {
  const badgeClass = badgeColor === 'emerald'
    ? 'text-emerald-400 bg-emerald-400/10'
    : badgeColor === 'amber'
    ? 'text-amber-400 bg-amber-400/10'
    : 'text-sky-400 bg-sky-400/10';

  return (
    <div className="flex items-center gap-3">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{title}</h2>
      {badge && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>{badge}</span>
      )}
      <div className="flex-1 border-t border-slate-800" />
    </div>
  );
}
