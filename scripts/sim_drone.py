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
    # Vertical speed is derivative of altitude (approx)
    # d(50 + 5sin(0.5t))/dt = 2.5cos(0.5t)
    vertical_speed = 2.5 * math.cos(elapsed * 0.5)

    data = {
        "id": drone_id,
        "location": {
            "lat": current_lat,
            "lng": current_lng,
            "altitude": altitude
        },
        "speed": 15.0 + random.uniform(-1, 1),
        "vertical_speed": vertical_speed,
        "battery": battery,
        "signal": 90 + random.uniform(-5, 5),
        "heading": (elapsed * speed * 180 / math.pi) % 360,
        "status": "flying" if battery > 10 else "landed",
        "flightTime": elapsed,
        "timestamp": time.time() * 1000,
        "gpsSatellites": 12  # Simulate good GPS
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
        
        while True:
            telemetry = generate_telemetry(args.id, start_time, base_location)
            payload = json.dumps(telemetry)
            client.publish(topic, payload)
            print(f"Published to {topic}: Alt={telemetry['location']['altitude']:.1f}m Bat={telemetry['battery']:.1f}%")
            time.sleep(1) # 1Hz update rate
            
    except KeyboardInterrupt:
        print("\nStopping simulation...")
        client.loop_stop()
        client.disconnect()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
