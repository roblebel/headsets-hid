import { HeadsetFactory } from "../../headset.factory";
import { HeadsetDeviceInfo } from "../../headset.models";
import { WebHIDHeadsetDriver } from "./webhid-headset.driver";
import { hid } from "./webhid.utils";

/**
 * Headset factory used when GTC run in chrome and WebHID is available.
 */
export const WebHIDHeadsetFactory: HeadsetFactory = {
  /**
   * List connected headsets devices.
   *
   * Permission to access headsets must be granted by the user otherwise they won't be listed.
   * See requestHeadsetAccess().
   */
  async listAvailableHeadsets() {
    const devices = await hid().getDevices();
    return devices.map(({ vendorId, productId, productName }) => ({
      vendorId,
      productId,
      productName,
    }));
  },

  async createHeadset(headsetDeviceInfo: HeadsetDeviceInfo) {
    const devices = await hid().getDevices();
    const device = devices.find(
      (device) =>
        device.vendorId === headsetDeviceInfo.vendorId &&
        device.productId === headsetDeviceInfo.productId
    );

    console.log("selected device", device);

    if (device) {
      // const driver = new WebHIDHeadsetDriver(device);
      // return new HIDHeadset(driver);
      return new WebHIDHeadsetDriver(device);
    }

    return undefined;
  },
};
