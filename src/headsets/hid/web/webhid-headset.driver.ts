import { Headset } from "../../headset.models";
import {
  HeadsetHIDUsages,
  HIDUsage,
  ReportDescriptor,
  ReportId,
  UsagePages,
} from "../hid.models";
import {
  HIDCollectionInfo,
  HIDDevice,
  HIDInputReportEvent,
  HIDReportInfo,
  HIDReportItem,
} from "./webhid.apis";

export class WebHIDHeadsetDriver implements Headset {
  private states = new Map<HIDUsage, boolean>();

  // Reports descriptors from host to headset
  private outputReportDescriptors: Array<ReportDescriptor> = [];

  // Report descriptors from headset to host
  private inputReportDescriptors: Array<ReportDescriptor> = [];

  constructor(private readonly device: HIDDevice) {}

  async init() {
    await this.loadReportDescriptors(this.device);
    console.log("outputReportDescriptors", this.outputReportDescriptors);
    console.log("inputReportDescriptors", this.inputReportDescriptors);

    await this.device.open();
    if (!this.device.opened) {
      console.log("open failed");
      return;
    }

    this.device.oninputreport = (event: HIDInputReportEvent) =>
      this.rawInputReportHandler(event);
  }

  async acceptCall() {}

  declineCall(): void {
    throw new Error("Method not implemented.");
  }
  hangup(): void {
    throw new Error("Method not implemented.");
  }

  muted(muted: boolean): void {}

  async ring(ring: boolean) {
    const reportIds = new Set<ReportId>();

    const ledRingReport = this.getOutputReportForUsage(
      HeadsetHIDUsages.OUT_LED_RING
    );
    const telRingerReport = this.getOutputReportForUsage(
      HeadsetHIDUsages.OUT_TELEPHONY_RINGER
    );

    if (ledRingReport) {
      this.states.set(HeadsetHIDUsages.OUT_LED_RING, true);
      reportIds.add(ledRingReport.reportId);
    }

    if (telRingerReport) {
      this.states.set(HeadsetHIDUsages.OUT_TELEPHONY_RINGER, true);
      reportIds.add(telRingerReport.reportId);
    }

    reportIds.forEach((reportId) => {
      this.sendOutputReport(reportId);
    });
  }

  async open() {
    if (!this.device.opened) {
      await this.device.open();
    }
  }

  async close() {
    if (this.device.opened) {
      await this.device.close();
    }
  }

  async sendOutputReport(reportId: ReportId) {
    const reportDescriptor = this.getOutputReportById(reportId);
    if (!reportDescriptor) {
      return;
    }

    const payload = new Uint8Array(reportDescriptor.bitsUsage.length / 8);
    reportDescriptor.bitsUsage.forEach((usage, usageBitPos) => {
      if (!usage) {
        return;
      }

      // Get the usage bit position relatively to the byte index holding this bit in the payload.
      // (bit at ndx 8 would be bit 0 of the second byte in the payload)
      const byteNdx = Math.floor(usageBitPos / 8);
      const relativeBitPos = usageBitPos - 8 * byteNdx;

      const isUsageON = this.states.get(usage) === true;
      if (isUsageON) {
        // set this bit
        payload[byteNdx] |= 1 << relativeBitPos;
      }
    });

    console.log("sending report", reportId);
    await this.device.sendReport(reportId, payload);
  }

  private rawInputReportHandler(event: HIDInputReportEvent) {
    const reportDescriptor = this.getInputReportById(event.reportId);
    if (!reportDescriptor) {
      // Unsupported event, ignore
      return;
    }

    const expectedByteLength = reportDescriptor.bitsUsage.length / 8;
    if (event.data.byteLength !== expectedByteLength) {
      console.log("Unexpected payload size, ignoring input event");
      return;
    }

    for (let bitPos = 0; bitPos < reportDescriptor.bitsUsage.length; bitPos++) {
      const usage = reportDescriptor.bitsUsage[bitPos];
      if (usage === undefined) {
        continue;
      }

      // get the byte of data from the payload containing the usage bit
      const byteNdx = Math.floor(bitPos / 8);
      const byte = event.data.getUint8(byteNdx);
      // calculate the usage bit position relatively to this extracted single byte
      const relativeBitPos = bitPos - 8 * byteNdx;
      // check if the usage bit is 1 or 0 (on or off)
      const value = (byte & (1 << relativeBitPos)) != 0;
      console.log("usage " + usage + " value is " + value);
      this.states.set(usage, value);
    }
  }

