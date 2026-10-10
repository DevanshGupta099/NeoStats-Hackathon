import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CsrfOriginGuard } from './guards/csrf-origin.guard';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET', 'forgeline_dev_jwt_access_secret_min_32_chars_long'),
        signOptions: {
          expiresIn: (config.get<string>('ACCESS_TOKEN_TTL', '15m') as any),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, CsrfOriginGuard],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
