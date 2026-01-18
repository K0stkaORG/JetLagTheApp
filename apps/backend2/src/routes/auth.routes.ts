import { Router, Request, Response } from 'express';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '@jetlag/shared-types';
import { validate } from '../middleware/validation';

const router: Router = Router();

router.post(
  '/register',
  validate(RegisterRequest),
  async (req: Request<{}, RegisterResponse, RegisterRequest>, res: Response<RegisterResponse>) => {
    // TODO: Implement registration
    const { username, password, email } = req.body;
    // db.insert(users)...
    console.log('Registering', username, email, password ? '***' : 'no-pass');
    res.status(201).json({ message: 'Register placeholder', user: { username, email } });
  }
);

router.post(
  '/login',
  validate(LoginRequest),
  async (req: Request<{}, LoginResponse, LoginRequest>, res: Response<LoginResponse>) => {
    // TODO: Implement login
    const { username, password } = req.body;
    // const user = db.query...
    // if (password match) ...
    console.log('Logging in', username, password ? '***' : 'no-pass');
    res.status(200).json({ message: 'Login placeholder', token: 'fake-jwt-token' });
  }
);

export const authRouter: Router = router;
