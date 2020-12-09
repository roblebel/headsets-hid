import { HeadsetHIDUsages, HIDUsage } from "./hid.models";

export class HIDHeadset {
  private states = new Map<HIDUsage, boolean>();

  // From host to device
  private outputReportByUsage = new Map<HIDUsage, number>();
  // From device to host
  private inputReportByUsage = new Map<HIDUsage, number>();

  acceptCall(): void {}

  declineCall(): void {}

  hangup(): void {}

  muted(muted: boolean): void {
    const reportId = this.outputReportByUsage.get(
      HeadsetHIDUsages.OUT_LED_MUTE
    );
    if (!reportId) {
      return;
    }

    this.states.set(HeadsetHIDUsages.OUT_LED_MUTE, muted);
    this.sendOutputReport(reportId);
  }

  ring(ring: boolean): void {}

  private sendOutputReport(reportId: number) {
    // Get report descriptor
    // Set each bits included in this reports from the current states
    // write the report
  }
}
