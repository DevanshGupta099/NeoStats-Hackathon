import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithId extends Request {
  requestId?: string;
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: NextFunction) {
    const existingId = req.headers['x-request-id'] as string;
    const requestId = existingId || `req_${uuidv4()}`;

    req.id = requestId;
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    next();
  }
}
