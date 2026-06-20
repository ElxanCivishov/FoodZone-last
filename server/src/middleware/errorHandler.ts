import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[ERROR]', err);

  // Prisma unique constraint
  if (err.code === 'P2002') {
    return res.status(409).json({ 
      success: false, 
      message: 'Record already exists',
      field: err.meta?.target?.[0] 
    });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({ 
      success: false, 
      message: 'Record not found' 
    });
  }

  // Prisma foreign key constraint
  if (err.code === 'P2003') {
    return res.status(400).json({ 
      success: false, 
      message: 'Related record does not exist' 
    });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
