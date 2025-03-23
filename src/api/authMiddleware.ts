import type { Request, Response, NextFunction, RequestHandler } from 'express'
import authService from './authService'

export interface AuthedRequest extends Request {
  doctorID: string
}

export const authMiddleware: RequestHandler = (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      res.status(401).json({ error: 'Missing Authorization header' })
      return
    }

    const [type, token] = authHeader.split(' ')
    if (type !== 'Bearer' || !token) {
      res.status(401).json({ error: 'Invalid token format' })
      return
    }

    const doctorID = authService().verify(token)
    if (typeof doctorID !== 'string') {
      res.status(401).json({ error: 'Invalid token' })
      return
    }

    req.doctorID = doctorID

    return next()
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }
}
