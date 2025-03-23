import jwt from 'jsonwebtoken'

export default function authService() {

  const verify = (token: string) => jwt.verify(token, process.env.JWTSecret || '')

  const generateToken = (payload: string) =>
    jwt.sign(payload, process.env.JWTSecret || '')

  return {
    verify,
    generateToken
  }
}
