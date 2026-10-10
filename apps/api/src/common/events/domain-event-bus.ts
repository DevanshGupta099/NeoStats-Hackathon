import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { RealtimeEnvelope } from '@forgeline/shared';

@Injectable()
export class DomainEventBus {
  private readonly logger = new Logger(DomainEventBus.name);
  private readonly stream = new Subject<RealtimeEnvelope>();

  /**
   * Publish domain event strictly after transaction commit.
   */
  publish<T = unknown>(envelope: RealtimeEnvelope<T>) {
    this.logger.debug(`[DomainEventBus] Broadcast event: ${envelope.event} (entity: ${envelope.entityId})`);
    this.stream.next(envelope as RealtimeEnvelope);
  }

  /**
   * Observable stream consumed by the Socket.IO Realtime Gateway.
   */
  get stream$(): Observable<RealtimeEnvelope> {
    return this.stream.asObservable();
  }
}
