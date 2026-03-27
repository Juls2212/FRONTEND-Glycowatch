export type LoginFormValues = {
  email: string;
  password: string;
};

export type RegisterFormValues = {
  fullName: string;
  email: string;
  password: string;
};

export type AuthUser = {
  id: number;
  email: string;
  role: "USER" | "ADMIN";
};

export type LoginResponseData = {
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  user: AuthUser;
};

export type RegisterResponseData = {
  userId: number;
  email: string;
};
