import { Headset, HeadsetDeviceInfo } from "./headset.models";
import { WebHIDHeadsetFactory } from "./hid/web/webhid-headset.factory";
import { isWebHIDEnabled } from "./hid/web/webhid.utils";

/**
 * Return the headset factory appropriate to the current app context.
 *
 * If the app is running in a browser and the WebHID feature is available, the headset support will be based on WebHID.
 *
 * In the desktop app, the headset support will happen in the node process and will be based on either node-HID or
 * a specific vendor SDK. For example, a Logitech headset would use the node-hid headset support, and a Jabra headset
 * could use the official Jabra Node SDK instead of the standard HID Telephony protocol.
 */
export function getHeadsetFactory() {
  // tbd: check if web or electron and return the right factory
  if (isWebHIDEnabled()) {
    return WebHIDHeadsetFactory;
  }
}

export interface HeadsetFactory {
  listAvailableHeadsets(): Promise<Array<HeadsetDeviceInfo>>;

  createHeadset(
    headsetDeviceInfo: HeadsetDeviceInfo
  ): Promise<Headset | undefined>;
}
