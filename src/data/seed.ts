/* Dummy data for the frontend-only demo. All names, addresses and values are fictional. */
/* eslint-disable */

export const alerts: any[] = [
  { id: 'a1', deviceId: 'tcp://10.0.5.22:1883', message: 'LWT Triggered: Edge Node Offline', severity: 'HIGH', status: 'Active', createdAt: new Date(Date.now() - 600000), actualValue: 'Connection Lost', threshold: 'Keep-Alive 60s' },
  { id: 'a2', deviceId: 'factory/line1/motor1', message: 'Schema Violation: Missing voltage', severity: 'MEDIUM', status: 'Active', createdAt: new Date(Date.now() - 1800000), actualValue: 'null', threshold: 'required' },
  { id: 'a3', deviceId: 'Broker-EMQX', message: 'High Queue Latency Detected', severity: 'LOW', status: 'Resolved', createdAt: new Date(Date.now() - 86400000), actualValue: '120ms', threshold: '100ms' },
  { id: 'a4', deviceId: 'factory/packaging/robotB', message: 'Excessive Publish Rate', severity: 'MEDIUM', status: 'Active', createdAt: new Date(Date.now() - 300000), actualValue: '450 msg/s', threshold: '100 msg/s' },
  { id: 'a5', deviceId: 'logistics/agv/05', message: 'LWT Triggered: AGV Lost WiFi', severity: 'HIGH', status: 'Active', createdAt: new Date(Date.now() - 45000), actualValue: 'Connection Lost', threshold: 'Keep-Alive 10s' },
  { id: 'a6', deviceId: 'factory/utilities/comp1', message: 'Spike in Tank Pressure', severity: 'HIGH', status: 'Active', createdAt: new Date(Date.now() - 120000), actualValue: '185 PSI', threshold: '150 PSI' },
  { id: 'a7', deviceId: 'factory/hvac/unitA', message: 'Coolant Flow Dropping', severity: 'MEDIUM', status: 'Resolved', createdAt: new Date(Date.now() - 4000000), actualValue: '1.2 L/s', threshold: '2.0 L/s' },
  { id: 'a8', deviceId: 'factory/line1/motor1', message: 'Action Required: Complete Diagnostics Questionnaire', severity: 'HIGH', status: 'Active', createdAt: new Date(Date.now() - 5000), actualValue: '95°C', threshold: '80°C', actionType: 'Trigger Questionnaire', questionnaireId: 'q1' }
];

export const connections: any[] = [
  { id: 'CONN-001', name: 'Cloud EMQX Broker', type: 'Protocol', protocol: 'MQTT', details: { broker: 'tcp://broker.emqx.io:1883', clientId: 'iDACS_Main' }, status: 'Connected', lastTested: new Date() },
  { id: 'CONN-002', name: 'Local Edge HiveMQ (Line 1)', type: 'Protocol', protocol: 'MQTT', details: { broker: 'tcp://10.0.5.21:1883', clientId: 'iDACS_Edge_01' }, status: 'Connected', lastTested: new Date() },
  { id: 'CONN-003', name: 'AWS IoT Core (Production)', type: 'Protocol', protocol: 'MQTT', details: { broker: 'ssl://a3qxxxxxxxxxx-ats.iot.us-east-1.amazonaws.com:8883', clientId: 'iDACS_Cloud' }, status: 'Error', lastTested: new Date(Date.now() - 3600000) },
  { id: 'CONN-004', name: 'Mosquitto Gateway (Warehouse)', type: 'Protocol', protocol: 'MQTT', details: { broker: 'tcp://10.0.8.50:1883', clientId: 'iDACS_Whse' }, status: 'Connected', lastTested: new Date() },
  { id: 'CONN-005', name: 'Azure IoT Hub', type: 'Protocol', protocol: 'MQTT', details: { broker: 'ssl://my-hub.azure-devices.net:8883', clientId: 'iDACS_Azure' }, status: 'Connected', lastTested: new Date() },
  { id: 'CONN-006', name: 'Legacy Modbus Gateway', type: 'Protocol', protocol: 'Modbus TCP', details: { ip: '192.168.1.50', port: 502, slaveId: 1 }, status: 'Offline', lastTested: new Date(Date.now() - 86400000) }
];

