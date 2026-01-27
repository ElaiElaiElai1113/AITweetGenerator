import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  getHistory,
  deleteFromHistory,
  toggleFavorite,
  clearHistory,
  type SavedTweet,
} from "@/lib/history";
import { Trash2, Star, StarOff, X, History as HistoryIcon } from "lucide-react";

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

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, filter]);

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
              ({history.length})
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 p-4 border-b">
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
          <div className="flex-1" />
          {history.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearAll}>
              Clear All
            </Button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <HistoryIcon className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No tweets yet</p>
              <p className="text-sm">
                {filter === "favorites"
                  ? "Favorite some tweets to see them here"
                  : "Generated tweets will appear here"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((tweet) => (
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
