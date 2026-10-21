export interface EdgeWorkload {
  id: string;
  name: string;
  type: string;
  device: string;
  status: 'Running' | 'Stopped';
  cpuMem: string;
}
