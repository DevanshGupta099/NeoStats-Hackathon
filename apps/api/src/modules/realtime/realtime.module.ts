import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { PresenceService } from './presence.service';
import { AuthModule } from '../auth/auth.module';
import { PolicyModule } from '../../common/policy/policy.module';
import { EventsModule } from '../../common/events/events.module';

@Module({
  imports: [AuthModule, PolicyModule, EventsModule],
  providers: [RealtimeGateway, PresenceService],
  exports: [RealtimeGateway, PresenceService],
})
export class RealtimeModule {}
