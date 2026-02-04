import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  getPresets,
  savePreset,
  deletePreset,
  loadPreset,
  type SettingsPreset,
} from "@/lib/presets";
import type { AdvancedSettings } from "@/lib/settings";
import { Bookmark, Trash2, Plus, X, Check } from "lucide-react";

interface PresetSelectorProps {
  style: "viral" | "professional" | "casual" | "thread";
  includeHashtags: boolean;
  includeEmojis: boolean;
  advancedSettings: AdvancedSettings;
  onLoadPreset: (preset: SettingsPreset["settings"]) => void;
}

export function PresetSelector({
  style,
  includeHashtags,
  includeEmojis,
  advancedSettings,
  onLoadPreset,
}: PresetSelectorProps) {
  const [presets, setPresets] = useState<SettingsPreset[]>([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetDescription, setNewPresetDescription] = useState("");
  const [savedNotification, setSavedNotification] = useState(false);

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = () => {
    setPresets(getPresets());
  };

  const handleLoadPreset = (id: string) => {
    const settings = loadPreset(id);
    if (settings) {
      onLoadPreset(settings);
    }
  };

  const handleDeletePreset = (id: string) => {
    if (confirm("Are you sure you want to delete this preset?")) {
      const updated = deletePreset(id);
      setPresets(updated);
    }
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      alert("Please enter a preset name");
      return;
    }

    const newPreset = savePreset(
      newPresetName,
      newPresetDescription || "Custom preset",
      {
        style,
        includeHashtags,
        includeEmojis,
        advancedSettings,
      }
    );

    setPresets([newPreset, ...presets]);
    setNewPresetName("");
    setNewPresetDescription("");
    setShowSaveForm(false);

    // Show saved notification
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2000);
  };

  const currentSettingsMatch = (preset: SettingsPreset) => {
    return (
      preset.settings.style === style &&
      preset.settings.includeHashtags === includeHashtags &&
      preset.settings.includeEmojis === includeEmojis &&
      preset.settings.advancedSettings.temperature === advancedSettings.temperature &&
      preset.settings.advancedSettings.tone === advancedSettings.tone &&
      preset.settings.advancedSettings.length === advancedSettings.length
    );
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-primary" />
          <Label className="text-sm font-medium">Quick Presets</Label>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSaveForm(!showSaveForm)}
        >
          {showSaveForm ? (
            <>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Save Current
            </>
          )}
        </Button>
      </div>

      {/* Save Form */}
      {showSaveForm && (
        <div className="mb-4 p-3 bg-muted rounded-lg space-y-3">
          <div>
            <Label htmlFor="preset-name" className="text-xs">Preset Name</Label>
            <Input
              id="preset-name"
              placeholder="e.g., My Viral Style"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="preset-desc" className="text-xs">Description (optional)</Label>
            <Textarea
              id="preset-desc"
              placeholder="Brief description..."
              value={newPresetDescription}
              onChange={(e) => setNewPresetDescription(e.target.value)}
              className="mt-1 min-h-[60px] resize-none"
            />
          </div>
          <Button
            onClick={handleSavePreset}
            size="sm"
            className="w-full"
          >
            Save Preset
          </Button>
        </div>
      )}

      {/* Preset List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {presets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No presets yet. Save your current settings!
          </p>
        ) : (
          presets.map((preset) => (
            <div
              key={preset.id}
              className={`p-3 rounded-lg border transition-colors group ${
                currentSettingsMatch(preset)
                  ? "bg-primary/10 border-primary"
                  : "bg-background hover:bg-accent"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {preset.name}
                    </span>
                    {currentSettingsMatch(preset) && (
                      <Check className="w-3 h-3 text-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {preset.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-xs px-2 py-0.5 bg-secondary rounded">
                      {preset.settings.style}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-secondary rounded">
                      {preset.settings.advancedSettings.tone}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-secondary rounded">
                      {preset.settings.advancedSettings.length}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLoadPreset(preset.id)}
                    disabled={currentSettingsMatch(preset)}
                  >
                    Load
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDeletePreset(preset.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Saved Notification */}
      {savedNotification && (
        <div className="mt-3 p-2 bg-green-500/10 text-green-600 text-sm rounded-lg text-center">
          Preset saved successfully!
        </div>
      )}
    </Card>
  );
}
