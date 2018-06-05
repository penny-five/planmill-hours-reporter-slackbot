import * as jwt from 'jsonwebtoken';

import { RegistrationToken, RegistrationTokenPayload } from '../types';

/**
 * Encodes a registration token.
 *
 * Returned token is a base64-encoded, signed JWT token that contains user's Slack id and has expiration time of 1 hour.
 *
 * @param payload Token payload
 * @param secret Secret for HMAC algorithm
 * @returns Encoded registration token
 */
export const encodeRegistrationToken = (payload: RegistrationTokenPayload, secret: string): RegistrationToken => {
  const signedToken = jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: '1h'
  });

  return Buffer.from(signedToken).toString('base64');
};

/**
 * Try to decode registration token.
 *
 * @param encodedToken Encoded registration token
 * @param secret Secret for HMAC algorithm
 * @returns Registration token payload
 * @throws If token is invalid or expired.
 */
export const decodeRegistrationToken = (encodedToken: RegistrationToken, secret: string): RegistrationTokenPayload => {
  try {
    const payload: any = jwt.verify(Buffer.from(encodedToken, 'base64').toString(), secret);
    return payload;
  } catch (err) {
    throw err;
  }
};
