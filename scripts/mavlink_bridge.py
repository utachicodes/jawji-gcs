"""
MAVLink ↔ WebSocket Bridge
Connects to ArduPilot SITL (or real hardware) via UDP and exposes a WebSocket
server for the browser GCS to send commands and receive telemetry.

Usage:
    python scripts/mavlink_bridge.py --sitl-host 127.0.0.1 --sitl-port 14550 --ws-port 8765
"""

import asyncio
import json
import logging
import argparse
import math
import time
from typing import Optional, Set

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("mavlink_bridge")

try:
    import websockets
    from websockets.server import WebSocketServerProtocol
except ImportError:
    raise SystemExit("Install: pip install websockets>=12.0")

try:
    from pymavlink import mavutil
except ImportError:
    raise SystemExit("Install: pip install pymavlink>=2.4.41")


# ── State ─────────────────────────────────────────────────────────────────────

class BridgeState:
    def __init__(self):
        self.mav: Optional[mavutil.mavudp] = None
        self.clients: Set[WebSocketServerProtocol] = set()
        self.telemetry: dict = {}
        self.connected_sysid: Optional[int] = None

state = BridgeState()


# ── Helpers ───────────────────────────────────────────────────────────────────

def clamp(v, lo, hi):
    return max(lo, min(hi, v))

def custom_mode_to_str(base_mode: int, custom_mode: int) -> str:
    """Convert ArduCopter custom mode integer to string."""
    COPTER_MODES = {
        0: "STABILIZE", 1: "ACRO", 2: "ALT_HOLD", 3: "AUTO",
        4: "GUIDED", 5: "LOITER", 6: "RTL", 7: "CIRCLE",
        9: "LAND", 11: "DRIFT", 13: "SPORT", 14: "FLIP",
        15: "AUTOTUNE", 16: "POSHOLD", 17: "BRAKE", 18: "THROW",
        19: "AVOID_ADSB", 20: "GUIDED_NOGPS", 21: "SMART_RTL",
    }
    return COPTER_MODES.get(custom_mode, f"MODE_{custom_mode}")


async def broadcast(msg: dict):
    """Send a JSON message to all connected WebSocket clients."""
    if not state.clients:
        return
    data = json.dumps(msg)
    dead = set()
    for ws in state.clients:
        try:
            await ws.send(data)
        except Exception:
            dead.add(ws)
    state.clients -= dead


# ── MAVLink Tasks ─────────────────────────────────────────────────────────────

async def heartbeat_task():
    """Send GCS heartbeat to SITL every 1 second."""
    while True:
        if state.mav:
            try:
                state.mav.mav.heartbeat_send(
                    mavutil.mavlink.MAV_TYPE_GCS,
                    mavutil.mavlink.MAV_AUTOPILOT_INVALID,
                    0, 0, 0
                )
            except Exception as e:
                log.warning(f"Heartbeat send error: {e}")
        await asyncio.sleep(1)