export const dataQualityExceptions: any[] = [
  { id: '1', time: new Date().toLocaleString(), topic: 'factory/line1/motor1', rule: 'Missing "voltage" field in JSON payload', action: 'Discarded', type: 'warning' },
  { id: '2', time: new Date(Date.now() - 3600000).toLocaleString(), topic: 'factory/hvac/unitA', rule: 'Malformed JSON (Parse Error)', action: 'Discarded', type: 'warning' },
  { id: '3', time: new Date(Date.now() - 7200000).toLocaleString(), topic: 'factory/pumps/pump2', rule: 'Negative value for Pressure (-1.2)', action: 'Zero-clamped', type: 'online' },
  { id: '4', time: new Date(Date.now() - 86400000).toLocaleString(), topic: 'factory/legacy/deviceX', rule: 'Unregistered Topic Pattern', action: 'Ignored', type: 'offline' },
  { id: '5', time: new Date(Date.now() - 12000000).toLocaleString(), topic: 'logistics/agv/04', rule: 'Type mismatch: "battery" should be float', action: 'Cast to float', type: 'warning' }
];

export const devices: any[] = [
  { id: 'MTR-001', name: 'Main Extruder Motor', protocol: 'MQTT v5.0', broker: 'tcp://broker.hivemq.com:1883', topic: 'factory/line1/motor1', status: 'Online', enabled: true, lastSeen: new Date(), qos: 1, keepAlive: 60, lwtEnabled: true },
  { id: 'HVAC-A', name: 'Cooling Unit A', protocol: 'MQTT v5.0', broker: 'tcp://10.0.5.21:1883', topic: 'factory/hvac/unitA', status: 'Warning', enabled: true, lastSeen: new Date(Date.now() - 300000), qos: 0, keepAlive: 120, lwtEnabled: false },
  { id: 'PUMP-2', name: 'Coolant Pump 2', protocol: 'MQTT v3.1.1', broker: 'tcp://10.0.5.22:1883', topic: 'factory/pumps/pump2', status: 'Offline', enabled: false, qos: 2, keepAlive: 30, lwtEnabled: true },
  { id: 'CNC-11', name: 'Milling CNC 11', protocol: 'MQTT v5.0', broker: 'tcp://broker.hivemq.com:1883', topic: 'factory/line3/cnc11', status: 'Online', enabled: true, qos: 1, keepAlive: 60, lwtEnabled: true },
  { id: 'ROBOT-B', name: 'Packaging Robot B', protocol: 'MQTT v5.0', broker: 'tcp://broker.emqx.io:1883', topic: 'factory/packaging/robotB', status: 'Online', enabled: true, qos: 2, keepAlive: 15, lwtEnabled: true },
  { id: 'AGV-04', name: 'Warehouse AGV 04', protocol: 'MQTT v5.0', broker: 'ssl://aws-iot-core:8883', topic: 'logistics/agv/04', status: 'Online', enabled: true, qos: 1, keepAlive: 10, lwtEnabled: true },
  { id: 'AGV-05', name: 'Warehouse AGV 05', protocol: 'MQTT v5.0', broker: 'ssl://aws-iot-core:8883', topic: 'logistics/agv/05', status: 'Offline', enabled: true, qos: 1, keepAlive: 10, lwtEnabled: true },
  { id: 'SENSOR-TMP', name: 'Ambient Temp Sensor', protocol: 'MQTT v3.1.1', broker: 'tcp://10.0.5.21:1883', topic: 'facility/env/temp1', status: 'Online', enabled: true, qos: 0, keepAlive: 300, lwtEnabled: false },
  { id: 'COMPRESSOR-1', name: 'Air Compressor 1', protocol: 'MQTT v5.0', broker: 'tcp://broker.emqx.io:1883', topic: 'factory/utilities/comp1', status: 'Warning', enabled: true, qos: 1, keepAlive: 60, lwtEnabled: true },
  { id: 'ST-04', name: 'Assembly Station 04', protocol: 'mqtt', broker: 'tcp://localhost:1883', topic: 'factory/station/ST-04/data', status: 'Online', enabled: true, qos: 0, keepAlive: 60, lwtEnabled: false }
];

