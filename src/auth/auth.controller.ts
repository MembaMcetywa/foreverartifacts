import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

import {
  ACCESS_TOKEN_COOKIE,
  AUTH_USERNAME_COOKIE,
  clearAuthCookies,
  getAuthCookieOptions,
  ID_TOKEN_COOKIE,
  readCookie,
  REFRESH_TOKEN_COOKIE,
} from './auth.cookies';
import {
  AuthUserDto,
  ConfirmSignUpDto,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
  SignUpDto,
} from './auth.dto';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('signup')
  @Public()
  @HttpCode(204)
  async signUp(@Body() dto: SignUpDto): Promise<void> {
    await this.authService.signUp(dto.email, dto.password);
  }

  @Post('confirm')
  @Public()
  @HttpCode(204)
  async confirmSignUp(@Body() dto: ConfirmSignUpDto): Promise<void> {
    await this.authService.confirmSignUp(dto.email, dto.code);
  }

  @Post('login')
  @Public()
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: AuthUserDto }> {
    const { tokens, user, authUsername } = await this.authService.login(
      dto.email,
      dto.password,
    );

    this.setAuthCookies(response, tokens, authUsername);

    return { user };
  }

  @Post('logout')
  @Public()
  @HttpCode(204)
  logout(@Res({ passthrough: true }) response: Response): void {
    clearAuthCookies(response, this.getCookieOptions());
  }

  @Post('refresh')
  @Public()
  @HttpCode(204)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const refreshToken = readCookie(request, REFRESH_TOKEN_COOKIE);

    if (!refreshToken) {
      throw new UnauthorizedException('Authentication is required.');
    }

    const authUsername = readCookie(request, AUTH_USERNAME_COOKIE) ?? undefined;
    const tokens = await this.authService.refresh(refreshToken, authUsername);

    this.setAuthCookies(response, tokens, authUsername);
  }

  @Get('me')
  async me(@Req() request: Request): Promise<{ user: AuthUserDto }> {
    const accessToken = readCookie(request, ACCESS_TOKEN_COOKIE);

    if (!accessToken) {
      throw new UnauthorizedException('Authentication is required.');
    }

    const user = await this.authService.getCurrentUser(accessToken);

    return { user };
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(204)
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(204)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(dto.email, dto.code, dto.password);
  }

  private setAuthCookies(
    response: Response,
    tokens: {
      accessToken: string;
      idToken: string;
      refreshToken?: string;
      expiresIn: number;
    },
    authUsername?: string,
  ): void {
    const baseOptions = this.getCookieOptions();
    const refreshMaxAge = this.getRefreshCookieMaxAge();

    response.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
      ...baseOptions,
      maxAge: tokens.expiresIn * 1000,
    });
    response.cookie(ID_TOKEN_COOKIE, tokens.idToken, {
      ...baseOptions,
      maxAge: tokens.expiresIn * 1000,
    });

    if (tokens.refreshToken) {
      response.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
        ...baseOptions,
        maxAge: refreshMaxAge,
      });
    }

    if (authUsername) {
      response.cookie(AUTH_USERNAME_COOKIE, authUsername, {
        ...baseOptions,
        maxAge: refreshMaxAge,
      });
    }
  }

  private getCookieOptions() {
    return getAuthCookieOptions(
      this.config.get<string>('NODE_ENV') === 'production',
    );
  }

  private getRefreshCookieMaxAge(): number {
    const configuredDays = Number(
      this.config.get<string>('COGNITO_REFRESH_TOKEN_DAYS') ?? 30,
    );
    const days = Number.isFinite(configuredDays) ? configuredDays : 30;

    return days * 24 * 60 * 60 * 1000;
  }
}
