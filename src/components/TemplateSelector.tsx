import { useEffect, useMemo, useState } from "react";
import { Card } from "./ui/card";
import { TEMPLATES, type Template } from "@/lib/templates";
import { loadCustomTemplates, saveCustomTemplates } from "@/lib/customTemplates";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Check, Trash2 } from "lucide-react";

interface TemplateSelectorProps {
  selectedTemplate: Template | null;
  onSelect: (template: Template | null) => void;
}

export function TemplateSelector({ selectedTemplate, onSelect }: TemplateSelectorProps) {
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftPrompt, setDraftPrompt] = useState("");

  useEffect(() => {
    setCustomTemplates(loadCustomTemplates());
  }, []);

  useEffect(() => {
    saveCustomTemplates(customTemplates);
  }, [customTemplates]);

  const allTemplates = useMemo(
    () => [...customTemplates, ...TEMPLATES],
    [customTemplates]
  );

  const categories = useMemo(() => {
    const unique = Array.from(new Set(allTemplates.map((t) => t.category)));
    if (unique.includes("custom")) {
      return ["custom", ...unique.filter((c) => c !== "custom")];
    }
    return unique;
  }, [allTemplates]);

  const handleCreateTemplate = () => {
    const name = draftName.trim();
    const description = draftDescription.trim();
    const prompt = draftPrompt.trim();
    if (!name || !prompt) return;

    const newTemplate: Template = {
      id: `custom-${Date.now()}`,
      name,
      emoji: "★",
      description: description || "Custom template",
      prompt,
      category: "custom",
    };

    setCustomTemplates((prev) => [newTemplate, ...prev]);
    setDraftName("");
    setDraftDescription("");
    setDraftPrompt("");
    setShowCreate(false);
  };

  const handleDeleteTemplate = (id: string) => {
    setCustomTemplates((prev) => prev.filter((t) => t.id !== id));
    if (selectedTemplate?.id === id) {
      onSelect(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Templates (Optional)</h3>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreate(!showCreate)}
          >
            {showCreate ? "Cancel" : "Create"}
          </Button>
          {selectedTemplate && (
            <button
              onClick={() => onSelect(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {showCreate && (
        <Card className="p-4 space-y-3 border-dashed">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Template name</label>
            <Input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="e.g., Product Teaser"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Short description</label>
            <Input
              value={draftDescription}
              onChange={(event) => setDraftDescription(event.target.value)}
              placeholder="Optional but helpful"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Template prompt</label>
            <Textarea
              value={draftPrompt}
              onChange={(event) => setDraftPrompt(event.target.value)}
              placeholder="Describe how the tweet should be structured or framed."
              className="min-h-[100px] resize-none"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Saved locally in your browser</span>
            <Button
              size="sm"
              onClick={handleCreateTemplate}
              disabled={!draftName.trim() || !draftPrompt.trim()}
            >
              Save Template
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {categories.map((category) => (
          <div key={category}>
            <h4 className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              {category}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allTemplates.filter((t) => t.category === category).map((template) => {
                const isSelected = selectedTemplate?.id === template.id;
                const isCustom = template.category === "custom";
                return (
                  <Card
                    key={template.id}
                    className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                      isSelected
                        ? "ring-2 ring-primary bg-primary/5"
                        : "hover:bg-accent/50"
                    }`}
                    onClick={() => onSelect(isSelected ? null : template)}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{template.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium truncate">
                            {template.name}
                          </span>
                          {isSelected && (
                            <Check className="w-3 h-3 text-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                      {isCustom && (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteTemplate(template.id);
                          }}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label={`Delete ${template.name}`}
                          title="Delete template"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedTemplate && (
        <div className="p-3 bg-muted/50 rounded-lg border">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Selected:</strong> {selectedTemplate.emoji}{" "}
            {selectedTemplate.name}
            <br />
            <span className="italic">{selectedTemplate.description}</span>
          </p>
        </div>
      )}
    </div>
  );
}
