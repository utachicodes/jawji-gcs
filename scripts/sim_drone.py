import argparse
import time
import json
import random
import math
import paho.mqtt.client as mqtt
from datetime import datetime

# Default configuration
BROKER = "localhost"
PORT = 1883
TOPIC_PREFIX = "drone"

def generate_telemetry(drone_id, start_time, base_location):
    elapsed = (datetime.now() - start_time).total_seconds()
    
    # Circular flight path simulation
    radius = 0.001  # approx 100m
    speed = 0.1     # angular speed
    
    lat_offset = radius * math.sin(elapsed * speed)
    lng_offset = radius * math.cos(elapsed * speed)
    
    current_lat = base_location["lat"] + lat_offset
    current_lng = base_location["lng"] + lng_offset
    
    # Simulate battery drain (1% every 30 seconds approx)
    battery = max(0, 100 - (elapsed / 30))
    
    # Altitude variation
    altitude = 50 + math.sin(elapsed * 0.5) * 5
    # Vertical speed
    vertical_speed = 2.5 * math.cos(elapsed * 0.5)

    # Orientation
    pitch = math.sin(elapsed * 0.2) * 5
    roll = math.cos(elapsed * 0.3) * 5
    yaw = (elapsed * speed * 180 / math.pi) % 360

    data = {
        "id": drone_id,
        "location": {
            "lat": current_lat,
            "lng": current_lng,
            "altitude": altitude
        },
        "speed": 15.0 + random.uniform(-1, 1),
        "verticalSpeed": vertical_speed,  # Note: camelCase to match TypeScript expectations if needed, or mapping in backend
        "battery": battery,
        "signal": 90 + random.uniform(-5, 5),
        "heading": yaw,
        "pitch": pitch,
        "roll": roll,
        "yaw": yaw,
        "temperature": 25 + random.uniform(-2, 2),
        "mode": "GPS-Denied" if battery < 20 else "Auto",
        "status": "flying" if battery > 10 else "landed",
        "flightTime": elapsed,
        "timestamp": time.time() * 1000,
        "gpsSatellites": 12
    }
    return data

def main():
    parser = argparse.ArgumentParser(description="Drone Telemetry Simulator")
    parser.add_argument("--id", default="drone-sim-001", help="Drone ID")
    parser.add_argument("--broker", default=BROKER, help="MQTT Broker Host")
    parser.add_argument("--port", type=int, default=PORT, help="MQTT Broker Port")
    args = parser.parse_args()

    client = mqtt.Client(client_id=f"sim_{args.id}", protocol=mqtt.MQTTv311)
    
    try:
        print(f"Connecting to {args.broker}:{args.port}...")
        client.connect(args.broker, args.port, 60)
        client.loop_start()
        print("Connected!")
        
        start_time = datetime.now()
        base_location = {"lat": 37.7749, "lng": -122.4194} # SF default
        
        topic = f"{TOPIC_PREFIX}/{args.id}/telemetry"
        
        # Smooth flight parameters
        radius = 0.002
        center_lat = base_location["lat"]
        center_lng = base_location["lng"]
        angle = 0.0

        while True:
            # Update physics
            angle += 0.05  # Slower angular increment for smoother circle
            
            # Calculate new position
            lat_offset = radius * math.sin(angle)
            lng_offset = radius * math.cos(angle)
            
            current_lat = center_lat + lat_offset * 0.8  # Elliptical
            current_lng = center_lng + lng_offset
            
            # Smooth altitude oscillation
            elapsed = (datetime.now() - start_time).total_seconds()
            altitude = 50 + math.sin(elapsed * 0.2) * 10
            vertical_speed = 2.0 * math.cos(elapsed * 0.2)
            
            # Orientation calculations
            yaw = (math.degrees(math.atan2(math.cos(angle), -math.sin(angle) * 0.8)) + 360) % 360
            pitch = math.sin(elapsed * 0.5) * 2
            roll = math.cos(elapsed * 0.3) * 2

            telemetry = {
                "id": args.id,
                "location": {
                    "lat": current_lat,
                    "lng": current_lng,
                    "altitude": altitude
                },
                "speed": 15.0 + math.sin(elapsed) * 0.5, # Less random noise
                "verticalSpeed": vertical_speed,
                "battery": max(0, 100 - (elapsed / 60)), # Slower drain
                "signal": 95 + math.sin(elapsed * 10) * 2, # Signal oscillation
                "heading": yaw,
                "pitch": pitch,
                "roll": roll,
                "yaw": yaw,
                "temperature": 25 + random.uniform(-0.1, 0.1),
                "mode": "GPS-Denied" if (100 - (elapsed/60)) < 20 else "Auto",
                "status": "flying",
                "flightTime": elapsed,
                "timestamp": time.time() * 1000,
                "gpsSatellites": 12,
                "voltage": 22.4 + math.sin(elapsed * 0.1) * 0.2, # 6S battery approx
                "current": 12.3 + random.uniform(-0.5, 0.5) if altitude > 10 else 2.0,
                "hdop": 0.8 + random.uniform(-0.1, 0.1),
                "humidity": 65 + math.sin(elapsed * 0.05) * 5,
                "windSpeed": 8.5 + math.sin(elapsed * 0.1) * 2,
                "windDir": (245 + math.sin(elapsed * 0.02) * 20) % 360,
                "motors": {
                    "m1": 68 + math.sin(elapsed) * 5,
                    "m2": 73 + math.cos(elapsed) * 5,
                    "m3": 65 + math.sin(elapsed * 1.1) * 5,
                    "m4": 74 + math.cos(elapsed * 1.2) * 5
                }
            }

            payload = json.dumps(telemetry)
            client.publish(topic, payload)
            
            if int(elapsed * 10) % 10 == 0: # Print once per second approx
                print(f"Published: Mode={telemetry['mode']} Alt={telemetry['location']['altitude']:.1f}m Bat={telemetry['battery']:.1f}% Sats={telemetry['gpsSatellites']}")
                
            time.sleep(0.1) # 10Hz update rate
            
    except KeyboardInterrupt:
        print("\nStopping simulation...")
        client.loop_stop()
        client.disconnect()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