export const edgeWorkloads: any[] = [
  { id: 'w1', name: 'Vibration-Spike-Filter', type: 'regex', device: 'MTR-001', status: 'Running', cpuMem: '1.2% / 14MB' },
  { id: 'w2', name: 'Anomaly-Detection-AI', type: 'execd', device: 'ROBOT-B', status: 'Running', cpuMem: '12.4% / 128MB' },
  { id: 'w3', name: 'Temp-Fahrenheit-Conv', type: 'scale', device: 'SENSOR-TMP', status: 'Running', cpuMem: '0.1% / 2MB' },
  { id: 'w4', name: 'Payload-Minifier', type: 'starlark', device: 'AGV-04', status: 'Running', cpuMem: '2.5% / 18MB' },
  { id: 'w5', name: 'Deadband-Pressure', type: 'starlark', device: 'PUMP-2', status: 'Stopped', cpuMem: '0% / 0MB' },
  { id: 'w6', name: 'Agg-1Min-Average', type: 'starlark', device: 'HVAC-A', status: 'Running', cpuMem: '3.1% / 22MB' }
];

export const predictiveModels: any[] = [
  { id: 'pm1', name: 'Vibration-FFT-Bearing', target: 'MTR-001', version: 'v2.1.4', status: 'Running', confidence: '94%', lastUpdated: new Date(), anomalyScore: 0.12 },
  { id: 'pm2', name: 'Thermal-Overload-Predictor', target: 'HVAC-A', version: 'v1.0.8', status: 'Running', confidence: '88%', lastUpdated: new Date(Date.now() - 3600000), anomalyScore: 0.45 },
  { id: 'pm3', name: 'Spindle-Wear-Estimation', target: 'CNC-11', version: 'v3.0.0', status: 'Training', confidence: '--', lastUpdated: new Date(Date.now() - 86400000), anomalyScore: 0 },
  { id: 'pm4', name: 'Robot-Joint-Fatigue', target: 'ROBOT-B', version: 'v1.5.2', status: 'Running', confidence: '97%', lastUpdated: new Date(Date.now() - 120000), anomalyScore: 0.82 },
  { id: 'pm5', name: 'Pump-Cavitation-AI', target: 'PUMP-2', version: 'v1.1.1', status: 'Stopped', confidence: '72%', lastUpdated: new Date(Date.now() - 4000000), anomalyScore: 0 }
];

