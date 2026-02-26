#!/usr/bin/env python3
"""
JAWJI GCS – Multi-Drone Telemetry Simulator
Simulates N drones with realistic physics, battery model, wind drift,
GPS-denied mode, and MQTT command subscriber.

Usage:
    python sim_drone.py --count 2 --broker localhost --port 1883
    python sim_drone.py --config config.yaml
"""

import argparse
import json
import logging
import math
import random
import signal
import sys
import threading
import time
from datetime import datetime
from typing import Optional

try:
    import yaml
    YAML_AVAILABLE = True
except ImportError:
    YAML_AVAILABLE = False

import paho.mqtt.client as mqtt

# ── Logging setup ─────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s – %(message)s",
    datefmt="%H:%M:%S",
)

# ── Constants ─────────────────────────────────────────────────────────────────

DEFAULT_BROKER = "localhost"
DEFAULT_PORT = 1883
TOPIC_PREFIX = "drone"
UPDATE_HZ = 10               # telemetry publish rate
UPDATE_INTERVAL = 1.0 / UPDATE_HZ
DEADZONE_SAT_THRESHOLD = 6   # satellites below which GPS considered degraded

# Battery model constants
HOVER_POWER_W = 400          # watts at hover
MAX_SPEED_MS = 20.0
BATTERY_CAPACITY_WH = 220    # watt-hours (6S 22Ah approx)

# Physics
WIND_DRIFT_COEFF = 0.00003   # position drift per m/s wind per second
ACCEL_TIME = 2.0             # seconds to reach cruise speed

# ── Drone Simulator ───────────────────────────────────────────────────────────

