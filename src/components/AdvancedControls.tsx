import { Label } from "./ui/label";
import { Select } from "./ui/select";
import { Slider } from "./ui/slider";
import { Card } from "./ui/card";
import { TEMPERATURE_OPTIONS, TONE_OPTIONS, LENGTH_OPTIONS } from "@/lib/settings";
import type { AdvancedSettings } from "@/lib/settings";
import { Sliders, Lightbulb, Ruler } from "lucide-react";
import { useState } from "react";

interface AdvancedControlsProps {
  settings: AdvancedSettings;
  onChange: (settings: AdvancedSettings) => void;
}

export function AdvancedControls({ settings, onChange }: AdvancedControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border-primary/20">
      <div
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Advanced Controls</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {isExpanded ? "Hide" : "Show"}
        </span>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t">
          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm">Creativity Level</Label>
            </div>
            <div className="px-2">
              <Slider
                value={settings.temperature.toString()}
                onChange={(e) =>
                  onChange({ ...settings, temperature: parseFloat(e.target.value) })
                }
                min={0.3}
                max={1.2}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Precise</span>
                <span className="font-medium text-primary">
                  {settings.temperature.toFixed(1)}
                </span>
                <span>Creative</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {TEMPERATURE_OPTIONS.find((o) => o.value === settings.temperature)
                ?.description || "Control response variety"}
            </p>
          </div>

          {/* Tone */}
          <div className="space-y-2">
            <Label className="text-sm">Tone</Label>
            <Select
              value={settings.tone}
              onChange={(e) =>
                onChange({ ...settings, tone: e.target.value as AdvancedSettings["tone"] })
              }
            >
              {TONE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              {TONE_OPTIONS.find((o) => o.value === settings.tone)?.description}
            </p>
          </div>

          {/* Length */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm">Target Length</Label>
            </div>
            <Select
              value={settings.length}
              onChange={(e) =>
                onChange({ ...settings, length: e.target.value as AdvancedSettings["length"] })
              }
            >
              {LENGTH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.description})
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}
    </Card>
  );
}
