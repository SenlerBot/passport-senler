import axios from 'axios';
import { Request } from 'express';
import { Strategy as OAuth2Strategy, VerifyFunction } from 'passport-oauth2';

export interface SenlerStrategyOptions {
  clientID: string;
  groupID?: string;
  clientSecret: string;
  callbackURL: string;
  authorizationURL?: string;
  tokenURL?: string;
}

export interface SenlerAccessTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
}

export interface SenlerChannel {
  accessToken: string;
  groupId?: string | undefined;
}

const authorizationURL = 'https://senler.ru/cabinet/OAuth2authorize';
const tokenURL = 'https://senler.ru/ajax/cabinet/OAuth2token';

export class SenlerStrategy extends OAuth2Strategy {
  public name: string = 'senler';
  private _clientSecret: string;
  private _tokenURL: string;
  private _clientID: string;
  private _groupID: string;
  private _callbackURL: string;

  constructor(options: SenlerStrategyOptions, verify?: VerifyFunction) {
    options.groupID = options.groupID || '';

    const finalAuthorizationURL = options.authorizationURL || authorizationURL;
    const finalTokenURL = options.tokenURL || tokenURL;

    super({ 
      clientID: options.clientID,
      clientSecret: options.clientSecret,
      callbackURL: options.callbackURL,
      authorizationURL: finalAuthorizationURL, 
      tokenURL: finalTokenURL 
    }, verify || ((): void => {}));

    this._clientSecret = options.clientSecret;
    this._callbackURL = options.callbackURL;
    this._groupID = options.groupID || '';
    this._tokenURL = finalTokenURL;
    this._clientID = options.clientID;
  }

  /**
   * Переопределяем метод для добавления дополнительных параметров в URL авторизации
   * @param options - опции переданные в passport.authenticate()
   * @returns объект с дополнительными параметрами для URL авторизации
   */
  authorizationParams(options: any = {}): Record<string, string> {
    const params: Record<string, string> = {};
    
    // Вызываем родительский метод для получения базовых параметров
    try {
      const parentParams = super.authorizationParams(options);
      if (parentParams && typeof parentParams === 'object') {
        Object.assign(params, parentParams);
      }
    } catch (error) {
      // Если родительский метод не существует или выдает ошибку, продолжаем
    }
    
    // Определяем приоритет для group_id:
    // 1. Из опций authenticate() (самый высокий приоритет)
    // 2. Из настроек стратегии (из конструктора)
    const groupId = options.group_id || this._groupID;
    
    if (groupId) {
      params.group_id = groupId;
    }
    
    return params;
  }

  async authenticate(req: Request, options?: object): Promise<void> {
    const authorizationCode = req.query.code?.toString();
    const groupId = req.query.group_id?.toString();

    if (!authorizationCode) {
      return super.authenticate(req, options);
    }

    if (groupId) {
      this._groupID = groupId;
    }

    try {
      const accessToken = await this.getAccessToken(authorizationCode);
      const channel: SenlerChannel = { 
        accessToken,
        groupId: this._groupID || undefined
      };
      this.success(channel);
    } catch (error) {
      this.fail(`Failed to exchange authorization code: ${error}`);
    }
  }

  async getAccessToken(authorizationCode: string): Promise<string> {
    try {
      const response = await axios.get<SenlerAccessTokenResponse>(this._tokenURL, {
        params: {
          grant_type: 'authorization_code',
          client_id: this._clientID,
          client_secret: this._clientSecret,
          redirect_uri: this._callbackURL, // Must match the registered callback URL
          code: authorizationCode,
          group_id: this._groupID,
        },
      });

      if (response.data && response.data.access_token) {
        return response.data.access_token;
      }

      throw new Error('No access token in response');
    } catch (error) {
      throw new Error(`Failed to get access token: ${error}`);
    }
  }
}