  private async loadReportDescriptors(headset: HIDDevice) {
    for (const collectionInfo of headset.collections) {
      this.readHIDCollectionInfo(collectionInfo);
    }
  }

  private readHIDCollectionInfo(collectionInfo: HIDCollectionInfo) {
    // We only read reports for the usages we support
    if (collectionInfo.usagePage in UsagePages) {
      const { outputReports, inputReports } = collectionInfo;
      this.outputReportDescriptors.push(...readReportsInfo(outputReports));
      this.inputReportDescriptors.push(...readReportsInfo(inputReports));
    }
  }

  private getInputReportById(reportId: ReportId) {
    return this.inputReportDescriptors.find(
      (descriptor) => descriptor.reportId === reportId
    );
  }

  private getOutputReportById(reportId: ReportId) {
    return this.outputReportDescriptors.find(
      (descriptor) => descriptor.reportId === reportId
    );
  }

  private getOutputReportForUsage(usage: HIDUsage) {
    return this.outputReportDescriptors.find((report) =>
      report.bitsUsage.some((u) => u === usage)
    );
  }
}

function readReportsInfo(reports: ReadonlyArray<HIDReportInfo>) {
  const reportDescriptors = new Array<ReportDescriptor>();
  for (const reportInfo of reports) {
    // A HIDReportInfo has a reportId and is composed of multiple report items.
    // Together, they describe the content of the data payload when a report of this type is sent from the host
    // to the device (outputReports) or received by the host from the device (inputReports).
    // For headset support, we take a big shortcut and assume that all HID usages of interests are encoded by the headset
    // vendor as boolean values on individual bits of a payload. This has proven true for all headsets tested so far.

    // In reality, the report descriptor can define any kind of data and encoding scheme.
    // If we expand to more advanced usages like supporting line selections from the headset, we will need to make
    // the driver more complicated to support this.

    const totalBitsCount = reportInfo.items
      .map((item) => item.reportSize * item.reportCount)
      .reduce((sum, itemBitsCount) => sum + itemBitsCount);

    const reportDescriptor: ReportDescriptor = {
      reportId: reportInfo.reportId,
      bitsUsage: new Array(totalBitsCount),
    };

    let reportBitPosition = 0;
    for (const reportItem of reportInfo.items) {
      // For now, we don't support anything but usage with boolean values encoded on single bits
      if (isReportItemDefiningBooleanUsages(reportItem)) {
        // Each usages enumerated by the report item therefore correspond to a specific bit of a payload.
        // For example, if the usage at position 3 is the mute usage, the 3rd bit of a payload for this
        // report type would indicate if the mute button is ON or OFF.
        reportItem.usages.forEach((usage, usagePosition) => {
          if (usage in HeadsetHIDUsages) {
            reportDescriptor.bitsUsage[
              reportBitPosition + usagePosition
            ] = usage;
          }
        });
      }

      // The next report item will describe bits starting at this bitPosition
      reportBitPosition += reportItem.reportSize * reportItem.reportCount;
    }

    // Only keep the report descriptor if we found usage we care about
    const containUsages = reportDescriptor.bitsUsage.some((usage) => !!usage);
    if (containUsages) {
      reportDescriptors.push(reportDescriptor);
    }
  }
  return reportDescriptors;
}

function isReportItemDefiningBooleanUsages(reportItem: HIDReportItem) {
  return reportItem.reportSize === 1 && reportItem.logicalMaximum === 1;
}
