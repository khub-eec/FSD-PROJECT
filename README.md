# IDACS – Frontend Demo

A frontend-only demo of **IDACS (Intelligent Data Acquisition and Control System)**, an IoT device management console.
It runs entirely in the browser with **dummy data**: there is no backend, database or MQTT broker to set up.

## Features

- **Dashboard** with system health, device and tag counts, active rules and alerts
- **Device Management** for adding, editing, enabling and deleting devices
- **Tag Management**, which maps JSON paths in device payloads to named tags
- **Connection Manager** with a simulated MQTT connection test
- **Real-Time Analysis** of a live, simulated motor feed (voltage, current, power, RPM, vibration)
- **Rule Engine** with multi-condition AND/OR rules
- **Alerts & Notifications** with acknowledge and acknowledge-all; a simulated rule fires about every 40 seconds
- **Questionnaire Builder**, Data Quality, Edge Processing, Diagnostics, Reports, Standard APIs and Predictive Maintenance pages

## How the demo works

| Part | In this demo |
| --- | --- |
| REST API | `src/lib/api.ts` answers every request from an in-browser mock database (`src/lib/mockDb.ts`) |
| Data | Dummy records in `src/data/seed.ts`; your changes are saved in `localStorage` |
| Live telemetry | `src/services/signalr.service.ts` publishes a simulated motor reading every second |
| MQTT test | `src/services/mqtt-client.service.ts` simulates a broker connection; no network traffic |

Use **Reset demo data** in the sidebar to go back to the original dummy data.

## Tech stack

React 19 · TypeScript · Vite · React Router · RxJS

## Run locally

```bash
npm install
npm run dev        # http://localhost:4200
```

Production build:

```bash
npm run build      # output in dist/
npm run preview
```

The app uses hash-based routing and relative asset paths, so the `dist/` folder can be hosted on any static host,
including GitHub Pages. A workflow in `.github/workflows/deploy.yml` publishes it on every push to `main` once
Pages is set to "GitHub Actions" in the repository settings.

> All names, devices, addresses and values in this demo are fictional sample data.