async def mavlink_reader_task():
    """Read MAVLink messages and update telemetry state at ~100 Hz."""
    while True:
        if not state.mav:
            await asyncio.sleep(0.1)
            continue
        try:
            msg = state.mav.recv_match(blocking=False)
        except Exception as e:
            log.error(f"MAVLink recv error: {e}")
            await asyncio.sleep(0.1)
            continue

        if msg is None:
            await asyncio.sleep(0.01)
            continue

        msg_type = msg.get_type()

        if msg_type == "GLOBAL_POSITION_INT":
            state.telemetry.update({
                "lat":     msg.lat / 1e7,
                "lng":     msg.lon / 1e7,
                "altitude": msg.relative_alt / 1000.0,
                "heading":  msg.hdg / 100.0 if msg.hdg != 65535 else 0,
                "vz":       msg.vz / 100.0,
            })

        elif msg_type == "ATTITUDE":
            state.telemetry.update({
                "pitch": math.degrees(msg.pitch),
                "roll":  math.degrees(msg.roll),
                "yaw":   math.degrees(msg.yaw),
            })

        elif msg_type == "SYS_STATUS":
            voltage = msg.voltage_battery / 1000.0  # mV → V
            current = msg.current_battery / 100.0   # cA → A
            remaining = msg.battery_remaining        # percent, -1 if unknown
            state.telemetry.update({
                "voltage": voltage,
                "current": current,
                "battery": remaining if remaining >= 0 else 0,
            })

        elif msg_type == "GPS_RAW_INT":
            state.telemetry.update({
                "gpsSatellites": msg.satellites_visible,
                "hdop": msg.eph / 100.0 if msg.eph != 65535 else 99.9,
                "gpsFixType": msg.fix_type,
            })

        elif msg_type == "VFR_HUD":
            state.telemetry.update({
                "speed":       msg.airspeed,
                "groundspeed": msg.groundspeed,
                "climbRate":   msg.climb,
            })

        elif msg_type == "STATUSTEXT":
            await broadcast({
                "type":     "status",
                "text":     msg.text.rstrip("\x00"),
                "severity": msg.severity,
            })

        elif msg_type == "COMMAND_ACK":
            await broadcast({
                "type":    "command_ack",
                "command": msg.command,
                "result":  msg.result,
            })

        elif msg_type == "HEARTBEAT":
            if msg.get_srcSystem() != 255:  # ignore our own GCS heartbeat echo
                armed = bool(msg.base_mode & mavutil.mavlink.MAV_MODE_FLAG_SAFETY_ARMED)
                mode_str = custom_mode_to_str(msg.base_mode, msg.custom_mode)
                sysid = msg.get_srcSystem()

                if state.connected_sysid is None:
                    state.connected_sysid = sysid
                    log.info(f"Connected to vehicle sysid={sysid}")
                    await broadcast({"type": "connected", "sysid": sysid})

                state.telemetry.update({
                    "mode":  mode_str,
                    "armed": armed,
                })
                await broadcast({
                    "type":  "heartbeat",
                    "armed": armed,
                    "mode":  mode_str,
                    "sysid": sysid,
                })

        await asyncio.sleep(0)  # yield to event loop


async def telemetry_broadcast_task():
    """Broadcast full telemetry to clients at ~10 Hz."""
    while True:
        if state.telemetry and state.clients:
            await broadcast({
                "type": "telemetry",
                "data": {
                    "lat":          state.telemetry.get("lat", 0),
                    "lng":          state.telemetry.get("lng", 0),
                    "altitude":     state.telemetry.get("altitude", 0),
                    "speed":        state.telemetry.get("speed", 0),
                    "groundspeed":  state.telemetry.get("groundspeed", 0),
                    "battery":      state.telemetry.get("battery", 0),
                    "voltage":      state.telemetry.get("voltage", 0),
                    "current":      state.telemetry.get("current", 0),
                    "heading":      state.telemetry.get("heading", 0),
                    "pitch":        state.telemetry.get("pitch", 0),
                    "roll":         state.telemetry.get("roll", 0),
                    "yaw":          state.telemetry.get("yaw", 0),
                    "gpsSatellites": state.telemetry.get("gpsSatellites", 0),
                    "hdop":         state.telemetry.get("hdop", 99.9),
                    "climbRate":    state.telemetry.get("climbRate", 0),
                    "mode":         state.telemetry.get("mode", "UNKNOWN"),
                    "armed":        state.telemetry.get("armed", False),
                    "flightTime":   int(time.time()),
                },
            })
        await asyncio.sleep(0.1)


# ── Command Handling ───────────────────────────────────────────────────────────

def send_command_long(mav, cmd, p1=0, p2=0, p3=0, p4=0, p5=0, p6=0, p7=0):
    mav.mav.command_long_send(
        mav.target_system,
        mav.target_component,
        cmd, 0,
        float(p1), float(p2), float(p3), float(p4),
        float(p5), float(p6), float(p7),
    )

def set_mode(mav, mode_name: str):
    """Set ArduCopter flight mode by name."""
    MODES = {
        "STABILIZE": 0, "ACRO": 1, "ALT_HOLD": 2, "AUTO": 3,
        "GUIDED": 4, "LOITER": 5, "RTL": 6, "CIRCLE": 7,
        "LAND": 9, "DRIFT": 11, "SPORT": 13,
    }
    mode_id = MODES.get(mode_name.upper())
    if mode_id is None:
        log.warning(f"Unknown mode: {mode_name}")
        return
    mav.mav.set_mode_send(
        mav.target_system,
        mavutil.mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED,
        mode_id,
    )


