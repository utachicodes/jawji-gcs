# MQTT Streamer

A robust TypeScript-based MQTT to API bridge service that connects IoT devices to backend systems with real-time streaming capabilities.

## Overview

MQTT Streamer acts as a middleware service that:
- Connects to AWS IoT Core MQTT broker
- Manages multiple device connections
- Batches and streams telemetry data to API endpoints
- Provides device control capabilities
- Offers comprehensive monitoring and health checks

## Features

- **Multi-device MQTT management** with automatic reconnection
- **Real-time data streaming** with configurable batching
- **Device command execution** with state management
- **Health monitoring** and uptime tracking
- **Structured logging** with JSON output
- **REST API** for control and monitoring
- **Docker support** for easy deployment

## Architecture

```
IoT Devices (MQTT) → MQTT Streamer → API Backend
                         ↓
                    Control API
```

## Quick Start

### Prerequisites

- Node.js 18+
- AWS IoT Core certificates
- Target API endpoint

### Installation

```bash
npm install
```

### Configuration

1. Place your AWS IoT certificates in the `certs/` directory:
   - `AmazonRootCA1.pem`
   - `thing.cert.pem`
   - `thing.private.key`

2. Configure your environment variables in `.env`:
   ```
   NODE_ENV=development
   PORT=8000
   CONFIG_PATH=./config/streamer_config.yaml
   ```

3. Update `config/streamer_config.yaml` with your devices and endpoints.

### Dynamic Configuration Sources

Set the `CONFIG_SOURCE` environment variable to determine where the service loads device definitions:

- `yaml` (default): use `config/streamer_config.yaml`
- `mongo`: load from MongoDB via `MONGO_URI`
- `supabase`: load from a Supabase Postgres table

Example Supabase `.env` snippet:

```
CONFIG_SOURCE=supabase
CONFIG_NAME=main
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_CONFIG_TABLE=streamer_configs
```

The Supabase table must contain rows with either a `config` JSON column that matches the YAML structure or individual `mqtt`, `stream`, and `devices` columns. The loader prefers rows flagged as active via `is_active`/`isActive`, then falls back to `CONFIG_NAME`, and finally the most recently updated row.

### Running

```bash
# Development
npm run dev

# Production
npm run build
npm start

# Docker
docker-compose up
```

## API Endpoints

### Status & Monitoring
- `GET /health` - Service health check
- `GET /status` - Overall system status
- `GET /status/stats` - Device statistics
- `GET /status/mqtt` - MQTT connection status
- `GET /status/stream` - Streaming status

### Device Control
- `POST /control/pause/:deviceId` - Pause streaming
- `POST /control/resume/:deviceId` - Resume streaming
- `POST /control/stop/:deviceId` - Stop streaming
- `POST /control/clear-queue/:deviceId` - Clear message queue

### Command Execution
- `POST /command` - Send command to device
- `POST /command/:deviceId` - Send command to specific device

## Configuration

### Device Configuration

The MQTT Streamer supports three subscription modes for maximum flexibility:

#### Selected Mode (Explicit Topics)
```yaml
devices:
  - device_id: "your-device-id"
    stack_name: "device-stack"
    thing_name: "aws-thing-name"
    topics:
      mode: "selected"
      list:
        - "device/sensor/temperature"
        - "device/sensor/humidity"
    metadata:
      location: "Building A"
      zone: "Production"
```

#### Wildcard Mode (Pattern-Based Discovery)
```yaml
devices:
  - device_id: "building-ad-ss1"
    stack_name: "Building-AD-SS1"
    thing_name: "Building-AD-SS1-CaytuThing-xyz"
    topics:
      mode: "wildcard"
      list: []
      wildcards: 
        - "Building-AD-SS1/#"      # All topics under this building
        - "Building-AD-SS1/+/*/state"  # All state topics
    metadata:
      zone: "Primature"
      location: "Anse Bernard, Dakar, Senegal"
      coordinates: [-17.43432115469156, 14.663155985968032]
```
### Stream Configuration

```yaml
stream:
  parameters:
    endpoint: "https://api.example.com/ingest"
    headers:
      x-api-token: "your-api-token"
    streaming:
      enabled: true
      rate: 5000  # milliseconds
```

## Wildcard Mode

**Concept**: Automatically discover and subscribe to MQTT topics using pattern matching instead of explicit topic lists.

**Wildcards**: `#` (multi-level) matches all subtopics, `+` (single-level) matches one topic segment.
```yaml
wildcards: 
  - "Building-AD-SS1/#"           # All building topics
  - "Building-AD-SS1/+/*/state"  # All device states
```

**Auto-Discovery**: Real-time logging of new topics as they publish messages. Access discovered topics via `GET /status/topics/:deviceId`.

## Bulk Commands

**Concept**: Send state commands (ON/OFF) to multiple devices simultaneously using parallel processing.

**Endpoints**:
```bash
POST /bulk-command                    # Generic bulk command with filters

```

**Performance**:Command execution  200-500ms using parallel MQTT publishing.

## Command Format

Commands are automatically formatted based on topic type:

- **State topics** (`/state`): Converted to command format
- **Direct commands** (`/command`): Sent directly
- **Custom topics**: Wrapped in structured payload

Example request:
```json
{
  "device_id": "67c84262153a80ef14155681",
  "topic": "device/light/state",
  "state": "ON",
  "additional_params": {
    "brightness": 75
  }
}
```

## Development

### Project Structure

```
src/
├── api/          # REST API routes and middleware
├── config/       # Configuration loading and validation
├── core/         # Core business logic
│   ├── mqtt/     # MQTT client management
│   ├── stream/   # Data streaming and batching
│   └── command/  # Command handling
├── types/        # TypeScript type definitions
└── utils/        # Utility functions
```

### Building

```bash
npm run build
npm run lint
npm test
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

## Deployment

### Docker

```bash
# Build and run
docker-compose up -d

# Production build
docker build -t mqtt-streamer .
```

### Environment Variables

- `NODE_ENV`: Application environment
- `PORT`: Server port (default: 8000)
- `LOG_LEVEL`: Logging level (debug, info, warn, error)
- `CONFIG_PATH`: Path to configuration file
- `CERTS_DIR`: Directory containing certificates
- `CONFIG_SOURCE`: `yaml`, `mongo`, or `supabase` (defaults to `yaml`)
- `CONFIG_NAME`: Friendly name for the configuration row (defaults to `main`)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_CONFIG_TABLE`: Required when `CONFIG_SOURCE=supabase`

## Monitoring

The service provides comprehensive monitoring through:

- **Health checks** at `/health`
- **Structured logging** with request tracing
- **System metrics** including memory and CPU usage
- **MQTT connection monitoring**
- **Stream performance metrics**

## Error Handling

- Automatic MQTT reconnection with exponential backoff
- Stream retry logic with dead letter handling
- Graceful degradation on API failures
- Comprehensive error logging

## Security

- TLS/SSL for all MQTT connections
- Certificate-based authentication
- Request validation and sanitization
- Security headers via Helmet.js

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please create an issue in the repository.