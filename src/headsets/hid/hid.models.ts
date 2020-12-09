export enum UsagePages {
  LED = 0x08,
  TELEPHONY = 0x0b,
  CONSUMER = 0x0c,
}
export type ReportId = number;
export type UInt32 = number;
export type HIDUsage = UInt32;

/**
 * HIDUsage are a pair of two 16 bits value paired together in a 32 bits payload.
 * The first pair of bytes is the usagePage value (TELEPHONY, LED etc), the second pair is the usage
 * within this usage page (Mute, Hook switch etc)
 * For example, the OFF_HOOK(0x17) usage of the LED_USAGE page(0x08) = 524311.
 * When reading the report descriptor of a HID device, the usages values are encoded this way.
 */
function createHIDUsage(usagePage: UsagePages, usage: number): HIDUsage {
  return (usagePage << 16) | usage;
}

/**
 * An enumeration of the headsets functionalities (usage) we support.
 * Values are from https://www.usb.org/document-library/hid-usage-tables-112
 */
export enum HeadsetHIDUsages {
  // Sent from host to device to set microphone mute state.
  OUT_LED_MUTE = createHIDUsage(UsagePages.LED, 0x09),
  // Sent from host to device to set hook state.
  OUT_LED_OFF_HOOK = createHIDUsage(UsagePages.LED, 0x17),
  // Sent from host to device to set ringer state.
  OUT_LED_RING = createHIDUsage(UsagePages.LED, 0x18),
  // Sent from host to device to set call held state.
  OUT_LED_HOLD = createHIDUsage(UsagePages.LED, 0x20),
  // Sent from host to device to set microphone mute state.
  OUT_LED_MICROPHONE = createHIDUsage(UsagePages.LED, 0x21),
  OUT_LED_ONLINE = createHIDUsage(UsagePages.LED, 0x2a),
  OUT_TELEPHONY_RINGER = createHIDUsage(UsagePages.TELEPHONY, 0x9e),

  // Sent from device to host when the answer/end button is pressed.
  IN_TELEPHONY_HOOK_SWITCH = createHIDUsage(UsagePages.TELEPHONY, 0x20),
  // Sent from device to host to signal a flash (call swap between an active call and a call on hold).
  IN_TELEPHONY_FLASH = createHIDUsage(UsagePages.TELEPHONY, 0x21),
  // Sent from device to host to signal a last number redial.
  IN_TELEPHONY_REDIAL = createHIDUsage(UsagePages.TELEPHONY, 0x24),
  // Sent from device to host when the mute button is pressed.
  IN_TELEPHONY_MUTE = createHIDUsage(UsagePages.TELEPHONY, 0x2f),
  // Sent from device to host to indicate whether the user has a call on one of the telephony interfaces.
  IN_TELEPHONY_LINE_BUSY = createHIDUsage(UsagePages.TELEPHONY, 0x97),

  // IN_TELEPHONY_LINE: new HIDUsage(UsagePages.TELEPHONY, 0x2a),
  // IN_TELEPHONY_SPEED_DIAL: new HIDUsage(UsagePages.TELEPHONY, 0x50),
}

/**
 * Describe the meaning (HID usage) of each bit value of a report payload.
 * The bitsUsage array length is the size in bits of the report payload.
 * Typically, not all the bits of a report payload are used. For example,
 * a 2 byte payload might include 10 boolean values, so the last 6 bits
 * would not be associated to a usage.
 */
export interface ReportDescriptor {
  reportId: ReportId;
  bitsUsage: Array<HIDUsage | undefined>;
}
