export interface Tag {
  id: string;
  deviceId: string;
  name: string;
  dataType: string;
  engineeringUnit: string;
  topic?: string;
  jsonPath?: string;
  quality?: string;
  minValue?: number;
  maxValue?: number;
  deadband?: number;
}
