"use client";

import { useState } from "react";
import { PedalBoard } from "@/components/pedalboard/pedal-board";
import {
  createDefaultPresetSettings,
  type PedalModel,
  type PresetSettings,
} from "@/types/pedal";

/** Pedaleira jogável na home — o produto se explica sozinho ao ser mexido. */
export function HeroPedal({ model }: { model: PedalModel }) {
  const [settings, setSettings] = useState<PresetSettings>(() =>
    createDefaultPresetSettings(model.config),
  );

  return (
    <PedalBoard
      modelName={model.name}
      config={model.config}
      presetName="Solo do refrão"
      value={settings}
      onChange={setSettings}
    />
  );
}
