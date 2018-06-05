import * as querystring from 'querystring';

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as HttpStatus from 'http-status-codes';

import { OAuthAccessToken } from '../types';
import { User } from './users';

export interface PlanmillConfig {
  instanceName: string;
  OAuthClientId: string;
  OAuthClientSecret: string;
}

export interface PlanmillUser {
  id: number;
  firstName: string;
  lastName: string;
}

export interface PlanmillReportableTask {
  task: number;
  taskName: string;
  project: number;
  projectName: string;
  lastTimereportCreated: string;
}

type RefreshAccessTokenCallback = (accessToken: OAuthAccessToken) => Promise<void>;

/**
 * Abstraction over Planmill API.
 *
 * Planmill uses OAuth 2.0 for authorization. For purposes of this app Authorization Code grant type is used.
 * More info can be found here: https://developer.okta.com/blog/2018/04/10/oauth-authorization-code-grant-type
 */
export class Planmill {
  public readonly baseUri: string;
  public readonly apiVersion = '1.5';

  constructor(public readonly config: PlanmillConfig) {
    this.baseUri = `https://online.planmill.com/${config.instanceName}/api/`;
  }

  /**
   * Returns owner of the access token.
   *
   * @param accessToken Planmill access token
   */
  public getTokenOwner(accessToken: OAuthAccessToken): Promise<PlanmillUser> {
    return this.get('me', {}, accessToken, () => Promise.resolve());
  }

  /**
   * Returns all reportable tasks for a Planmill user.
   *
   * @param userId Planmill user id
   * @param accessToken Planmill access token
   */
  public async getReportableTasks(user: User, query?: string): Promise<PlanmillReportableTask[]> {
    const tasks: PlanmillReportableTask[] = await this.get(
      `users/${user.planmillId}/reportableassignments`,
      {},
      user.planmillAccessToken,
      async (token: OAuthAccessToken) => {
        user.planmillAccessToken = token;
        await user.save();
      }
    );

    return tasks;
  }

  /**
   * Creates an URL where to send the user-agent to start OAuth2.0 authorization code flow.
   */
  public buildAuthorizationUrl({ state, redirectUri }: { state: string; redirectUri: string }) {
    return (
      this.baseUri +
      '/oauth2/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: this.config.OAuthClientId,
        client_secret: this.config.OAuthClientSecret,
        redirect_uri: redirectUri,
        state
      })
    );
  }

  /**
   * Exchanges the authorization code for an access token.
   *
   * @param authorizationCode Authorization code
   * @returns Valid access token
   */
  public async fetchAccessToken(authorizationCode: string): Promise<OAuthAccessToken> {
    const res = await axios.post(
      this.baseUri + 'oauth2/token',
      querystring.stringify({
        grant_type: 'authorization_code',
        code: authorizationCode,
        client_id: this.config.OAuthClientId,
        client_secret: this.config.OAuthClientSecret,
        redirect_uri: `${process.env.DOMAIN_NAME}/planmill-oauth-callback`
      })
    );

    return res.data;
  }

  private async get(
    path: string,
    query: object,
    accessToken: OAuthAccessToken,
    onRefreshAccessToken: RefreshAccessTokenCallback
  ) {
    if (accessToken == null || accessToken.access_token == null || accessToken.refresh_token == null) {
      throw new Error('Invalid access token');
    }

    const res = await this.commitRequest(
      {
        method: 'GET',
        baseURL: this.baseUri,
        url: this.apiVersion + '/' + path
      },
      accessToken,
      onRefreshAccessToken
    );

    return res.data;
  }

  private async commitRequest(
    config: AxiosRequestConfig,
    accessToken: OAuthAccessToken,
    onRefreshAccessToken: RefreshAccessTokenCallback,
    retries: number = 0
  ): Promise<AxiosResponse> {
    config.headers = {
      Authorization: `Bearer ${accessToken.access_token}`
    };
    try {
      return await axios.request(config);
    } catch (err) {
      if (retries > 3) {
        throw err;
      }
      if (err.response && err.response.status === HttpStatus.UNAUTHORIZED) {
        const updatedToken = await this.refreshAccessToken(accessToken);
        await onRefreshAccessToken(updatedToken);
        return this.commitRequest(config, updatedToken, onRefreshAccessToken, retries + 1);
      }
      return this.commitRequest(config, accessToken, onRefreshAccessToken, retries + 1);
    }
  }

  private async refreshAccessToken(accessToken: OAuthAccessToken): Promise<OAuthAccessToken> {
    try {
      const res = await axios.post(
        this.baseUri + 'oauth2/token',
        querystring.stringify({
          grant_type: 'refresh_token',
          refresh_token: accessToken.refresh_token,
          client_id: this.config.OAuthClientId,
          client_secret: this.config.OAuthClientSecret
        })
      );

      return {
        refresh_token: accessToken.refresh_token,
        access_token: res.data.access_token
      };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
