import * as AWS from 'aws-sdk';

import { OAuthAccessToken } from '../types';

const client = new AWS.DynamoDB.DocumentClient();

interface UserParams {
  slackId: string;
  planmillId: number;
  planmillAccessToken: OAuthAccessToken;
}

export class User {
  public static async load(slackId: string): Promise<User> {
    const params = {
      Key: {
        SlackUserId: slackId
      },
      TableName: 'PlanmillTokens'
    };

    const data = await client.get(params).promise();
    return data.Item != null
      ? new User({
          slackId: data.Item.SlackUserId,
          planmillId: data.Item.PlanmillUserId,
          planmillAccessToken: {
            access_token: data.Item.PlanmillAccessToken,
            refresh_token: data.Item.PlanmillRefreshToken
          }
        })
      : null;
  }

  public static async save(user: User) {
    const params = {
      TableName: 'PlanmillTokens',
      Item: {
        SlackUserId: user.slackId,
        PlanmillUserId: user.planmillId,
        PlanmillAccessToken: user.planmillAccessToken.access_token,
        PlanmillRefreshToken: user.planmillAccessToken.refresh_token
      }
    };

    await client.put(params).promise();
  }

  public slackId: string;
  public planmillId: number;
  public planmillAccessToken: OAuthAccessToken;

  public constructor(params: UserParams) {
    this.slackId = params.slackId;
    this.planmillId = params.planmillId;
    this.planmillAccessToken = params.planmillAccessToken;
  }

  public async save() {
    return User.save(this);
  }
}
