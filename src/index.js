"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SenlerStrategy = void 0;
const axios_1 = require("axios");
const passport_oauth2_1 = require("passport-oauth2");
const authorizationURL = 'https://senler.ru/cabinet/OAuth2authorize';
const tokenURL = 'https://senler.ru/ajax/cabinet/OAuth2token';
class SenlerStrategy extends passport_oauth2_1.Strategy {
    constructor(options, verify) {
        options.groupID = options.groupID || '';
        const finalAuthorizationURL = options.authorizationURL || authorizationURL;
        const finalTokenURL = options.tokenURL || tokenURL;
        super({
            clientID: options.clientID,
            clientSecret: options.clientSecret,
            callbackURL: options.callbackURL,
            authorizationURL: finalAuthorizationURL,
            tokenURL: finalTokenURL
        }, verify || (() => { }));
        this.name = 'senler';
        this._clientSecret = options.clientSecret;
        this._callbackURL = options.callbackURL;
        this._groupID = options.groupID || '';
        this._tokenURL = finalTokenURL;
        this._clientID = options.clientID;
    }
    
    async authenticate(req, options) {
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
            const channel = {
                accessToken,
                groupId: this._groupID || undefined
            };
            this.success(channel);
        }
        catch (error) {
            this.fail(`Failed to exchange authorization code: ${error}`);
        }
    }
    async getAccessToken(authorizationCode) {
        try {
            const response = await axios_1.default.get(this._tokenURL, {
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
        }
        catch (error) {
            throw new Error(`Failed to get access token: ${error}`);
        }
    }
}
exports.SenlerStrategy = SenlerStrategy;
