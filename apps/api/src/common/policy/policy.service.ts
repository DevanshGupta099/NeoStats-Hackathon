import { Injectable } from '@nestjs/common';
import { hasPermission, Permission, PolicyContext } from '@forgeline/shared';

@Injectable()
export class PolicyService {
  /**
   * Pure evaluation of user authorization against the shared policy matrix.
   */
  can(action: Permission, context: PolicyContext): boolean {
    return hasPermission(action, context);
  }
}
