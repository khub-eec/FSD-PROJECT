import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RemoteCollection } from '../lib/remoteCollection';
import { Connection } from '../models/connection.model';

export class ConnectionService extends RemoteCollection<Connection> {
  connections$ = this.items$;

  constructor() {
    super('/api/connections');
  }

  getConnections(): Observable<Connection[]> {
    return this.connections$;
  }

  createConnection(conn: Connection): Observable<Connection> {
    return this.create({ ...conn, id: `CONN-${Math.floor(Math.random() * 1000)}`, status: 'Offline' as const });
  }

  updateConnection(conn: Connection): Observable<Connection> {
    return this.update({ ...conn });
  }

  deleteConnection(id: string): Observable<boolean> {
    return this.remove(id).pipe(map(() => true));
  }

  testConnection(id: string): Observable<boolean> {
    return new Observable<boolean>(observer => {
      setTimeout(() => {
        const conn = this.value.find(c => c.id === id);
        if (conn) {
          const isSuccess = Math.random() > 0.1;
          this.updateOptimistic({
            ...conn,
            status: isSuccess ? 'Connected' : 'Error',
            lastTested: new Date(),
          });
          observer.next(isSuccess);
        } else {
          observer.next(false);
        }
        observer.complete();
      }, 600);
    });
  }
}

export const connectionService = new ConnectionService();
