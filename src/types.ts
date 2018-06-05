export interface OAuthAccessToken {
  access_token: string;
  refresh_token: string;
}

/**
 * Registration token is a base64 encoded, signed JWT token that contains user's Slack id as a payload.
 *
 * It is used as the "state" variable in OAuth Authorization Code flow. It serves two purposes:
 * 1) It can be verified so it acts as a CSRF protection
 * 2) It contains the user Slack id so Planmill access token can be linked to a specific Slack user.
 */
export type RegistrationToken = string;

export interface RegistrationTokenPayload {
  userId: string;
}