class DroneSimulator:
    """Simulates a single drone's physics and telemetry."""

    def __init__(self, drone_id: str, index: int = 0, config: dict = {}):
        self.id = drone_id
        self.logger = logging.getLogger(drone_id)
        self.running = False
        self._lock = threading.Lock()

        # Config
        base_lat = config.get("base_lat", 37.7749)
        base_lng = config.get("base_lng", -122.4194)
        self.gps_deny_after = config.get("gps_deny_after", None)  # seconds
        self.radius = config.get("orbit_radius", 0.002 + index * 0.0005)

        # State
        self.center_lat = base_lat + index * 0.002
        self.center_lng = base_lng
        self.angle = random.uniform(0, 2 * math.pi)  # start at random point
        self.altitude = 50.0 + index * 10
        self.target_altitude = self.altitude
        self.speed = 0.0
        self.target_speed = 12.0
        self.vertical_speed = 0.0
        self.battery_wh = BATTERY_CAPACITY_WH
        self.battery_pct = 100.0
        self.mode = "Auto"
        self.status = "flying"
        self.armed = True

        # Wind state (slowly varying)
        self.wind_speed = random.uniform(3, 12)   # m/s
        self.wind_dir = random.uniform(0, 360)     # degrees
        self.wind_drift_lat = 0.0
        self.wind_drift_lng = 0.0

        # GPS
        self.gps_satellites = 14
        self.hdop = 0.8

        # Command state
        self.pending_command: Optional[str] = None
        self.rtl_active = False
        self.land_active = False

        # Timing
        self.start_time = time.time()
        self.last_update = self.start_time

    @property
    def elapsed(self) -> float:
        return time.time() - self.start_time

    def apply_command(self, cmd: str):
        with self._lock:
            cmd = cmd.lower().strip()
            self.logger.info(f"Command received: {cmd}")
            if cmd == "rtl":
                self.rtl_active = True
                self.land_active = False
                self.mode = "RTL"
            elif cmd == "land":
                self.land_active = True
                self.rtl_active = False
                self.mode = "Land"
            elif cmd == "abort":
                self.rtl_active = False
                self.land_active = False
                self.mode = "Abort"
                self.target_speed = 0.0
            elif cmd == "arm":
                self.armed = True
                self.mode = "Auto"
                self.logger.info("Drone armed")
            elif cmd == "disarm":
                self.armed = False
                self.mode = "Disarmed"
                self.logger.warning("Drone disarmed remotely")

    def _update_physics(self, dt: float):
        """Update position, velocity, battery."""
        t = self.elapsed

        # ── Wind model (slow sinusoidal variation)
        self.wind_speed = 8.5 + 4 * math.sin(t * 0.02)
        self.wind_dir = (245 + 30 * math.sin(t * 0.01)) % 360

        # Wind drift on position
        wind_rad = math.radians(self.wind_dir)
        wind_lat = math.cos(wind_rad) * self.wind_speed * WIND_DRIFT_COEFF * dt
        wind_lng = math.sin(wind_rad) * self.wind_speed * WIND_DRIFT_COEFF * dt
        self.wind_drift_lat += wind_lat
        self.wind_drift_lng += wind_lng

        # ── Speed with acceleration
        speed_err = self.target_speed - self.speed
        self.speed += speed_err * (dt / ACCEL_TIME)
        self.speed = max(0, min(self.speed, MAX_SPEED_MS))

        # ── Angular position update (circular orbit)
        # angular_speed in rad/s from linear speed and orbit radius
        # radius in degrees ≈ 0.002° ≈ 220m
        orbit_circumference = 2 * math.pi * self.radius * 111320  # meters
        if orbit_circumference > 0:
            angular_speed = self.speed / orbit_circumference * 2 * math.pi
        else:
            angular_speed = 0.05
        self.angle += angular_speed * dt

        # ── RTL logic: fly back toward center, then descend
        if self.rtl_active:
            self.target_altitude = 60.0
            if self.altitude <= 62:
                self.target_altitude = 5.0
            if self.altitude <= 5.5:
                self.status = "landed"
                self.mode = "Landed"
                self.rtl_active = False

        # ── Land logic
        if self.land_active:
            self.target_altitude = 0.0
            self.target_speed = 0.0
            if self.altitude <= 0.5:
                self.status = "landed"
                self.mode = "Landed"
                self.land_active = False

        # ── Altitude physics
        alt_err = self.target_altitude - self.altitude
        self.vertical_speed = alt_err * 0.3  # proportional control
        self.vertical_speed = max(-5.0, min(5.0, self.vertical_speed))
        self.altitude += self.vertical_speed * dt
        self.altitude = max(0, self.altitude)

        # ── Battery model: P = k * thrust^1.5 (simplified)
        # At hover: 400W; at full speed: ~600W
        speed_fraction = self.speed / MAX_SPEED_MS
        power_w = HOVER_POWER_W * (1 + 0.5 * speed_fraction)
        if self.status == "landed":
            power_w = 30  # idle/standby

        energy_wh = power_w * dt / 3600
        self.battery_wh = max(0, self.battery_wh - energy_wh)
        self.battery_pct = (self.battery_wh / BATTERY_CAPACITY_WH) * 100

        # ── GPS-denied simulation
        if self.gps_deny_after and t > self.gps_deny_after:
            self.gps_satellites = max(0, int(14 - (t - self.gps_deny_after) * 0.5))
            self.hdop = min(9.9, 0.8 + (t - self.gps_deny_after) * 0.1)
            if self.gps_satellites < DEADZONE_SAT_THRESHOLD and self.mode == "Auto":
                self.mode = "GPS-Denied"
        else:
            self.gps_satellites = 14 + int(random.gauss(0, 0.5))
            self.hdop = 0.8 + random.uniform(-0.05, 0.05)

        # Battery critical
        if self.battery_pct < 5 and self.status == "flying":
            if not self.rtl_active and not self.land_active:
                self.logger.warning("Critical battery – forcing RTL")
                self.apply_command("rtl")
        elif self.battery_pct < 20 and not self.rtl_active and self.mode == "Auto":
            self.mode = "Low Battery"

    def get_telemetry(self) -> dict:
        """Return the current telemetry payload."""
        t = self.elapsed

        # Position
        lat_offset = self.radius * math.sin(self.angle) * 0.8  # elliptical
        lng_offset = self.radius * math.cos(self.angle)
        lat = self.center_lat + lat_offset + self.wind_drift_lat
        lng = self.center_lng + lng_offset + self.wind_drift_lng

        # Heading from flight direction
        dlat = self.radius * math.cos(self.angle) * 0.8
        dlng = -self.radius * math.sin(self.angle)
        heading = (math.degrees(math.atan2(dlng, dlat)) + 360) % 360

        # Attitude
        pitch = math.sin(t * 0.4) * 2.5
        roll = math.cos(t * 0.3) * 2.5

        # Motor speeds (pseudo-PWM %)
        base_motor = 65 + (self.speed / MAX_SPEED_MS) * 15
        motors = {
            "m1": base_motor + 3 * math.sin(t * 1.0),
            "m2": base_motor + 3 * math.cos(t * 1.0),
            "m3": base_motor + 3 * math.sin(t * 1.1),
            "m4": base_motor + 3 * math.cos(t * 1.2),
        }

        # Voltage model: 6S LiPo, 22.2V nominal, sags under load
        speed_fraction = self.speed / MAX_SPEED_MS
        voltage = 25.2 * (self.battery_pct / 100) - 0.8 * speed_fraction
        current = 18.0 * speed_fraction + 5.0 if self.status == "flying" else 1.5

        return {
            "id": self.id,
            "location": {"lat": lat, "lng": lng, "altitude": round(self.altitude, 2)},
            "speed": round(self.speed, 2),
            "verticalSpeed": round(self.vertical_speed, 2),
            "battery": round(self.battery_pct, 2),
            "signal": round(95 + 3 * math.sin(t * 0.5), 1),
            "heading": round(heading, 1),
            "pitch": round(pitch, 2),
            "roll": round(roll, 2),
            "yaw": round(heading, 1),
            "temperature": round(25 + random.gauss(0, 0.2), 1),
            "mode": self.mode,
            "status": self.status,
            "armed": self.armed,
            "flightTime": round(t, 1),
            "timestamp": int(time.time() * 1000),
            "gpsSatellites": self.gps_satellites,
            "voltage": round(voltage, 2),
            "current": round(current, 2),
            "hdop": round(self.hdop, 2),
            "humidity": round(65 + 5 * math.sin(t * 0.05), 1),
            "windSpeed": round(self.wind_speed, 1),
            "windDir": round(self.wind_dir, 1),
            "motors": {k: round(v, 1) for k, v in motors.items()},
        }

    def tick(self):
        """Advance simulation by one tick."""
        now = time.time()
        dt = now - self.last_update
        self.last_update = now
        with self._lock:
            self._update_physics(dt)


