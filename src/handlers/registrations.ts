import * as querystring from 'querystring';

import { Handler } from 'aws-lambda';
import * as HttpStatus from 'http-status-codes';
import * as jwt from 'jsonwebtoken';

import { Planmill } from '../utils/planmill';
import { decodeRegistrationToken } from '../utils/tokens';

/**
 * When user opens a registration link:
 *
 * 1) Check that the registration token is still valid
 * 2) Start OAuth2.0 Authorization Code flow by redirecting the user-agent to Planmill
 */
const handler: Handler = async (event, context, callback) => {
  const registrationToken = event.queryStringParameters.token as string;

  if (registrationToken == null) {
    callback(null, {
      statusCode: HttpStatus.BAD_REQUEST,
      body: 'Missing registration token'
    });
  }

  try {
    decodeRegistrationToken(registrationToken, process.env.JWT_SECRET);
  } catch (err) {
    callback(null, {
      statusCode: HttpStatus.UNAUTHORIZED,
      body: 'Invalid or expired registration token'
    });
  }

  const planmill = new Planmill({
    instanceName: process.env.PLANMILL_INSTANCE_NAME,
    OAuthClientId: process.env.PLANMILL_OAUTH_CLIENT_ID,
    OAuthClientSecret: process.env.PLANMILL_OAUTH_CLIENT_SECRET
  });

  const authorizationUrl = planmill.buildAuthorizationUrl({
    redirectUri: `${process.env.DOMAIN_NAME}/planmill-oauth-callback`,
    state: registrationToken
  });

  callback(null, {
    statusCode: HttpStatus.TEMPORARY_REDIRECT,
    headers: {
      Location: authorizationUrl
    }
  });
};

export default handler;
