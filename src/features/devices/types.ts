export type DeviceStatus = "REGISTERED" | "ACTIVE" | "DISABLED";

export type DeviceItem = {
  id: number;
  name: string;
  identifier: string;
  status: DeviceStatus;
  active: boolean;
};

export type RegisterDevicePayload = {
  name: string;
  identifier: string;
};

export type RegisterDeviceResult = {
  deviceId: number;
  apiKey: string;
};