# ── MQTT runner for one drone ─────────────────────────────────────────────────

class DroneRunner:
    def __init__(self, sim: DroneSimulator, broker: str, port: int):
        self.sim = sim
        self.broker = broker
        self.port = port
        self.logger = logging.getLogger(f"runner.{sim.id}")
        self.client: Optional[mqtt.Client] = None
        self._stop = threading.Event()
        self._reconnect_delay = 1.0

    def _build_client(self) -> mqtt.Client:
        client = mqtt.Client(
            client_id=f"sim_{self.sim.id}_{int(time.time())}",
            protocol=mqtt.MQTTv311,
        )
        client.on_connect = self._on_connect
        client.on_disconnect = self._on_disconnect
        client.on_message = self._on_message
        return client

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.logger.info(f"Connected to {self.broker}:{self.port}")
            self._reconnect_delay = 1.0
            # Subscribe to command topic
            cmd_topic = f"{TOPIC_PREFIX}/{self.sim.id}/command"
            client.subscribe(cmd_topic)
            self.logger.info(f"Subscribed to {cmd_topic}")
            # Publish online status
            client.publish(
                f"{TOPIC_PREFIX}/{self.sim.id}/status",
                json.dumps({"id": self.sim.id, "online": True, "timestamp": int(time.time() * 1000)}),
                retain=True,
            )
        else:
            self.logger.error(f"Connection failed rc={rc}")

    def _on_disconnect(self, client, userdata, rc):
        if rc != 0:
            self.logger.warning(f"Unexpected disconnect rc={rc}")

    def _on_message(self, client, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode())
            cmd = payload.get("cmd") or payload.get("command", "")
            if cmd:
                self.sim.apply_command(cmd)
        except Exception as e:
            self.logger.error(f"Failed to parse command: {e}")

    def run(self):
        self.client = self._build_client()
        telemetry_topic = f"{TOPIC_PREFIX}/{self.sim.id}/telemetry"

        while not self._stop.is_set():
            try:
                self.logger.info(f"Connecting to {self.broker}:{self.port}…")
                self.client.connect(self.broker, self.port, keepalive=60)
                self.client.loop_start()

                log_countdown = 0
                while not self._stop.is_set():
                    self.sim.tick()
                    telemetry = self.sim.get_telemetry()
                    self.client.publish(telemetry_topic, json.dumps(telemetry))

                    log_countdown += UPDATE_INTERVAL
                    if log_countdown >= 1.0:
                        log_countdown = 0
                        self.logger.info(
                            f"Mode={telemetry['mode']:<12} Alt={telemetry['location']['altitude']:6.1f}m  "
                            f"Spd={telemetry['speed']:5.1f}m/s  Bat={telemetry['battery']:5.1f}%  "
                            f"Sats={telemetry['gpsSatellites']}  Wind={telemetry['windSpeed']:.1f}m/s"
                        )

                    time.sleep(UPDATE_INTERVAL)

                self.client.loop_stop()
                self.client.disconnect()
                break

            except ConnectionRefusedError:
                self.logger.warning(f"Broker unavailable. Retry in {self._reconnect_delay:.0f}s…")
                self._stop.wait(self._reconnect_delay)
                self._reconnect_delay = min(self._reconnect_delay * 2, 60.0)
            except Exception as e:
                self.logger.error(f"Error: {e}. Retry in {self._reconnect_delay:.0f}s…")
                self._stop.wait(self._reconnect_delay)
                self._reconnect_delay = min(self._reconnect_delay * 2, 60.0)

        self.logger.info("Runner stopped")

    def stop(self):
        self._stop.set()


