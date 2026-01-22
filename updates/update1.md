# Jawji GCS Weekly Update

## Work Completed So Far

### 1. Mission Planner Integration (Kiosks)

* Added **kiosks** directly into **Mission Planner**.
* Ensured they are properly displayed and accessible within the mission planning workflow.
* Verified that kiosk data integrates cleanly with existing mission elements.

### 2. User Interface & Usability Improvements

* Improved **responsiveness** of the interface.
* Optimized layouts to:

  * Display correctly on **smaller screens**
  * Adapt fluidly to **all screen sizes**
* Ensured critical telemetry and controls remain visible and usable regardless of resolution.

### 3. MAVLink to JSON Transformation

* Implemented a pipeline to **decode MAVLink messages** and convert them into **JSON**.

---

## Communication Architecture

## 1. What Caytu gives us 

According to the diagram Caytu exposes drone data via an **MQTT Broker**.

### Caytu’s role

* Caytu receives MAVLink from the drone
* Caytu:

  * Converts MAVLink → structured telemetry
  * Manages security, QoS, routing
* Caytu publishes data to MQTT topics

Caytu is just a **data provider**.

---

## 2. How *the GCS* receive the data

### Connection type

We are going to connect as a **standard MQTT client**.

That means:

* TCP connection to MQTT broker
* Auth handled by Caytu (token, certs, credentials)

From the diagram:

```
MQTT Broker
caytu/fleet/{drone}/+
```

---

## 3. What data you subscribe to

You subscribe to **telemetry topics**.

Examples shown in the diagram:

### Telemetry

```
caytu/drone123/telemetry/state
```

Payload (already JSON):

```json
{
  "mode": "AUTO",
  "lat": 14.672,
  "battery": 83,
  "status": "OK"
}
```

This is **already decoded MAVLink**, structured by Caytu.

This is the **main data you consume**.

### You ARE receiving:

* **JSON telemetry over MQTT**
* Clean, structured, readable data
* Ready for UI, dashboards, storage

## 5. GCS Internal Mecanics

From Caytu → Jawji GCS:

```
MQTT Broker (Caytu)
        ↓
MQTT Client (JAWJI GCS)
        ↓
Telemetry JSON
        ↓
Processing / Mapping
        ↓
UI / Mission Planner / Logic
```

