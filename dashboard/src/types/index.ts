export type DeviceStatus = 'OK' | 'FAULT' | 'OFFLINE' | 'UNKNOWN';
export type ModuleStatus = 'ONLINE' | 'OFFLINE' | 'PLACEHOLDER';

export interface SensorPayload {
  timestamp: string;
  gateway_id: string;
  device_id: string;
  location: string;
  status: DeviceStatus;
  distance_cm: number;
  event_type: 'fault_triggered' | 'fault_cleared';
}

export interface HeartbeatPayload {
  gateway_id: string;
  device_id: string;
  timestamp: string;
  status: string;
  bluetooth_connected: boolean;
  mqtt_connected: boolean;
  last_known_sensor_status: DeviceStatus | null;
}

export interface GatewayStatusPayload {
  gateway_id: string;
  timestamp: string;
  status: 'ONLINE' | 'OFFLINE';
  bluetooth_port: string;
  broker: string;
}

export interface MqttMessage {
  id: string;
  topic: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

export interface DeviceConfig {
  id: string;
  label: string;
  type: 'range_sensor' | 'temperature' | 'humidity' | 'motion' | 'vibration' | 'door' | 'pressure' | 'camera' | 'gas';
  zone: string;
  placeholder: boolean;
  mqttTopic?: string;
}

export interface GatewayConfig {
  id: string;
  label: string;
  zone: string;
  placeholder: boolean;
}
