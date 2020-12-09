export interface HeadsetDeviceInfo {
  readonly vendorId: number;
  readonly productId: number;
  readonly productName: string;
}

export interface HeadsetDriver {}

export interface Headset {
  init(): void;

  acceptCall(): void;

  declineCall(): void;

  hangup(): void;

  muted(muted: boolean): void;

  ring(ring: boolean): void;

  close(): void;
}
