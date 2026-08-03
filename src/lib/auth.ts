import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const getJwtKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    console.error('FATAL ERROR: JWT_SECRET environment variable is missing or too weak (must be >= 32 chars).');
    throw new Error('Configuration du serveur invalide.');
  }
  return new TextEncoder().encode(secret);
};

export interface SessionPayload {
  userId: string;
  role: string;
  roleId: string | null;
  [key: string]: any;
}

/**
 * Hash a password/PIN using bcrypt
 */
export async function hashPin(pin: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(pin, saltRounds);
}

/**
 * Verify a password/PIN against a hash
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

/**
 * Encrypt payload into a JWT
 */
export async function encryptSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h') // 8 hours expiration
    .sign(getJwtKey());
}

/**
 * Decrypt a JWT into payload
 */
export async function decryptSession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtKey(), {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}

import { cookies } from 'next/headers';
export async function getCurrentUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  return decryptSession(token);
}
