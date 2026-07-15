import { Request } from 'express';

import { AuthSessionUser } from './auth.service';

export interface AuthenticatedRequest extends Request {
  user: AuthSessionUser;
}
