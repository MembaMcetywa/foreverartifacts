import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  GetUserCommand,
  InitiateAuthCommand,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { createHmac, randomUUID } from 'crypto';

import { PrismaService } from '../database/prisma.service';

interface CognitoTokenPayload {
  sub?: string;
  'cognito:username'?: string;
  email?: string;
  email_verified?: boolean | string;
}

interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface AuthSessionUser {
  id: string;
  email: string;
  emailVerified: boolean;
}

@Injectable()
export class AuthService {
  private readonly client: CognitoIdentityProviderClient;
  private readonly userPoolId: string;
  private readonly clientId: string;
  private readonly clientSecret?: string;

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.userPoolId = config.get<string>('COGNITO_USER_POOL_ID', '');
    this.clientId = config.get<string>('COGNITO_CLIENT_ID', '');
    this.clientSecret =
      config.get<string>('COGNITO_CLIENT_SECRET') || undefined;
    this.client = new CognitoIdentityProviderClient({
      region: config.get<string>('AWS_REGION', 'af-south-1'),
    });
  }

  async signUp(email: string, password: string): Promise<void> {
    this.assertConfigured();

    try {
      await this.client.send(
        new SignUpCommand({
          ClientId: this.clientId,
          Username: email,
          Password: password,
          SecretHash: this.getSecretHash(email),
          UserAttributes: [{ Name: 'email', Value: email }],
        }),
      );
    } catch (error) {
      throw this.toAuthException(error, 'Sign up failed.');
    }
  }

  async confirmSignUp(email: string, code: string): Promise<void> {
    this.assertConfigured();

    try {
      await this.client.send(
        new ConfirmSignUpCommand({
          ClientId: this.clientId,
          Username: email,
          ConfirmationCode: code,
          SecretHash: this.getSecretHash(email),
        }),
      );
    } catch (error) {
      throw this.toAuthException(error, 'Confirmation failed.');
    }
  }

  async login(
    email: string,
    password: string,
  ): Promise<{
    tokens: AuthTokens;
    user: AuthSessionUser;
  }> {
    this.assertConfigured();

    try {
      const response = await this.client.send(
        new InitiateAuthCommand({
          ClientId: this.clientId,
          AuthFlow: 'USER_PASSWORD_AUTH',
          AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
            ...(this.clientSecret
              ? { SECRET_HASH: this.getSecretHash(email) }
              : {}),
          },
        }),
      );

      const result = response.AuthenticationResult;

      if (!result?.AccessToken || !result.IdToken || !result.ExpiresIn) {
        throw new UnauthorizedException(
          'Additional authentication is required.',
        );
      }

      const payload = decodeTokenPayload(result.IdToken);
      const user = await this.upsertUser(payload);

      return {
        tokens: {
          accessToken: result.AccessToken,
          idToken: result.IdToken,
          refreshToken: result.RefreshToken,
          expiresIn: result.ExpiresIn,
        },
        user,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw this.toAuthException(error, 'Login failed.');
    }
  }

  async refresh(
    refreshToken: string,
    idToken?: string,
  ): Promise<AuthTokens> {
    this.assertConfigured();

    if (!refreshToken) {
      throw new UnauthorizedException('Authentication is required.');
    }

    const payload = idToken ? decodeTokenPayload(idToken) : undefined;
    const username = payload?.['cognito:username'] ?? payload?.email;

    if (this.clientSecret && !username) {
      throw new UnauthorizedException('Authentication is invalid.');
    }

    try {
      const response = await this.client.send(
        new InitiateAuthCommand({
          ClientId: this.clientId,
          AuthFlow: 'REFRESH_TOKEN_AUTH',
          AuthParameters: {
            REFRESH_TOKEN: refreshToken,
            ...(this.clientSecret && username
              ? { SECRET_HASH: this.getSecretHash(username) }
              : {}),
          },
        }),
      );

      const result = response.AuthenticationResult;

      if (!result?.AccessToken || !result.IdToken || !result.ExpiresIn) {
        throw new UnauthorizedException('Authentication is invalid.');
      }

      return {
        accessToken: result.AccessToken,
        idToken: result.IdToken,
        refreshToken: result.RefreshToken,
        expiresIn: result.ExpiresIn,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw this.toAuthException(error, 'Authentication refresh failed.');
    }
  }

  async getCurrentUser(accessToken: string): Promise<AuthSessionUser> {
    this.assertConfigured();

    if (!accessToken) {
      throw new UnauthorizedException('Authentication is required.');
    }

    try {
      const response = await this.client.send(
        new GetUserCommand({
          AccessToken: accessToken,
        }),
      );
      const authSubject = response.UserAttributes?.find(
        (attribute) => attribute.Name === 'sub',
      )?.Value;
      const email = response.UserAttributes?.find(
        (attribute) => attribute.Name === 'email',
      )?.Value;
      const emailVerified =
        response.UserAttributes?.find(
          (attribute) => attribute.Name === 'email_verified',
        )?.Value === 'true';

      if (!authSubject || !email) {
        throw new UnauthorizedException('Authentication is invalid.');
      }

      return this.upsertUser({
        sub: authSubject,
        email,
        email_verified: emailVerified,
      });
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw this.toAuthException(error, 'Authentication is invalid.');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    this.assertConfigured();

    try {
      await this.client.send(
        new ForgotPasswordCommand({
          ClientId: this.clientId,
          Username: email,
          SecretHash: this.getSecretHash(email),
        }),
      );
    } catch (error) {
      if (isAccountDiscoveryError(error)) {
        return;
      }

      throw this.toAuthException(error, 'Password reset failed.');
    }
  }

  async resetPassword(
    email: string,
    code: string,
    password: string,
  ): Promise<void> {
    this.assertConfigured();

    try {
      await this.client.send(
        new ConfirmForgotPasswordCommand({
          ClientId: this.clientId,
          Username: email,
          ConfirmationCode: code,
          Password: password,
          SecretHash: this.getSecretHash(email),
        }),
      );
    } catch (error) {
      throw this.toAuthException(error, 'Password reset failed.');
    }
  }

  private async upsertUser(
    payload: CognitoTokenPayload,
  ): Promise<AuthSessionUser> {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Authentication is invalid.');
    }

    const emailVerified =
      payload.email_verified === true || payload.email_verified === 'true';
    const user = await this.prisma.user.upsert({
      where: {
        authProvider_authSubject: {
          authProvider: 'cognito',
          authSubject: payload.sub,
        },
      },
      update: {
        email: payload.email,
        emailVerifiedAt: emailVerified ? new Date() : null,
        lastSeenAt: new Date(),
      },
      create: {
        id: cryptoRandomId(),
        authProvider: 'cognito',
        authSubject: payload.sub,
        email: payload.email,
        emailVerifiedAt: emailVerified ? new Date() : null,
        lastSeenAt: new Date(),
      },
    });

    return {
      id: user.id,
      email: user.email,
      emailVerified: Boolean(user.emailVerifiedAt),
    };
  }

  private assertConfigured(): void {
    if (!this.userPoolId || !this.clientId) {
      throw new InternalServerErrorException('Cognito is not configured.');
    }
  }

  private getSecretHash(username: string): string | undefined {
    if (!this.clientSecret) return undefined;

    return createHmac('sha256', this.clientSecret)
      .update(username + this.clientId)
      .digest('base64');
  }

  private toAuthException(error: unknown, fallback: string): Error {
    const name =
      typeof error === 'object' && error && 'name' in error
        ? String(error.name)
        : '';

    if (
      [
        'CodeMismatchException',
        'ExpiredCodeException',
        'InvalidPasswordException',
        'LimitExceededException',
        'NotAuthorizedException',
        'TooManyRequestsException',
        'UserNotConfirmedException',
        'UserNotFoundException',
        'UsernameExistsException',
      ].includes(name)
    ) {
      return new BadRequestException(fallback);
    }

    return error instanceof Error ? error : new BadRequestException(fallback);
  }
}

function decodeTokenPayload(token: string): CognitoTokenPayload {
  const [, payload] = token.split('.');

  if (!payload) {
    throw new UnauthorizedException('Authentication is invalid.');
  }

  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
}

function isAccountDiscoveryError(error: unknown): boolean {
  const name =
    typeof error === 'object' && error && 'name' in error
      ? String(error.name)
      : '';

  return ['UserNotFoundException', 'InvalidParameterException'].includes(name);
}

function cryptoRandomId(): string {
  return randomUUID();
}
