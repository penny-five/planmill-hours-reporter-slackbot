import * as querystring from 'querystring';

import { Handler } from 'aws-lambda';
import axios from 'axios';
import * as HttpStatus from 'http-status-codes';

import { RegistrationToken } from '../types';
import { Planmill } from '../utils/planmill';
import { encodeRegistrationToken } from '../utils/tokens';
import { User } from '../utils/users';

/**
 * Creates a registration link for a Slack user.
 *
 * @param registrationToken Registration token for the user
 */
export const createRegistrationLink = (registrationToken: RegistrationToken) => {
  return (
    process.env.DOMAIN_NAME +
    '/register?' +
    querystring.stringify({
      token: registrationToken
    })
  );
};

/**
 * Processes all slash commands activated by the user.
 */
const handler: Handler = async (event, context, callback) => {
  const { user_id, callback_url, trigger_id, text, token } = querystring.parse(event.body);

  if (token !== process.env.SLACK_VERIFICATION_TOKEN) {
    throw new Error('Invalid Slack verification token');
  }

  const user = await User.load(user_id as string);

  /**
   * Using the service requires that the user has granted access to Planmill.
   *
   * If user hasn't registered yet then generate a new registration link.
   */
  if (user == null) {
    const registrationToken = encodeRegistrationToken({ userId: user_id as string }, process.env.JWT_SECRET);
    const registrationLink = createRegistrationLink(registrationToken);
    callback(null, {
      statusCode: HttpStatus.OK,
      body: JSON.stringify({
        response_type: 'ephemeral',
        text: `Hi! It seems that you haven't registered yet.\nTo give Planmill Hours Reporter access to your Planmill account please visit ${registrationLink}`
      })
    });
    return;
  }

  const planmill = new Planmill({
    instanceName: process.env.PLANMILL_INSTANCE_NAME,
    OAuthClientId: process.env.PLANMILL_OAUTH_CLIENT_ID,
    OAuthClientSecret: process.env.PLANMILL_OAUTH_CLIENT_SECRET
  });

  const res = await axios.post(
    'https://slack.com/api/dialog.open',
    {
      trigger_id,
      dialog: {
        callback_id: 'REGISTER_HOURS',
        title: 'Report hours to Planmill',
        submit_label: 'Submit',
        elements: [
          {
            type: 'select',
            label: 'Choose Planmill task',
            placeholder: 'Planmill task you would like to register hours to',
            name: 'Planmill task',
            data_source: 'external',
            min_query_length: 0,
            optional: false
          },
          {
            type: 'text',
            subtype: 'number',
            name: 'numHours',
            label: 'Amount of hours',
            placeholder: 'E.g. 2 or 3,5',
            min_length: 1,
            max_length: 5,
            optional: false
          },
          {
            type: 'text',
            name: 'description',
            label: 'Description',
            placeholder: 'E.g. Added tests for backend',
            min_length: 0,
            optional: false
          }
        ]
      }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.SLACK_OAUTH_ACCESS_TOKEN}`
      }
    }
  );

  callback(null, { statusCode: HttpStatus.OK });
};

export default handler;