export const tags: any[] = [
  { id: 't1', deviceId: 'MTR-001', name: 'MainExtruder_Temp', dataType: 'Numeric', engineeringUnit: '°C', topic: 'factory/line1/motor1', jsonPath: '$.fields.temperature', quality: 'Good' },
  { id: 't2', deviceId: 'MTR-001', name: 'MainExtruder_Speed', dataType: 'Numeric', engineeringUnit: 'RPM', topic: 'factory/line1/motor1', jsonPath: '$.fields.rpm', quality: 'Good' },
  { id: 't3', deviceId: 'MTR-001', name: 'MainExtruder_Voltage', dataType: 'Numeric', engineeringUnit: 'V', topic: 'factory/line1/motor1', jsonPath: '$.fields.voltage', quality: 'Good' },
  { id: 't4', deviceId: 'HVAC-A', name: 'CoolantFlow_Rate', dataType: 'Numeric', engineeringUnit: 'L/s', topic: 'factory/hvac/unitA', jsonPath: '$.fields.flowRate', quality: 'Warning' },
  { id: 't5', deviceId: 'HVAC-A', name: 'Coolant_Pressure', dataType: 'Numeric', engineeringUnit: 'bar', topic: 'factory/hvac/unitA', jsonPath: '$.fields.pressure', quality: 'Good' },
  { id: 't6', deviceId: 'PUMP-2', name: 'Pump2_Vibration', dataType: 'Numeric', engineeringUnit: 'mm/s', topic: 'factory/pumps/pump2', jsonPath: '$.fields.vibration', quality: 'Bad' },
  { id: 't7', deviceId: 'CNC-11', name: 'Spindle_Z_Axis', dataType: 'Numeric', engineeringUnit: 'mm', topic: 'factory/line3/cnc11', jsonPath: '$.fields.z_axis', quality: 'Good' },
  { id: 't8', deviceId: 'CNC-11', name: 'Tool_Wear', dataType: 'Numeric', engineeringUnit: '%', topic: 'factory/line3/cnc11', jsonPath: '$.tags.tool_wear', quality: 'Warning' },
  { id: 't9', deviceId: 'ROBOT-B', name: 'Joint1_Angle', dataType: 'Numeric', engineeringUnit: 'deg', topic: 'factory/packaging/robotB', jsonPath: '$.fields.j1_angle', quality: 'Good' },
  { id: 't10', deviceId: 'ROBOT-B', name: 'Payload_Weight', dataType: 'Numeric', engineeringUnit: 'kg', topic: 'factory/packaging/robotB', jsonPath: '$.fields.payload', quality: 'Good' },
  { id: 't11', deviceId: 'AGV-04', name: 'Battery_Level', dataType: 'Numeric', engineeringUnit: '%', topic: 'logistics/agv/04', jsonPath: '$.battery.percentage', quality: 'Good' },
  { id: 't12', deviceId: 'AGV-04', name: 'Current_Task', dataType: 'String', engineeringUnit: '', topic: 'logistics/agv/04', jsonPath: '$.state.task', quality: 'Good' },
  { id: 't13', deviceId: 'SENSOR-TMP', name: 'Zone1_Temp', dataType: 'Numeric', engineeringUnit: '°C', topic: 'facility/env/temp1', jsonPath: '$.temperature', quality: 'Good' },
  { id: 't14', deviceId: 'SENSOR-TMP', name: 'Zone1_Humidity', dataType: 'Numeric', engineeringUnit: '%', topic: 'facility/env/temp1', jsonPath: '$.humidity', quality: 'Good' },
  { id: 't15', deviceId: 'COMPRESSOR-1', name: 'Tank_Pressure', dataType: 'Numeric', engineeringUnit: 'PSI', topic: 'factory/utilities/comp1', jsonPath: '$.fields.tankPressure', quality: 'Warning' },
  { id: 't16', deviceId: 'ST-04', name: 'RunningStatus', dataType: 'Numeric', engineeringUnit: '', topic: 'factory/station/ST-04/data', jsonPath: '$.RunningStatus', quality: 'Good' },
  { id: 't17', deviceId: 'ST-04', name: 'Cycle_Time', dataType: 'Numeric', engineeringUnit: 'ms', topic: 'factory/station/ST-04/data', jsonPath: '$.Cycle_Time', quality: 'Good' },
  { id: 't18', deviceId: 'ST-04', name: 'StationCode', dataType: 'String', engineeringUnit: '', topic: 'factory/station/ST-04/data', jsonPath: '$.StationCode', quality: 'Good' }
];

export const validationSchemas: any[] = [
  { topicPattern: 'factory/+/motor+', requiredFields: 'temperature, rpm, voltage' },
  { topicPattern: 'factory/hvac/+', requiredFields: 'flowRate, pressure' },
  { topicPattern: 'logistics/agv/+', requiredFields: 'battery.percentage, state.task' },
  { topicPattern: 'facility/env/+', requiredFields: 'temperature, humidity' }
];

