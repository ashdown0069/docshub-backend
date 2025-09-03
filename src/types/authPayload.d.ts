export type AccessTokenPayload = {
  email: string;
  nickname: string;
  plan: 'free' | 'team' | 'enterprise';
  sub: string;
  iat: number;
  exp: number;
};

export type JWT_User = Omit<AccessTokenPayload, 'sub'> & {
  id: string;
};

export type RefreshTokenPayload = {
  sub: string;
  iat: number;
  exp: number;
};
