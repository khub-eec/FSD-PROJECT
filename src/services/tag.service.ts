import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RemoteCollection } from '../lib/remoteCollection';
import { Tag } from '../models/tag.model';

export class TagService extends RemoteCollection<Tag> {
  tags$ = this.items$;

  constructor() {
    super('/api/tags');
  }

  getTags(): Observable<Tag[]> {
    return this.tags$;
  }

  getTagsByDevice(deviceId: string): Observable<Tag[]> {
    // Follows the live list so tags that finish loading after the page mounts still appear.
    return this.tags$.pipe(
      map(tags => tags.filter(t => t.deviceId === deviceId || deviceId === 'All Devices'))
    );
  }

  addTag(tag: Tag): Observable<Tag> {
    return this.create({ ...tag, id: `t${Date.now()}` });
  }

  updateTag(tag: Tag): Observable<Tag> {
    return this.update({ ...tag });
  }

  deleteTag(id: string): Observable<boolean> {
    return this.remove(id).pipe(map(() => true));
  }
}

export const tagService = new TagService();