async def handle_command(msg_data: dict):
    """Dispatch incoming WebSocket commands to MAVLink."""
    mav = state.mav
    if not mav:
        log.warning("Command received but MAVLink not connected")
        return

    cmd_type = msg_data.get("type", "")

    if cmd_type == "ARM":
        arm = 1 if msg_data.get("arm", True) else 0
        send_command_long(mav, mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM, arm)
        log.info(f"{'Arm' if arm else 'Disarm'} command sent")

    elif cmd_type == "TAKEOFF":
        altitude = float(msg_data.get("altitude", 10))
        # First set GUIDED mode, then send takeoff
        set_mode(mav, "GUIDED")
        await asyncio.sleep(0.5)
        send_command_long(
            mav, mavutil.mavlink.MAV_CMD_NAV_TAKEOFF,
            0, 0, 0, 0, 0, 0, altitude
        )
        log.info(f"Takeoff command sent (altitude={altitude}m)")

    elif cmd_type == "LAND":
        send_command_long(mav, mavutil.mavlink.MAV_CMD_NAV_LAND)
        log.info("Land command sent")

    elif cmd_type == "RTL":
        send_command_long(mav, mavutil.mavlink.MAV_CMD_NAV_RETURN_TO_LAUNCH)
        log.info("RTL command sent")

    elif cmd_type == "SET_MODE":
        mode = msg_data.get("mode", "STABILIZE")
        set_mode(mav, mode)
        log.info(f"Set mode: {mode}")

    elif cmd_type == "SET_HOME":
        lat = float(msg_data.get("lat", 0))
        lng = float(msg_data.get("lng", 0))
        send_command_long(
            mav, mavutil.mavlink.MAV_CMD_DO_SET_HOME,
            0, 0, 0, 0, lat, lng, 0
        )
        log.info(f"Set home: ({lat}, {lng})")

    elif cmd_type == "RC_OVERRIDE":
        channels = msg_data.get("channels", [1500] * 8)
        channels = [clamp(int(c), 1000, 2000) for c in channels]
        # Pad to 8 channels
        while len(channels) < 8:
            channels.append(0)
        mav.mav.rc_channels_override_send(
            mav.target_system,
            mav.target_component,
            *channels[:8],
        )

    else:
        log.warning(f"Unknown command type: {cmd_type}")


# ── WebSocket Server ───────────────────────────────────────────────────────────

async def ws_handler(websocket: WebSocketServerProtocol, path: str = "/"):
    state.clients.add(websocket)
    log.info(f"Client connected: {websocket.remote_address}")

    # Send current connection status immediately
    if state.connected_sysid is not None:
        await websocket.send(json.dumps({
            "type": "connected",
            "sysid": state.connected_sysid,
        }))
    else:
        await websocket.send(json.dumps({"type": "disconnected"}))

    try:
        async for raw in websocket:
            try:
                msg_data = json.loads(raw)
                await handle_command(msg_data)
            except json.JSONDecodeError:
                log.warning(f"Invalid JSON from client: {raw[:100]}")
            except Exception as e:
                log.error(f"Command error: {e}")
    finally:
        state.clients.discard(websocket)
        log.info(f"Client disconnected: {websocket.remote_address}")


# ── Entry Point ────────────────────────────────────────────────────────────────

async def main(sitl_host: str, sitl_port: int, ws_port: int):
    # Connect to SITL
    connection_str = f"udpin:{sitl_host}:{sitl_port}"
    log.info(f"Connecting to SITL at {connection_str} ...")
    state.mav = mavutil.mavlink_connection(connection_str, source_system=255, source_component=0)
    log.info("MAVLink socket open, waiting for heartbeat...")

    # Start background tasks
    tasks = [
        asyncio.create_task(heartbeat_task()),
        asyncio.create_task(mavlink_reader_task()),
        asyncio.create_task(telemetry_broadcast_task()),
    ]

    # Start WebSocket server
    async with websockets.serve(ws_handler, "0.0.0.0", ws_port):
        log.info(f"WebSocket server listening on ws://0.0.0.0:{ws_port}")
        await asyncio.gather(*tasks)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MAVLink ↔ WebSocket Bridge")
    parser.add_argument("--sitl-host", default="127.0.0.1", help="SITL host (default: 127.0.0.1)")
    parser.add_argument("--sitl-port", type=int, default=14550, help="SITL UDP port (default: 14550)")
    parser.add_argument("--ws-port",   type=int, default=8765,  help="WebSocket port (default: 8765)")
    args = parser.parse_args()

    try:
        asyncio.run(main(args.sitl_host, args.sitl_port, args.ws_port))
    except KeyboardInterrupt:
        log.info("Bridge stopped.")