# ── Main ──────────────────────────────────────────────────────────────────────

def load_config(path: str) -> dict:
    if not YAML_AVAILABLE:
        logging.warning("PyYAML not installed – ignoring config file")
        return {}
    try:
        with open(path) as f:
            return yaml.safe_load(f) or {}
    except Exception as e:
        logging.error(f"Failed to load config {path}: {e}")
        return {}


def main():
    parser = argparse.ArgumentParser(description="JAWJI Multi-Drone Simulator")
    parser.add_argument("--count", type=int, default=1, help="Number of drone simulators (default: 1)")
    parser.add_argument("--broker", default=DEFAULT_BROKER, help="MQTT broker host")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="MQTT broker port")
    parser.add_argument("--id-prefix", default="sim", help="Drone ID prefix (e.g. 'sim' → sim-001, sim-002)")
    parser.add_argument("--config", default=None, help="Path to YAML config file")
    parser.add_argument("--debug", action="store_true", help="Enable debug logging")
    args = parser.parse_args()

    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)

    cfg = load_config(args.config) if args.config else {}

    runners: list[DroneRunner] = []
    threads: list[threading.Thread] = []

    for i in range(args.count):
        drone_id = f"{args.id_prefix}-{i + 1:03d}"
        drone_cfg = cfg.get(drone_id, cfg.get("default", {}))
        sim = DroneSimulator(drone_id=drone_id, index=i, config=drone_cfg)
        runner = DroneRunner(sim=sim, broker=args.broker, port=args.port)
        runners.append(runner)

        t = threading.Thread(target=runner.run, name=f"runner-{drone_id}", daemon=True)
        threads.append(t)
        t.start()
        logging.info(f"Started simulator for {drone_id}")
        # Stagger startup slightly so MQTT connections don't overlap
        time.sleep(0.1 * i)

    # ── Graceful shutdown ─────────────────────────────────────────────────────
    def shutdown(sig, frame):
        logging.info("Shutdown signal received – stopping simulators…")
        for r in runners:
            r.stop()
        for t in threads:
            t.join(timeout=3.0)
        logging.info("All simulators stopped. Goodbye.")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    logging.info(f"Simulating {args.count} drone(s). Press Ctrl+C to stop.")
    # Keep main thread alive
    while True:
        time.sleep(1)


if __name__ == "__main__":
    main()
