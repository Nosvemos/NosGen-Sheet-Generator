import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { PlaybackPanelProps } from "./playback-panel-types";

type PlaybackSettingsControlsProps = Pick<
  PlaybackPanelProps,
  | "t"
  | "reverse"
  | "setReverse"
  | "loop"
  | "setLoop"
  | "fps"
  | "setFps"
  | "speed"
  | "setSpeed"
  | "speedOptions"
  | "toNumber"
>;

export function PlaybackSettingsControls({
  t,
  reverse,
  setReverse,
  loop,
  setLoop,
  fps,
  setFps,
  speed,
  setSpeed,
  speedOptions,
  toNumber,
}: PlaybackSettingsControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Switch
          id="reverse-toggle"
          checked={reverse}
          onCheckedChange={setReverse}
        />
        <Label htmlFor="reverse-toggle">{t("label.reverse")}</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="loop-toggle" checked={loop} onCheckedChange={setLoop} />
        <Label htmlFor="loop-toggle">{t("label.loop")}</Label>
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor="fps-input">{t("label.fps")}</Label>
        <Input
          id="fps-input"
          type="number"
          className="w-20"
          value={String(fps)}
          onChange={(event) =>
            setFps(Math.max(1, toNumber(event.target.value, fps)))
          }
          min={1}
        />
      </div>
      <Select value={String(speed)} onValueChange={(value) => setSpeed(Number(value))}>
        <SelectTrigger className="w-24">
          <SelectValue placeholder={t("label.speed")} />
        </SelectTrigger>
        <SelectContent>
          {speedOptions.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option}x
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
