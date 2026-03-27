export type ProfileData = {
  userId: number;
  email: string;
  fullName: string | null;
  birthDate: string | null;
  hypoglycemiaThreshold: number;
  hyperglycemiaThreshold: number;
  timezone: string | null;
  weightKg: number | null;
  heightCm: number | null;
};

export type UpdateProfilePayload = {
  fullName: string | null;
  birthDate: string | null;
  hypoglycemiaThreshold: number;
  hyperglycemiaThreshold: number;
  timezone: string | null;
  weightKg: number | null;
  heightCm: number | null;
};