export const rules: any[] = [
  { id: 'R-001', name: 'High Spindle Temperature', description: 'Spindle temperature above limit while the spindle is running',
    type: 'THRESHOLD', logicalOperator: 'AND', enabled: true, priority: 'High', status: 'Active', action: 'Trigger Alert',
    conditions: [{ deviceId: 'CNC-11', tag: 'Spindle_Z_Axis', operator: '>', value: 90, not: false, unit: 'mm' },
                 { deviceId: 'CNC-11', tag: 'Tool_Wear', operator: '>=', value: 70, not: false, unit: '%' }],
    actions: [{ actionType: 'Trigger Alert', severity: 'HIGH', notification: 'Email + Dashboard' }] },
  { id: 'R-002', name: 'Extruder Motor Overheat', description: 'Main extruder temperature too high - run diagnostics',
    type: 'THRESHOLD', logicalOperator: 'OR', enabled: true, priority: 'High', status: 'Active', action: 'Trigger Questionnaire',
    conditions: [{ deviceId: 'MTR-001', tag: 'MainExtruder_Temp', operator: '>', value: 80, not: false, unit: '°C' }],
    actions: [{ actionType: 'Trigger Questionnaire', severity: 'HIGH', notification: 'Dashboard', questionnaireId: 'q1' }] },
  { id: 'R-003', name: 'Low AGV Battery', description: 'AGV battery level below safe threshold', type: 'THRESHOLD',
    logicalOperator: 'AND', enabled: true, priority: 'Medium', status: 'Active', action: 'Trigger Alert',
    conditions: [{ deviceId: 'AGV-04', tag: 'Battery_Level', operator: '<', value: 20, not: false, unit: '%' }],
    actions: [{ actionType: 'Trigger Alert', severity: 'MEDIUM', notification: 'Dashboard' }] },
  { id: 'R-004', name: 'Compressor Tank Pressure', description: 'Tank pressure spike on air compressor', type: 'THRESHOLD',
    logicalOperator: 'AND', enabled: false, priority: 'Low', status: 'Disabled', action: 'Trigger Alert',
    conditions: [{ deviceId: 'COMPRESSOR-1', tag: 'Tank_Pressure', operator: '>', value: 150, not: false, unit: 'PSI' }],
    actions: [{ actionType: 'Trigger Alert', severity: 'LOW', notification: 'Email' }] },
];

export const questionnaires: any[] = [
  { id: 'q1', title: 'Motor Overheat Diagnostics', description: 'Checklist for the operator when a motor overheats.',
    createdAt: Date.now() - 86400000 * 3, updatedAt: Date.now() - 86400000,
    questions: [
      { id: 'q1-1', text: 'Is the cooling fan running?', type: 'YES_NO', required: true },
      { id: 'q1-2', text: 'Measured motor surface temperature (°C)', type: 'NUMBER', required: true },
      { id: 'q1-3', text: 'Likely cause', type: 'SINGLE_CHOICE', required: true, options: [
        { id: 'o1', label: 'Blocked air vent', value: 'vent' }, { id: 'o2', label: 'Overload', value: 'overload' },
        { id: 'o3', label: 'Bearing wear', value: 'bearing' }] },
      { id: 'q1-4', text: 'Notes', type: 'TEXT', required: false },
    ] },
  { id: 'q2', title: 'AGV Battery Swap Checklist', description: 'Steps before returning an AGV to service.',
    createdAt: Date.now() - 86400000 * 7, updatedAt: Date.now() - 86400000 * 2,
    questions: [
      { id: 'q2-1', text: 'Battery swapped?', type: 'YES_NO', required: true },
      { id: 'q2-2', text: 'Checks completed', type: 'MULTIPLE_CHOICE', required: false, options: [
        { id: 'o1', label: 'Connectors', value: 'connectors' }, { id: 'o2', label: 'Charge level', value: 'charge' },
        { id: 'o3', label: 'Wheel sensors', value: 'wheels' }] },
    ] },
];
