import React, { useEffect, useState } from "react";
import "./App.css";
import { getHeadsetFactory } from "./headsets/headset.factory";
import { Headset, HeadsetDeviceInfo } from "./headsets/headset.models";
import { requestHeadsetAccess } from "./headsets/hid/web/webhid.utils";

const headsetFactory = getHeadsetFactory();

const decodedUsagePage = (721047 & 0xffff0000) >> 16;
const decodedUsage = 721047 & 0x0000ffff;

console.log(
  "decoded usage ",
  721047,
  decodedUsagePage.toString(16),
  decodedUsage.toString(16)
);

function App() {
  const [headsets, setHeadsets] = useState<Array<HeadsetDeviceInfo>>([]);
  const [selectedHeadsetInfo, setSelectedHeadsetInfo] = useState<
    HeadsetDeviceInfo
  >();
  const [activeHeadset, setActiveHeadset] = useState<Headset>();

  useEffect(() => {
    headsetFactory
      ?.listAvailableHeadsets()
      .then((headsets) => setHeadsets(headsets));
  }, []);

  useEffect(() => {
    if (selectedHeadsetInfo) {
      console.log("load headset");
      headsetFactory?.createHeadset(selectedHeadsetInfo).then((h) => {
        h?.init();
        setActiveHeadset(h);
      });
    }
  }, [selectedHeadsetInfo]);

  const onSelectedHeadsetChange = (event: any) => {
    const newSelection = headsets.find(
      (headset: any) => headset.productId == event.target.value
    );

    if (newSelection && newSelection !== selectedHeadsetInfo) {
      activeHeadset?.close();

      setSelectedHeadsetInfo(newSelection);
      console.log("set selected", newSelection);
    }
  };

  const handleSelectDevice = async () => {
    const headset = await requestHeadsetAccess();
    if (headset && headsetFactory) {
      setHeadsets(await headsetFactory.listAvailableHeadsets());
    }
  };

  const ring = () => {
    activeHeadset?.ring(true);
  };

  return (
    <div className="App">
      <button onClick={handleSelectDevice}>Connect</button>
      <div className="headsetList">
        <label>Connected headsets</label>
        <select onChange={onSelectedHeadsetChange}>
          <option>Select a headset</option>
          {headsets.map((headset: any) => (
            <option value={headset.productId}>{headset.productName}</option>
          ))}
        </select>
        <button onClick={ring}>Ring</button>
      </div>
    </div>
  );
}

export default App;
