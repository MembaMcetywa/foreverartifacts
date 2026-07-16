import { CookieOptions, Request, Response } from 'express';

export const ACCESS_TOKEN_COOKIE = 'fa_access_token';
export const ID_TOKEN_COOKIE = 'fa_id_token';
export const REFRESH_TOKEN_COOKIE = 'fa_refresh_token';
export const AUTH_USERNAME_COOKIE = 'fa_auth_username';

export function getAuthCookieOptions(isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
  };
}

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.cookie;

  if (!header) return null;

  const cookies = header.split(';').map((cookie) => cookie.trim());
  const cookie = cookies.find((item) => item.startsWith(`${name}=`));

  if (!cookie) return null;

  return decodeURIComponent(cookie.slice(name.length + 1));
}

export function clearAuthCookies(
  response: Response,
  options: CookieOptions,
): void {
  response.clearCookie(ACCESS_TOKEN_COOKIE, options);
  response.clearCookie(ID_TOKEN_COOKIE, options);
  response.clearCookie(REFRESH_TOKEN_COOKIE, options);
  response.clearCookie(AUTH_USERNAME_COOKIE, options);
}
