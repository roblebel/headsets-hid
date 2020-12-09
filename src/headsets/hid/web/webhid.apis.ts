/**
 * Types for the WebHID API interfaces https://wicg.github.io/webhid/
 */

export interface HIDDeviceFilter {
  vendorId?: number;
  productId?: number;
  usagePage?: number;
  usage?: number;
}

export interface HIDDeviceRequestOptions {
  filters: Array<HIDDeviceFilter>;
}

export interface HID extends EventTarget {
  onconnect(): EventHandlerNonNull;
  ondisconnect(): EventHandlerNonNull;
  getDevices(): Promise<Array<HIDDevice>>;
  requestDevice(options: HIDDeviceRequestOptions): Promise<Array<HIDDevice>>;
}

export interface HIDDevice {
  readonly opened: boolean;
  readonly vendorId: number;
  readonly productId: number;
  readonly productName: string;
  readonly collections: ReadonlyArray<HIDCollectionInfo>;
  oninputreport: (event: HIDInputReportEvent) => void;
  open(): Promise<void>;
  close(): Promise<void>;
  sendReport(reportId: number, data: BufferSource): Promise<void>;
  sendFeatureReport(reportId: number, data: BufferSource): Promise<void>;
  receiveFeatureReport(reportId: number): Promise<DataView>;
}

export interface HIDCollectionInfo {
  readonly usagePage: number;
  readonly usage: number;
  readonly children: ReadonlyArray<HIDCollectionInfo>;
  readonly inputReports: ReadonlyArray<HIDReportInfo>;
  readonly outputReports: ReadonlyArray<HIDReportInfo>;
  readonly featureReports: ReadonlyArray<HIDReportInfo>;
}

export interface HIDReportInfo {
  readonly reportId: number;
  readonly items: ReadonlyArray<HIDReportItem>;
}

export interface HIDReportItem {
  readonly isAbsolute: boolean;
  readonly isArray: boolean;
  readonly isRange: boolean;
  readonly hasNull: boolean;
  readonly usages: ReadonlyArray<number>;
  readonly usageMinimum: number;
  readonly usageMaximum: number;
  readonly reportSize: number;
  readonly reportCount: number;
  readonly unitExponent: number;
  readonly unitSystem: HIDUnitSystem;
  readonly unitFactorLengthExponent: number;
  readonly unitFactorMassExponent: number;
  readonly unitFactorTimeExponent: number;
  readonly unitFactorTemperatureExponent: number;
  readonly unitFactorCurrentExponent: number;
  readonly unitFactorLuminousIntensityExponent: number;
  readonly logicalMinimum: number;
  readonly logicalMaximum: number;
  readonly physicalMinimum: number;
  readonly physicalMaximum: number;
  readonly strings: ReadonlyArray<string>;
}

export enum HIDUnitSystem {
  "none",
  "si-linear",
  "si-rotation",
  "english-linear",
  "english-rotation",
  "vendor-defined",
  "reserved",
}

export interface HIDInputReportEvent extends Event {
  readonly device: HIDDevice;
  readonly reportId: number;
  readonly data: DataView;
}
