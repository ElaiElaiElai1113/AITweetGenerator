import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  getScheduledTweets,
  scheduleTweet,
  deleteScheduledTweet,
  updateScheduledTweet,
  type ScheduledTweet,
} from "@/lib/scheduler";
import { Trash2, Calendar, Clock, X } from "lucide-react";

interface SchedulerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tweetContent: string;
  style: "viral" | "professional" | "casual" | "thread";
  topic: string;
}

export function SchedulerPanel({
  isOpen,
  onClose,
  tweetContent,
  style,
  topic,
}: SchedulerPanelProps) {
  const [scheduledTweets, setScheduledTweets] = useState<ScheduledTweet[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadScheduledTweets();
      // Check for due tweets every 30 seconds
      const interval = setInterval(checkDueTweets, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const loadScheduledTweets = () => {
    setScheduledTweets(getScheduledTweets());
  };

  const checkDueTweets = () => {
    // This would normally post the tweets to Twitter
    // For now, we'll mark them as "failed" with a note
    const due = getScheduledTweets().filter((t) => t.status === "pending");
    due.forEach((tweet) => {
      if (new Date(tweet.scheduledFor) <= new Date()) {
        updateScheduledTweet(tweet.id, {
          status: "failed",
        });
        loadScheduledTweets();
      }
    });
  };

  const handleSchedule = () => {
    if (!tweetContent.trim()) {
      alert("Please generate a tweet first");
      return;
    }
    if (!selectedDate || !selectedTime) {
      alert("Please select a date and time");
      return;
    }

    const scheduledFor = new Date(`${selectedDate}T${selectedTime}`);
    if (scheduledFor <= new Date()) {
      alert("Please select a future date and time");
      return;
    }

    scheduleTweet({
      content: tweetContent,
      scheduledFor,
      topic,
      style,
      status: "pending",
    });

    loadScheduledTweets();
    setSelectedDate("");
    setSelectedTime("");
    onClose();
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this scheduled tweet?")) {
      deleteScheduledTweet(id);
      loadScheduledTweets();
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  const getTimeUntil = (date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes`;
    if (diffHours < 24) return `${diffHours} hours`;
    return `${diffDays} days`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Scheduled Tweets</h2>
            <span className="text-sm text-muted-foreground">
              ({scheduledTweets.length})
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Schedule New Tweet Form */}
        <div className="p-6 border-b space-y-4">
          <h3 className="font-semibold">Schedule Current Tweet</h3>
          <div className="p-4 bg-muted rounded-lg border">
            <p className="text-sm whitespace-pre-wrap break-words">
              {tweetContent || "No tweet generated yet"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={handleSchedule}
            className="w-full"
            disabled={!tweetContent.trim() || !selectedDate || !selectedTime}
          >
            <Clock className="w-4 h-4 mr-2" />
            Schedule Tweet
          </Button>
        </div>

        {/* Scheduled Tweets List */}
        <div className="flex-1 overflow-y-auto p-4">
          {scheduledTweets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Calendar className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No scheduled tweets</p>
              <p className="text-sm">
                Schedule tweets to post them automatically
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledTweets.map((tweet) => (
                <Card
                  key={tweet.id}
                  className={`p-4 border ${
                    tweet.status === "posted"
                      ? "border-green-500 bg-green-500/5"
                      : tweet.status === "failed"
                      ? "border-red-500 bg-red-500/5"
                      : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            tweet.status === "posted"
                              ? "bg-green-500 text-white"
                              : tweet.status === "failed"
                              ? "bg-red-500 text-white"
                              : "bg-muted"
                          }`}
                        >
                          {tweet.status === "posted"
                            ? "Posted"
                            : tweet.status === "failed"
                            ? "Failed"
                            : "Pending"}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="capitalize">{tweet.style}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {tweet.content}
                      </p>
                      <div className="text-xs text-muted-foreground flex gap-4">
                        <span>Due: {formatDate(tweet.scheduledFor)}</span>
                        <span>({getTimeUntil(tweet.scheduledFor)} from now)</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(tweet.id)}
                      disabled={tweet.status === "posted"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
