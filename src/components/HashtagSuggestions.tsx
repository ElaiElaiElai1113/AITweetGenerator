import { useState, useMemo, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Hash, RefreshCw, X } from "lucide-react";
import { generateHashtags, getHashtagsByCategory, getHashtagCategories, HASHTAG_CATEGORIES } from "@/lib/hashtags";

interface HashtagSuggestionsProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
  onHashtagsSelect: (hashtags: string) => void;
  includeHashtags: boolean;
}

export function HashtagSuggestions({
  isOpen,
  onClose,
  topic,
  onHashtagsSelect,
  includeHashtags,
}: HashtagSuggestionsProps) {
  const [selectionState, setSelectionState] = useState<{ scope: string; tags: Set<string> }>({
    scope: "",
    tags: new Set(),
  });
  const scope = `${isOpen ? "1" : "0"}|${includeHashtags ? "1" : "0"}|${topic}`;

  const suggestions = useMemo(
    () => (isOpen && topic && includeHashtags ? generateHashtags(topic, 8) : []),
    [isOpen, topic, includeHashtags],
  );
  const selectedTags = useMemo(
    () => (selectionState.scope === scope ? selectionState.tags : new Set<string>()),
    [selectionState, scope],
  );

  useEffect(() => {
    const tags = Array.from(selectedTags);
    if (tags.length > 0 && includeHashtags) {
      onHashtagsSelect(tags.join(" "));
    }
  }, [selectedTags, includeHashtags, onHashtagsSelect]);

  const addTag = (tag: string) => {
    setSelectionState((prev) => {
      const currentTags = prev.scope === scope ? prev.tags : new Set<string>();
      if (currentTags.has(tag)) {
        return { scope, tags: currentTags };
      }
      const next = new Set(currentTags);
      next.add(tag);
      return { scope, tags: next };
    });
  };

  const removeTag = (tag: string) => {
    setSelectionState((prev) => {
      const currentTags = prev.scope === scope ? prev.tags : new Set<string>();
      if (!currentTags.has(tag)) {
        return { scope, tags: currentTags };
      }
      const next = new Set(currentTags);
      next.delete(tag);
      return { scope, tags: next };
    });
  };

  const addCategoryTags = (category: string) => {
    const validCategories = Object.keys(HASHTAG_CATEGORIES) as Array<keyof typeof HASHTAG_CATEGORIES>;
    if (!validCategories.includes(category as keyof typeof HASHTAG_CATEGORIES)) {
      return;
    }
    const tags = getHashtagsByCategory(category as keyof typeof HASHTAG_CATEGORIES);
    setSelectionState((prev) => {
      const currentTags = prev.scope === scope ? prev.tags : new Set<string>();
      const next = new Set(currentTags);
      tags.forEach((tag) => {
        if (!next.has(tag) && next.size < 10) {
          next.add(tag);
        }
      });
      return { scope, tags: next };
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Hashtag Suggestions</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Topic: <span className="font-medium">{topic || "General"}</span>
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectionState({ scope, tags: new Set() })}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">AI Suggestions</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => addTag(tag)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      selectedTags.has(tag)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category Browser */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              Browse by Category
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {getHashtagCategories().map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  size="sm"
                  onClick={() => addCategoryTags(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Selected Tags */}
          {selectedTags.size > 0 && (
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                Selected ({selectedTags.size}/10)
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedTags).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => removeTag(tag)}
                    className="text-xs px-3 py-1 rounded-full bg-primary text-primary-foreground flex items-center gap-1"
                  >
                    {tag}
                    <span className="hover:text-red-200">x</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose} disabled={selectedTags.size === 0}>
            Apply Hashtags
          </Button>
        </div>
      </Card>
    </div>
  );
}
