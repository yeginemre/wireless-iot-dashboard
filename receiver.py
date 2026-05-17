import csv
import json
import os
import time
from datetime import datetime, timezone

import paho.mqtt.client as mqtt
import serial

BLUETOOTH_PORT = "/dev/rfcomm0"
SERIAL_BAUDRATE = 9600

# Public test MQTT broker host.
BROKER_ADDRESS = "broker.hivemq.com"

BROKER_PORT = 8883

# Enable TLS/SSL for the MQTT connection.
USE_TLS = True

CLIENT_ID = "pi_gateway_1"

# Factory or plant identifier used in MQTT topics.
SITE_ID = "factory_1"

# Physical monitoring area inside the factory.
ZONE_ID = "zone_1"

# Arduino-based sensor node identifier.
DEVICE_ID = "sensor_node_1"

# Raspberry Pi gateway identifier.
GATEWAY_ID = "gateway_1"

MQTT_BASE_TOPIC = f"bbm460/{SITE_ID}/{ZONE_ID}/{DEVICE_ID}"
EVENTS_TOPIC = f"{MQTT_BASE_TOPIC}/events"
LIVE_TOPIC = f"{MQTT_BASE_TOPIC}/live"
HEARTBEAT_TOPIC = f"bbm460/{SITE_ID}/{ZONE_ID}/{GATEWAY_ID}/heartbeat"
GATEWAY_STATUS_TOPIC = f"bbm460/{SITE_ID}/{ZONE_ID}/{GATEWAY_ID}/status"

HEARTBEAT_INTERVAL_SECONDS = 30
LIVE_INTERVAL_SECONDS = 10
MQTT_QOS = 1
LOG_FILE = "fault_log.csv"

mqtt_connected = False
last_known_status = None
last_heartbeat_time = 0.0
last_live_publish_time = 0.0
latest_sensor_payload = None


def utc_timestamp():
    return datetime.now(timezone.utc).isoformat()


def ensure_log_file():
    if os.path.exists(LOG_FILE):
        return

    with open(LOG_FILE, "w", newline="", encoding="utf-8") as log_file:
        writer = csv.writer(log_file)
        writer.writerow(
            [
                "timestamp",
                "gateway_id",
                "device_id",
                "location",
                "status",
                "distance_cm",
                "event_type",
            ]
        )


def append_log(payload):
    with open(LOG_FILE, "a", newline="", encoding="utf-8") as log_file:
        writer = csv.writer(log_file)
        writer.writerow(
            [
                payload["timestamp"],
                payload["gateway_id"],
                payload["device_id"],
                payload["location"],
                payload["status"],
                payload["distance_cm"],
                payload["event_type"],
            ]
        )


def publish_json(topic, payload, retain=False):
    client.publish(topic, json.dumps(payload), qos=MQTT_QOS, retain=retain)


def publish_gateway_status(state):
    payload = {
        "gateway_id": GATEWAY_ID,
        "timestamp": utc_timestamp(),
        "status": state,
        "bluetooth_port": BLUETOOTH_PORT,
        "broker": BROKER_ADDRESS,
    }
    publish_json(GATEWAY_STATUS_TOPIC, payload, retain=True)


def publish_heartbeat():
    payload = {
        "gateway_id": GATEWAY_ID,
        "device_id": DEVICE_ID,
        "timestamp": utc_timestamp(),
        "status": "ONLINE",
        "bluetooth_connected": ser.is_open,
        "mqtt_connected": mqtt_connected,
        "last_known_sensor_status": last_known_status,
    }
    publish_json(HEARTBEAT_TOPIC, payload)


def build_sensor_payload(data):
    return {
        "timestamp": utc_timestamp(),
        "gateway_id": GATEWAY_ID,
        "device_id": DEVICE_ID,
        "location": ZONE_ID,
        "status": data["status"],
        "distance_cm": data["distance_cm"],
        "event_type": "fault_triggered" if data["status"] == "FAULT" else "fault_cleared",
    }


def on_connect(client, userdata, flags, reason_code=None, properties=None):
    global mqtt_connected
    mqtt_connected = True
    print(f"Connected to MQTT broker: {BROKER_ADDRESS}:{BROKER_PORT}")
    publish_gateway_status("ONLINE")


def on_disconnect(client, userdata, *args):
    global mqtt_connected
    mqtt_connected = False

    reason_code = None
    if len(args) == 1:
        reason_code = args[0]
    elif len(args) >= 2:
        reason_code = args[1]

    print(f"Disconnected from MQTT broker. Reason: {reason_code}")


ensure_log_file()

try:
    ser = serial.Serial(BLUETOOTH_PORT, SERIAL_BAUDRATE, timeout=1)
    ser.flush()
    print(f"Connected to Arduino sensor node over Bluetooth: {BLUETOOTH_PORT}")
except serial.SerialException:
    print(f"Error: Could not connect to HC-05 on {BLUETOOTH_PORT}.")
    print("Pair the module and run: sudo rfcomm bind 0 <HC-05_MAC_ADDRESS> 1")
    raise SystemExit(1)

client = mqtt.Client(client_id=CLIENT_ID)
client.on_connect = on_connect
client.on_disconnect = on_disconnect

if USE_TLS:
    client.tls_set()

client.will_set(
    GATEWAY_STATUS_TOPIC,
    payload=json.dumps(
        {
            "gateway_id": GATEWAY_ID,
            "timestamp": utc_timestamp(),
            "status": "OFFLINE",
            "bluetooth_port": BLUETOOTH_PORT,
            "broker": BROKER_ADDRESS,
        }
    ),
    qos=MQTT_QOS,
    retain=True,
)

try:
    client.connect(BROKER_ADDRESS, BROKER_PORT, keepalive=60)
    client.loop_start()
except OSError:
    print("Error: Could not connect to MQTT broker. Check Wi-Fi.")
    ser.close()
    raise SystemExit(1)

print("Listening for sensor updates... Press Ctrl+C to exit.")

try:
    while True:
        now = time.time()
        if mqtt_connected and (now - last_heartbeat_time) >= HEARTBEAT_INTERVAL_SECONDS:
            publish_heartbeat()
            last_heartbeat_time = now

        if (
            mqtt_connected
            and latest_sensor_payload is not None
            and (now - last_live_publish_time) >= LIVE_INTERVAL_SECONDS
        ):
            live_payload = dict(latest_sensor_payload)
            live_payload["timestamp"] = utc_timestamp()
            publish_json(LIVE_TOPIC, live_payload, retain=True)
            last_live_publish_time = now

        if ser.in_waiting <= 0:
            time.sleep(0.1)
            continue

        line = ser.readline().decode("utf-8", errors="replace").rstrip()
        if not line:
            continue

        try:
            data = json.loads(line)
        except json.JSONDecodeError:
            print(f"Ignoring malformed Bluetooth data: {line}")
            continue

        if "status" not in data or "distance_cm" not in data:
            print(f"Ignoring incomplete payload: {line}")
            continue

        payload = build_sensor_payload(data)
        latest_sensor_payload = payload
        append_log(payload)

        if payload["status"] != last_known_status:
            publish_json(EVENTS_TOPIC, payload)
            last_known_status = payload["status"]

        if payload["status"] == "FAULT":
            print(f"FAULT detected at {payload['distance_cm']} cm. Event published.")
        else:
            print(f"System recovered. Distance: {payload['distance_cm']} cm")

except KeyboardInterrupt:
    print("\nShutting down gateway.")
finally:
    if mqtt_connected:
        publish_gateway_status("OFFLINE")
    client.loop_stop()
    client.disconnect()
    ser.close()