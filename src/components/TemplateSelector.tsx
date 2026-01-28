import { Card } from "./ui/card";
import { TEMPLATES, type Template } from "@/lib/templates";
import { Check } from "lucide-react";

interface TemplateSelectorProps {
  selectedTemplate: Template | null;
  onSelect: (template: Template | null) => void;
}

export function TemplateSelector({ selectedTemplate, onSelect }: TemplateSelectorProps) {
  const categories = Array.from(new Set(TEMPLATES.map((t) => t.category)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Templates (Optional)</h3>
        {selectedTemplate && (
          <button
            onClick={() => onSelect(null)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-3">
        {categories.map((category) => (
          <div key={category}>
            <h4 className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              {category}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TEMPLATES.filter((t) => t.category === category).map((template) => {
                const isSelected = selectedTemplate?.id === template.id;
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
