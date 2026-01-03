import bcrypt from 'bcryptjs'

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}

/**
 * Compare a password with a hash
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if passwords match
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generate a random token
 * @param length - Token length (default: 32)
 * @returns Random hex string
 */
export function generateToken(length: number = 32): string {
  const crypto = require('crypto')
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Hash a token for storage
 * @param token - Plain text token
 * @returns Hashed token
 */
export function hashToken(token: string): string {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(token).digest('hex')
}
