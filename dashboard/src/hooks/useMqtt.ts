import { useEffect, useRef, useState, useCallback } from 'react';
import mqtt from 'mqtt';
import type { MqttClient } from 'mqtt'; // type-only, erased at runtime
import type { MqttMessage, SensorPayload, HeartbeatPayload, GatewayStatusPayload, DeviceStatus } from '../types';

const BROKER_URL = 'wss://broker.hivemq.com:8884/mqtt';
const BASE_TOPIC = 'bbm460/factory_1/zone_1/#';

const CLIENT_ID = `dashboard_${Math.random().toString(16).slice(2, 8)}`;

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface MqttState {
  connectionState: ConnectionState;
  sensorPayload: SensorPayload | null;
  heartbeat: HeartbeatPayload | null;
  gatewayStatus: GatewayStatusPayload | null;
  messages: MqttMessage[];
  sensorStatus: DeviceStatus;
  lastSeen: Date | null;
}

export function useMqtt() {
  const clientRef = useRef<MqttClient | null>(null);
  const [state, setState] = useState<MqttState>({
    connectionState: 'connecting',
    sensorPayload: null,
    heartbeat: null,
    gatewayStatus: null,
    messages: [],
    sensorStatus: 'UNKNOWN',
    lastSeen: null,
  });

  const addMessage = useCallback((topic: string, payload: Record<string, unknown>) => {
    const msg: MqttMessage = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      topic,
      payload,
      timestamp: new Date(),
    };
    setState(prev => ({
      ...prev,
      messages: [msg, ...prev.messages].slice(0, 100),
    }));
  }, []);

  useEffect(() => {
    const client = mqtt.connect(BROKER_URL, {
      clientId: CLIENT_ID,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
    });

    clientRef.current = client;

    client.on('connect', () => {
      setState(prev => ({ ...prev, connectionState: 'connected' }));
      client.subscribe(BASE_TOPIC, { qos: 1 });
    });

    client.on('reconnect', () => {
      setState(prev => ({ ...prev, connectionState: 'connecting' }));
    });

    client.on('error', () => {
      setState(prev => ({ ...prev, connectionState: 'error' }));
    });

    client.on('offline', () => {
      setState(prev => ({ ...prev, connectionState: 'disconnected' }));
    });

    client.on('message', (topic: string, message: Buffer) => {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(message.toString());
      } catch {
        return;
      }

      addMessage(topic, parsed);

      if (topic.endsWith('/events') || topic.endsWith('/live')) {
        const payload = parsed as unknown as SensorPayload;
        setState(prev => ({
          ...prev,
          sensorPayload: payload,
          sensorStatus: payload.status ?? 'UNKNOWN',
          lastSeen: new Date(),
        }));
      } else if (topic.endsWith('/heartbeat')) {
        setState(prev => ({
          ...prev,
          heartbeat: parsed as unknown as HeartbeatPayload,
          lastSeen: new Date(),
        }));
      } else if (topic.endsWith('/status')) {
        const gwStatus = parsed as unknown as GatewayStatusPayload;
        setState(prev => ({
          ...prev,
          gatewayStatus: gwStatus,
        }));
      }
    });

    return () => {
      client.end(true);
    };
  }, [addMessage]);

  return state;
}
