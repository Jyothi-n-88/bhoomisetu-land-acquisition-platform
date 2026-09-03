import { Request, Response } from 'express';
import { isDBConnected } from '../config/db';

export const getHealthStatus = (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'BhoomiSetu backend is running',
    dbConnected: isDBConnected(),
  });
};
