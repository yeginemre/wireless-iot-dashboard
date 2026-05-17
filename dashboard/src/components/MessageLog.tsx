import { Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { MqttMessage } from '../types';

interface Props {
  messages: MqttMessage[];
}

function topicTag(topic: string) {
  if (topic.endsWith('/events')) return { label: 'EVENT', color: 'text-red-400 bg-red-400/10' };
  if (topic.endsWith('/live'))   return { label: 'LIVE',  color: 'text-sky-400 bg-sky-400/10' };
  if (topic.endsWith('/heartbeat')) return { label: 'HB', color: 'text-emerald-400 bg-emerald-400/10' };
  if (topic.endsWith('/status')) return { label: 'STATUS', color: 'text-amber-400 bg-amber-400/10' };
  return { label: 'MSG', color: 'text-slate-400 bg-slate-400/10' };
}

function shortTopic(topic: string) {
  const parts = topic.split('/');
  return parts.slice(-2).join('/');
}

export function MessageLog({ messages }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const displayed = showAll ? messages : messages.slice(0, 20);

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-700/50">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-200">MQTT Message Log</span>
          <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">{messages.length}</span>
        </div>
        {messages.length > 20 && (
          <button
            onClick={() => setShowAll(p => !p)}
            className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
          >
            {showAll ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show all</>}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto max-h-80 font-mono text-xs">
        {messages.length === 0 && (
          <p className="text-slate-600 italic px-5 py-4">No messages received yet…</p>
        )}
        {displayed.map(msg => {
          const tag = topicTag(msg.topic);
          const isExpanded = expanded === msg.id;
          return (
            <div
              key={msg.id}
              className="border-b border-slate-700/30 last:border-0 hover:bg-slate-700/20 transition-colors cursor-pointer"
              onClick={() => setExpanded(isExpanded ? null : msg.id)}
            >
              <div className="flex items-center gap-2 px-4 py-2">
                <span className="text-slate-600 shrink-0 tabular-nums">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${tag.color}`}>
                  {tag.label}
                </span>
                <span className="text-slate-400 truncate">{shortTopic(msg.topic)}</span>
                {!isExpanded && (
                  <span className="text-slate-600 truncate ml-auto shrink-0 max-w-[40%]">
                    {JSON.stringify(msg.payload).slice(0, 60)}…
                  </span>
                )}
              </div>
              {isExpanded && (
                <pre className="px-4 pb-3 text-[11px] text-emerald-300/80 whitespace-pre-wrap break-all leading-relaxed">
                  {JSON.stringify(msg.payload, null, 2)}
                </pre>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
