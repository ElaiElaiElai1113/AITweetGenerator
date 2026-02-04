import { useState, useEffect, useMemo } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import {
  getHistory,
  deleteFromHistory,
  toggleFavorite,
  clearHistory,
  exportHistory,
  importHistory,
  type SavedTweet,
} from "@/lib/history";
import { Trash2, Star, StarOff, X, History as HistoryIcon, Search, Download, Upload } from "lucide-react";

interface HistoryPanelProps {
  onTweetSelect: (tweet: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryPanel({
  onTweetSelect,
  isOpen,
  onClose,
}: HistoryPanelProps) {
  const [history, setHistory] = useState<SavedTweet[]>([]);
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const [styleFilter, setStyleFilter] = useState<"all" | "viral" | "professional" | "casual" | "thread">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, filter, styleFilter]);

  const filteredHistory = useMemo(() => {
    let result = history;

    // Apply style filter
    if (styleFilter !== "all") {
      result = result.filter((t) => t.style === styleFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((t) =>
        t.content.toLowerCase().includes(query) ||
        t.topic.toLowerCase().includes(query)
      );
    }

    return result;
  }, [history, styleFilter, searchQuery]);

  const loadHistory = () => {
    const allHistory = getHistory();
    const filtered =
      filter === "favorites"
        ? allHistory.filter((t) => t.favorite)
        : allHistory;
    setHistory(filtered);
  };

  const handleDelete = (id: string) => {
    const updated = deleteFromHistory(id);
    const filtered =
      filter === "favorites" ? updated.filter((t) => t.favorite) : updated;
    setHistory(filtered);
  };

  const handleToggleFavorite = (id: string) => {
    const updated = toggleFavorite(id);
    const filtered =
      filter === "favorites" ? updated.filter((t) => t.favorite) : updated;
    setHistory(filtered);
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all history?")) {
      clearHistory();
      setHistory([]);
    }
  };

  const handleExport = () => {
    exportHistory();
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        importHistory(file);
        loadHistory();
      }
    };
    input.click();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <HistoryIcon className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Tweet History</h2>
            <span className="text-sm text-muted-foreground">
              ({filteredHistory.length})
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tweets by content or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "favorites" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("favorites")}
            >
              Favorites
            </Button>

            {/* Style Filters */}
            <div className="w-px bg-border mx-1" />
            <Button
              variant={styleFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStyleFilter("all")}
            >
              All Styles
            </Button>
            <Button
              variant={styleFilter === "viral" ? "default" : "outline"}
              size="sm"
              onClick={() => setStyleFilter("viral")}
            >
              Viral
            </Button>
            <Button
              variant={styleFilter === "professional" ? "default" : "outline"}
              size="sm"
              onClick={() => setStyleFilter("professional")}
            >
              Professional
            </Button>
            <Button
              variant={styleFilter === "casual" ? "default" : "outline"}
              size="sm"
              onClick={() => setStyleFilter("casual")}
            >
              Casual
            </Button>
            <Button
              variant={styleFilter === "thread" ? "default" : "outline"}
              size="sm"
              onClick={() => setStyleFilter("thread")}
            >
              Thread
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleImport}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <div className="flex-1" />
            {history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearAll}>
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <HistoryIcon className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No tweets found</p>
              <p className="text-sm">
                {searchQuery ? "Try a different search term" :
                  filter === "favorites"
                  ? "Favorite some tweets to see them here"
                  : "Generated tweets will appear here"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((tweet) => (
                <Card
                  key={tweet.id}
                  className="p-4 hover:bg-accent/50 transition-colors cursor-pointer group"
                >
                  <div className="flex gap-3">
                    <div
                      className="flex-1 space-y-2"
                      onClick={() => {
                        onTweetSelect(tweet.content);
                        onClose();
                      }}
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium capitalize">
                          {tweet.style}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          {formatDate(tweet.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {tweet.content}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        Topic: {tweet.topic}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(tweet.id);
                        }}
                      >
                        {tweet.favorite ? (
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <StarOff className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(tweet.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
