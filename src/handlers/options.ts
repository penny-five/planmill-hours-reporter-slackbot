import * as querystring from 'querystring';

import { Handler } from 'aws-lambda';
import * as HttpStatus from 'http-status-codes';
import * as _ from 'lodash';

import { Planmill, PlanmillReportableTask } from '../utils/planmill';
import { User } from '../utils/users';

const handler: Handler = async (event, context, callback) => {
  const payload = JSON.parse(querystring.parse(event.body).payload as string);
  const { token /* value */ } = payload;

  if (token !== process.env.SLACK_VERIFICATION_TOKEN) {
    throw new Error('Invalid Slack verification token');
  }

  const user = await User.load(payload.user.id as string);

  if (user == null) {
    throw new Error('User not registered');
  }

  const planmill = new Planmill({
    instanceName: process.env.PLANMILL_INSTANCE_NAME,
    OAuthClientId: process.env.PLANMILL_OAUTH_CLIENT_ID,
    OAuthClientSecret: process.env.PLANMILL_OAUTH_CLIENT_SECRET
  });

  let tasks = await planmill.getReportableTasks(user);
  tasks = tasks.slice(0, 90); // Selects in Slack dialogs support max 100 items

  const groupedTasks = tasks.reduce((acc, task) => {
    const projectId = task.project.toString();

    if (acc[projectId] == null) {
      acc[projectId] = {
        label: task.projectName,
        options: []
      };
    }
    acc[projectId].options.push({
      label: task.taskName,
      value: task.task
    });
    return acc;
  }, {});

  callback(null, {
    statusCode: HttpStatus.OK,
    body: JSON.stringify({ option_groups: Object.values(groupedTasks) })
  });
};

export default handler;
