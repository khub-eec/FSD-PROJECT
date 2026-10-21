import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { RemoteCollection } from '../lib/remoteCollection';
import { Device } from '../models/device.model';

export class DeviceService extends RemoteCollection<Device> {
  devices$ = this.items$;

  constructor() {
    super('/api/devices');
  }

  getDevices(): Observable<Device[]> {
    return this.devices$;
  }

  getDevice(id: string): Observable<Device | undefined> {
    return of(this.value.find(d => d.id === id));
  }

  addDevice(device: Device): Observable<boolean> {
    return this.create(device).pipe(map(() => true));
  }

  updateDevice(updatedDevice: Device): Observable<boolean> {
    return this.update(updatedDevice).pipe(map(() => true));
  }

  deleteDevice(id: string): Observable<boolean> {
    return this.remove(id).pipe(map(() => true));
  }

  testConnection(device: Device): Observable<{success: boolean, message: string}> {
    return of({
      success: true,
      message: `Ping to ${device.broker || 'Broker'} successful for ${device.id}`
    }).pipe(delay(500));
  }
}

export const deviceService = new DeviceService();
