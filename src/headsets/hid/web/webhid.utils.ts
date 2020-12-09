import { HIDUsage, UsagePages } from "../hid.models";
import { HID } from "./webhid.apis";

export function isWebHIDEnabled() {
  return hid() !== undefined;
}

/**
 * Expose the HID interface (not standardized) if it is available.
 */
export function hid(): HID {
  return (navigator as any).hid;
}

/**
 * Devices are not accessible through hid.getDevices() and will not generate connection events until permission
 * has been granted to access the device.
 *
 * When calling this function, the browser will open a native window listing available devices with
 * telephony features and the user will be able to grant permission.
 *
 * Important: This function must be triggered by a user interaction like a button click.
 */
export async function requestHeadsetAccess() {
  if (isWebHIDEnabled()) {
    return await hid().requestDevice({
      filters: [{ usagePage: UsagePages.TELEPHONY }],
    });
  }
  return [];
}

export function logDecodedUsage(usage: HIDUsage, message: string) {
  const decodedUsagePage = (usage & 0xffff0000) >> 16;
  const decodedUsage = usage & 0x0000ffff;

  console.log(
    message,
    usage,
    decodedUsagePage.toString(16),
    decodedUsage.toString(16)
  );
}
