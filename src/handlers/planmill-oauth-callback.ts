import { Handler } from 'aws-lambda';
import * as HttpStatus from 'http-status-codes';

import { Planmill } from '../utils/planmill';
import { decodeRegistrationToken } from '../utils/tokens';
import { User } from '../utils/users';

const handler: Handler = async (event, context, callback) => {
  const code = event.queryStringParameters.code as string;
  const state = event.queryStringParameters.state as string;

  const registrationToken = decodeRegistrationToken(state, process.env.JWT_SECRET);

  const planmill = new Planmill({
    instanceName: process.env.PLANMILL_INSTANCE_NAME,
    OAuthClientId: process.env.PLANMILL_OAUTH_CLIENT_ID,
    OAuthClientSecret: process.env.PLANMILL_OAUTH_CLIENT_SECRET
  });

  const planmillAccessToken = await planmill.fetchAccessToken(code);
  const tokenOwner = await planmill.getTokenOwner(planmillAccessToken);

  const user = new User({
    slackId: registrationToken.userId,
    planmillId: tokenOwner.id,
    planmillAccessToken
  });

  await user.save();

  callback(null, {
    statusCode: HttpStatus.OK,
    body: 'Success! You can now start using Planmill Hours Reporter'
  });
};

export default handler;
