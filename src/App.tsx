import { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Select } from "./components/ui/select";
import { generateTweet, generateBatchTweets, getCurrentProvider, type TweetGenerationRequest } from "./lib/api";
import {
  saveToHistory,
  toggleFavorite,
  type SavedTweet,
} from "./lib/history";
import { useKeyboardShortcuts } from "./lib/useKeyboardShortcuts";
import { useStreamingGeneration } from "./lib/useStreamingGeneration";
import { analyzeImageAndGenerateTweet } from "./lib/vision";
import { visionLogger } from "./lib/logger";
import { clientRateLimiter, createRateLimitError } from "./lib/rateLimit";
import { type UploadedMedia } from "./components/ImageUploader";
import { HistoryPanel } from "./components/HistoryPanel";
import { TweetPreview } from "./components/TweetPreview";
import { BatchResults } from "./components/BatchResults";
import { TemplateSelector } from "./components/TemplateSelector";
import { AdvancedControls } from "./components/AdvancedControls";
import { ImageUploader } from "./components/ImageUploader";
import { PresetSelector } from "./components/PresetSelector";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { DEFAULT_SETTINGS, type AdvancedSettings } from "./lib/settings";
import type { SettingsPreset } from "./lib/presets";
import { type Template } from "./lib/templates";
import { SchedulerPanel } from "./components/SchedulerPanel";
import { HashtagSuggestions } from "./components/HashtagSuggestions";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { trackTweetGeneration } from "./lib/analytics";
import {
  Copy,
  RefreshCw,
  Twitter,
  Moon,
  Sun,
  Sparkles,
  Loader2,
  History,
  Eye,
  EyeOff,
  Star,
  Layers,
  Zap,
  Settings,
  ImageIcon,
  Edit,
  Calendar,
  Hash,
  BarChart3,
} from "lucide-react";
import { useTheme } from "./components/theme-provider";

function App() {
  const { theme, setTheme } = useTheme();
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState<"viral" | "professional" | "casual" | "thread">("viral");
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [generatedTweet, setGeneratedTweet] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Feature states
  const [showHistory, setShowHistory] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [currentTweetId, setCurrentTweetId] = useState<string>("");
  const [editMode, setEditMode] = useState(false);
  const [editedTweet, setEditedTweet] = useState("");

  // Batch mode states
  const [batchMode, setBatchMode] = useState(false);
  const [batchCount, setBatchCount] = useState(3);
  const [batchTweets, setBatchTweets] = useState<string[]>([]);
  const [selectedBatchIndex, setSelectedBatchIndex] = useState<number | null>(null);
  const [copiedBatchIndex, setCopiedBatchIndex] = useState<number | null>(null);

  // New feature states
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>(DEFAULT_SETTINGS);
  const [useStreaming, setUseStreaming] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);

  // Vision feature states
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia | null>(null);
  const [customContext, setCustomContext] = useState("");

  // Phase 3 feature states
  const [showScheduler, setShowScheduler] = useState(false);
  const [showHashtags, setShowHashtags] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Load analytics on mount and when tweets are generated
  useEffect(() => {
    // Analytics loaded on demand by components
  }, []);

  // Streaming hook
  const { isStreaming, streamedContent, error: streamError, startStreaming, stopStreaming, reset: resetStream } = useStreamingGeneration({
    onComplete: (result) => {
      setGeneratedTweet(result);
      // Track analytics
      trackTweetGeneration(style, selectedTemplate?.name, topic);
      // Save to history
      const newTweet: SavedTweet = {
        id: Date.now().toString(),
        content: result,
        topic: selectedTemplate?.name || topic,
        style,
        timestamp: Date.now(),
        favorite: false,
      };
      saveToHistory(newTweet);
      setCurrentTweetId(newTweet.id);
      setLoading(false);
    },
    onError: (err) => {
      setError(err);
      setLoading(false);
    },
  });

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: "Enter",
      ctrlKey: true,
      metaKey: true,
      action: () => {
        if (topic.trim() && !loading && !isStreaming) {
          handleGenerate();
        }
      },
      description: "Generate Tweet",
    },
    {
      key: "b",
      ctrlKey: true,
      metaKey: true,
      action: () => setBatchMode(!batchMode),
      description: "Toggle Batch Mode",
    },
    {
      key: "s",
      ctrlKey: true,
      metaKey: true,
      action: () => setUseStreaming(!useStreaming),
      description: "Toggle Streaming",
    },
    {
      key: "t",
      ctrlKey: true,
      metaKey: true,
      action: () => setShowTemplates(!showTemplates),
      description: "Toggle Templates",
    },
    {
      key: "c",
      ctrlKey: true,
      metaKey: true,
      action: () => {
        if (generatedTweet && !copied) {
          handleCopy();
        }
      },
      description: "Copy to Clipboard",
    },
    {
      key: "r",
      ctrlKey: true,
      metaKey: true,
      action: () => {
        if (!loading && !isStreaming && (topic.trim() || generatedTweet)) {
          handleGenerate();
        }
      },
      description: "Regenerate",
    },
    {
      key: "h",
      ctrlKey: true,
      metaKey: true,
      action: () => setShowHistory(!showHistory),
      description: "Toggle History",
    },
    {
      key: "p",
      ctrlKey: true,
      metaKey: true,
      action: () => setShowPreview(!showPreview),
      description: "Toggle Preview",
    },
    {
      key: "a",
      ctrlKey: true,
      metaKey: true,
      action: () => setShowAnalytics(!showAnalytics),
      description: "Toggle Analytics",
    },
    {
      key: "h",
      ctrlKey: true,
      shiftKey: true,
      action: () => setShowHashtags(!showHashtags),
      description: "Toggle Hashtag Suggestions",
    },
    {
      key: "d",
      ctrlKey: true,
      metaKey: true,
      action: () => {
        if (generatedTweet) {
          setShowScheduler(true);
        }
      },
      description: "Schedule Tweet",
    },
    {
      key: "Escape",
      action: () => {
        if (showHistory) setShowHistory(false);
        if (showScheduler) setShowScheduler(false);
        if (showHashtags) setShowHashtags(false);
        if (showAnalytics) setShowAnalytics(false);
        if (batchTweets.length > 0) {
          setBatchTweets([]);
          setSelectedBatchIndex(null);
        }
        if (isStreaming) {
          stopStreaming();
          setLoading(false);
        }
      },
      description: "Close Dialog / Clear Batch / Stop Streaming",
    },
  ]);

  const buildRequest = (): TweetGenerationRequest => ({
    topic,
    style,
    includeHashtags,
    includeEmojis,
    template: selectedTemplate?.prompt,
    useTemplate: !!selectedTemplate,
    advancedSettings: advancedSettings,
  });

  const handleGenerate = async () => {
    if (!topic.trim() && !selectedTemplate && !uploadedMedia) {
      setError("Please enter a topic, select a template, or upload an image");
      return;
    }

    // Check rate limits based on the type of generation
    const rateLimitCheck = uploadedMedia
      ? clientRateLimiter.checkVisionAnalysis()
      : batchMode
        ? clientRateLimiter.checkBatchGeneration()
        : clientRateLimiter.checkTweetGeneration();

    if (!rateLimitCheck.allowed) {
      setError(createRateLimitError(rateLimitCheck, uploadedMedia ? "vision analysis" : batchMode ? "batch generation" : "tweet generation"));
      return;
    }

    setLoading(true);
    setError("");
    setGeneratedTweet("");
    setBatchTweets([]);
    setSelectedBatchIndex(null);
    resetStream();

    try {
      // Vision-based generation when media is uploaded
      if (uploadedMedia && uploadedMedia.base64) {
        visionLogger.debug("Starting vision analysis...");
        const response = await analyzeImageAndGenerateTweet({
          imageBase64: uploadedMedia.base64,
          images: uploadedMedia.images, // Multiple frames for video
          isVideo: uploadedMedia.isVideo,
          style,
          includeHashtags,
          includeEmojis,
          customContext: topic || customContext || undefined,
          advancedSettings: advancedSettings,
        });

        visionLogger.debug("Vision response received:", response);

        if (response.error) {
          visionLogger.error("Vision error:", response.error);
          setError(response.error);
        } else {
          visionLogger.debug("Vision tweet generated:", response.tweet?.substring(0, 50) + "...");
          setGeneratedTweet(response.tweet);
          // Track analytics
          trackTweetGeneration(style, selectedTemplate?.name, uploadedMedia.file.name);
          // Save to history
          const newTweet: SavedTweet = {
            id: Date.now().toString(),
            content: response.tweet,
            topic: uploadedMedia.file.name,
            style,
            timestamp: Date.now(),
            favorite: false,
          };
          saveToHistory(newTweet);
          setCurrentTweetId(newTweet.id);
        }
        setLoading(false);
        return;
      }

      const request = buildRequest();

      if (batchMode) {
        // Batch generation
        const response = await generateBatchTweets(request, batchCount);

        if (response.error) {
          setError(response.error);
        } else if (response.tweets.length > 0) {
          setBatchTweets(response.tweets);
          setGeneratedTweet(response.tweets[0]);
          setSelectedBatchIndex(0);
          // Track analytics for batch
          trackTweetGeneration(style, selectedTemplate?.name, topic);
          // Save all tweets to history
          response.tweets.forEach((tweet) => {
            const newTweet: SavedTweet = {
              id: `${Date.now()}-${Math.random()}`,
              content: tweet,
              topic: selectedTemplate?.name || topic,
              style,
              timestamp: Date.now(),
              favorite: false,
            };
            saveToHistory(newTweet);
          });
        }
        setLoading(false);
      } else if (useStreaming) {
        // Streaming generation
        await startStreaming(request);
      } else {
        // Regular single tweet generation
        const response = await generateTweet(request);

        if (response.error) {
          setError(response.error);
        } else {
          setGeneratedTweet(response.tweet);
          // Track analytics
          trackTweetGeneration(style, selectedTemplate?.name, topic);
          // Save to history
          const newTweet: SavedTweet = {
            id: Date.now().toString(),
            content: response.tweet,
            topic: selectedTemplate?.name || topic,
            style,
            timestamp: Date.now(),
            favorite: false,
          };
          saveToHistory(newTweet);
          setCurrentTweetId(newTweet.id);
        }
        setLoading(false);
      }
    } catch (err) {
      setError("Failed to generate tweet. Please try again.");
      setLoading(false);
    }
  };

  const handleCopy = async (tweet?: string) => {
    const textToCopy = tweet || generatedTweet;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBatchCopy = async (tweet: string, index: number) => {
    await navigator.clipboard.writeText(tweet);
    setCopiedBatchIndex(index);
    setTimeout(() => setCopiedBatchIndex(null), 2000);
  };

  const handleTweet = (tweet?: string) => {
    const textToTweet = tweet || generatedTweet;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(textToTweet)}`;
    window.open(url, "_blank");
  };

  const handleBatchSelect = (tweet: string, index: number) => {
    setGeneratedTweet(tweet);
    setSelectedBatchIndex(index);
  };

  const handleFavorite = () => {
    if (currentTweetId) {
      toggleFavorite(currentTweetId);
    }
  };

  const handleEdit = () => {
    setEditedTweet(generatedTweet);
    setEditMode(true);
  };

  const handleSaveEdit = () => {
    setGeneratedTweet(editedTweet);
    setEditMode(false);
    // Update the saved tweet in history
    if (currentTweetId) {
      const newTweet: SavedTweet = {
        id: Date.now().toString(),
        content: editedTweet,
        topic: selectedTemplate?.name || topic || "Edited tweet",
        style,
        timestamp: Date.now(),
        favorite: false,
      };
      saveToHistory(newTweet);
      setCurrentTweetId(newTweet.id);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedTweet("");
  };

  const handleLoadPreset = (preset: SettingsPreset["settings"]) => {
    setStyle(preset.style);
    setIncludeHashtags(preset.includeHashtags);
    setIncludeEmojis(preset.includeEmojis);
    setAdvancedSettings(preset.advancedSettings);
  };

  const handleHashtagSelect = (hashtags: string) => {
    // If there's a generated tweet, append the hashtags
    if (generatedTweet && hashtags) {
      const updatedTweet = generatedTweet.endsWith(" ")
        ? generatedTweet + hashtags
        : `${generatedTweet} ${hashtags}`;
      setGeneratedTweet(updatedTweet);
    }
  };

  const handleOpenScheduler = () => {
    if (generatedTweet) {
      setShowScheduler(true);
    }
  };

  const currentProvider = getCurrentProvider();
  const displayContent = isStreaming ? streamedContent : generatedTweet;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">AI Tweet Generator</h1>
            {batchMode && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                Batch Mode
              </span>
            )}
            {useStreaming && !batchMode && (
              <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3" /> Streaming
              </span>
            )}
            {uploadedMedia && (
              <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                <ImageIcon className="w-3 h-3" /> Vision
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant={batchMode ? "default" : "ghost"}
              size="icon"
              onClick={() => setBatchMode(!batchMode)}
              title="Toggle Batch Mode (Ctrl+B)"
            >
              <Layers className="h-4 w-4" />
            </Button>
            <Button
              variant={useStreaming ? "default" : "ghost"}
              size="icon"
              onClick={() => setUseStreaming(!useStreaming)}
              title="Toggle Streaming (Ctrl+S)"
            >
              <Zap className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowTemplates(!showTemplates)}
              title="Toggle Templates (Ctrl+T)"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant={uploadedMedia ? "default" : "ghost"}
              size="icon"
              onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
              title="Upload Image/Video"
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHistory(!showHistory)}
              title="History (Ctrl+H)"
            >
              <History className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPreview(!showPreview)}
              title="Toggle Preview (Ctrl+P)"
            >
              {showPreview ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </Button>
            <Button
              variant={showHashtags ? "default" : "ghost"}
              size="icon"
              onClick={() => setShowHashtags(!showHashtags)}
              title="Hashtag Suggestions (Alt+H)"
            >
              <Hash className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpenScheduler}
              title="Schedule Tweet (Ctrl+D)"
              disabled={!generatedTweet}
            >
              <Calendar className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAnalytics(!showAnalytics)}
              title="Analytics (Ctrl+A)"
            >
              <BarChart3 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid lg:grid-cols-[1fr_350px] gap-8">
          {/* Left Column - Input */}
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                {uploadedMedia ? (
                  <>Generate Tweet from {uploadedMedia.type === "video" ? "Video" : "Image"}</>
                ) : selectedTemplate ? (
                  <>Create {selectedTemplate.name} Tweets</>
                ) : batchMode ? (
                  "Generate Multiple Tweets"
                ) : (
                  "Create Viral Tweets with AI"
                )}
              </h2>
              <p className="text-muted-foreground text-lg">
                {uploadedMedia
                  ? "AI will analyze your media and create the perfect tweet"
                  : selectedTemplate
                  ? selectedTemplate.description
                  : batchMode
                  ? `Generate ${batchCount} variations and pick the best one`
                  : "Generate engaging tweets in seconds using multiple AI providers"}
              </p>
            </div>

            {/* Templates Panel */}
            {showTemplates && (
              <TemplateSelector
                selectedTemplate={selectedTemplate}
                onSelect={(template) => {
                  setSelectedTemplate(template);
                  if (template) {
                    setShowTemplates(false);
                  }
                }}
              />
            )}

            {/* Image/Video Upload */}
            <ImageUploader
              media={uploadedMedia}
              onMediaChange={setUploadedMedia}
              loading={loading || isStreaming}
            />

            {/* Custom Context for Vision */}
            {uploadedMedia && (
              <div className="space-y-2">
                <Label htmlFor="context">Additional Context (Optional)</Label>
                <Textarea
                  id="context"
                  placeholder="Add specific instructions for the tweet... (e.g., 'Focus on the product features', 'Make it humorous')"
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  className="min-h-[60px] resize-none"
                />
              </div>
            )}

            {/* Input Card */}
            <Card className="border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle>Generate Your Tweet{batchMode ? "s" : ""}</CardTitle>
                <CardDescription>
                  {uploadedMedia
                    ? "AI will analyze your image/video and generate a tweet"
                    : selectedTemplate
                    ? `Using template: ${selectedTemplate.name}`
                    : "Enter a topic and customize your tweet style"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Topic Input */}
                <div className="space-y-2">
                  <Label htmlFor="topic">
                    Topic{" "}
                    <span className="text-xs text-muted-foreground">(Ctrl+Enter to generate)</span>
                  </Label>
                  <Textarea
                    id="topic"
                    placeholder={
                      uploadedMedia
                        ? "Add context or instructions for the tweet (optional)..."
                        : selectedTemplate
                        ? `Add details for ${selectedTemplate.name}...`
                        : "e.g., React tips, AI development, productivity hacks..."
                    }
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                </div>

                {/* Style Selection */}
                <div className="space-y-2">
                  <Label htmlFor="style">Style</Label>
                  <Select
                    id="style"
                    value={style}
                    onChange={(e) => setStyle(e.target.value as any)}
                  >
                    <option value="viral">🚀 Viral & Engaging</option>
                    <option value="professional">💼 Professional</option>
                    <option value="casual">😊 Casual & Friendly</option>
                    <option value="thread">🧵 Twitter Thread</option>
                  </Select>
                </div>

                {/* Batch Mode Options */}
                {batchMode && (
                  <div className="space-y-2">
                    <Label htmlFor="batchCount">Number of Variations</Label>
                    <Select
                      id="batchCount"
                      value={batchCount.toString()}
                      onChange={(e) => setBatchCount(parseInt(e.target.value))}
                    >
                      <option value="2">2 variations</option>
                      <option value="3">3 variations</option>
                      <option value="4">4 variations</option>
                      <option value="5">5 variations</option>
                    </Select>
                  </div>
                )}

                {/* Options */}
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeHashtags}
                      onChange={(e) => setIncludeHashtags(e.target.checked)}
                      className="w-4 h-4 rounded border-input"
                    />
                    <span className="text-sm">Include Hashtags</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeEmojis}
                      onChange={(e) => setIncludeEmojis(e.target.checked)}
                      className="w-4 h-4 rounded border-input"
                    />
                    <span className="text-sm">Include Emojis</span>
                  </label>
                </div>

                {/* Advanced Controls */}
                <AdvancedControls
                  settings={advancedSettings}
                  onChange={setAdvancedSettings}
                />

                {/* Preset Selector */}
                <PresetSelector
                  style={style}
                  includeHashtags={includeHashtags}
                  includeEmojis={includeEmojis}
                  advancedSettings={advancedSettings}
                  onLoadPreset={handleLoadPreset}
                />

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={loading || isStreaming || (!topic.trim() && !selectedTemplate && !uploadedMedia)}
                  className="w-full"
                  size="lg"
                >
                  {loading || isStreaming ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {isStreaming ? "Generating..." : "Generating..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate {batchMode ? `${batchCount} Tweets` : "Tweet"}
                    </>
                  )}
                </Button>

                {/* Error Message */}
                {(error || streamError) && (
                  <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                    {error || streamError}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Keyboard Shortcuts Info */}
            <Card className="bg-muted/50 border-border/50">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-sm mb-3">Keyboard Shortcuts</h3>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div><kbd className="px-1.5 py-0.5 bg-background border rounded">Ctrl+Enter</kbd> Generate</div>
                  <div><kbd className="px-1.5 py-0.5 bg-background border rounded">Ctrl+B</kbd> Batch mode</div>
                  <div><kbd className="px-1.5 py-0.5 bg-background border rounded">Ctrl+S</kbd> Streaming</div>
                  <div><kbd className="px-1.5 py-0.5 bg-background border rounded">Ctrl+T</kbd> Templates</div>
                  <div><kbd className="px-1.5 py-0.5 bg-background border rounded">Ctrl+C</kbd> Copy</div>
                  <div><kbd className="px-1.5 py-0.5 bg-background border rounded">Ctrl+R</kbd> Regenerate</div>
                  <div><kbd className="px-1.5 py-0.5 bg-background border rounded">Ctrl+H</kbd> History</div>
                  <div><kbd className="px-1.5 py-0.5 bg-background border rounded">Ctrl+P</kbd> Preview</div>
                  <div><kbd className="px-1.5 py-0.5 bg-background border rounded">Ctrl+A</kbd> Analytics</div>
                  <div><kbd className="px-1.5 py-0.5 bg-background border rounded">Ctrl+Shift+H</kbd> Hashtags</div>
                  <div><kbd className="px-1.5 py-0.5 bg-background border rounded">Ctrl+D</kbd> Schedule</div>
                  <div><kbd className="px-1.5 py-0.5 bg-background border rounded">Esc</kbd> Close</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Preview & Result */}
          <div className="space-y-8">
            {/* Batch Results */}
            {batchTweets.length > 0 ? (
              <BatchResults
                tweets={batchTweets}
                onSelect={handleBatchSelect}
                selectedIndex={selectedBatchIndex}
                onCopy={handleBatchCopy}
                onTweet={handleTweet}
                copiedIndex={copiedBatchIndex}
              />
            ) : (
              <>
                {/* Tweet Preview */}
                {showPreview && displayContent && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Live Preview</h3>
                    <TweetPreview content={displayContent} />
                  </div>
                )}

                {/* Result Card */}
                {displayContent && !editMode && (
                  <Card className="border-primary/20 shadow-lg">
                    <CardHeader>
                      <CardTitle>Your Generated Tweet</CardTitle>
                      <CardDescription>
                        {isStreaming ? "Generating in real-time..." : "Copy it, tweet it directly, or regenerate"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-6 bg-muted rounded-lg border">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {displayContent}
                          {isStreaming && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />}
                        </p>
                        <div className="mt-4 text-xs text-muted-foreground flex justify-between">
                          <span>{displayContent.length} characters</span>
                          <span
                            className={
                              displayContent.length > 280
                                ? "text-red-500"
                                : displayContent.length > 260
                                ? "text-yellow-500"
                                : "text-green-500"
                            }
                          >
                            {displayContent.length > 280
                              ? `-${displayContent.length - 280} over limit`
                              : `${280 - displayContent.length} remaining`}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={() => handleCopy()}
                          variant="outline"
                          className="flex-1"
                          disabled={isStreaming}
                        >
                          {copied ? (
                            <>
                              <Copy className="mr-2 h-4 w-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleTweet()}
                          className="flex-1 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
                          disabled={isStreaming}
                        >
                          <Twitter className="mr-2 h-4 w-4" />
                          Post
                        </Button>
                        <Button
                          onClick={handleGenerate}
                          variant="outline"
                          disabled={loading || isStreaming}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Regenerate
                        </Button>
                        <Button
                          onClick={handleEdit}
                          variant="outline"
                          disabled={isStreaming || !generatedTweet}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          onClick={handleFavorite}
                          variant="outline"
                          size="icon"
                          title="Save to favorites"
                          disabled={isStreaming}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Stop Streaming Button */}
                      {isStreaming && (
                        <Button
                          onClick={() => {
                            stopStreaming();
                            setLoading(false);
                          }}
                          variant="destructive"
                          className="w-full"
                        >
                          Stop Generation
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Edit Mode Card */}
                {editMode && (
                  <Card className="border-primary/20 shadow-lg">
                    <CardHeader>
                      <CardTitle>Edit Your Tweet</CardTitle>
                      <CardDescription>Make changes before saving</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        value={editedTweet}
                        onChange={(e) => setEditedTweet(e.target.value)}
                        className="min-h-[150px] resize-none"
                        placeholder="Edit your tweet..."
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{editedTweet.length} characters</span>
                        <span
                          className={
                            editedTweet.length > 280
                              ? "text-red-500"
                              : editedTweet.length > 260
                              ? "text-yellow-500"
                              : "text-green-500"
                          }
                        >
                          {editedTweet.length > 280
                            ? `-${editedTweet.length - 280} over limit`
                            : `${280 - editedTweet.length} remaining`}
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={handleSaveEdit}
                          className="flex-1"
                          disabled={!editedTweet.trim()}
                        >
                          Save Changes
                        </Button>
                        <Button
                          onClick={handleCancelEdit}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Info Card */}
            <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/10">
              <CardContent className="pt-6">
                <div className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Powered by:</strong>{" "}
                    <span className="text-primary font-mono">{currentProvider}</span>
                  </p>
                  <p>
                    <strong className="text-foreground">Features:</strong>{" "}
                    {batchMode ? (
                      <>Batch generation with multiple variations</>
                    ) : useStreaming ? (
                      <>Real-time streaming generation, templates, advanced controls</>
                    ) : (
                      <>
                        Live preview, history with favorites, keyboard shortcuts,
                        batch mode, templates, advanced controls, streaming responses
                      </>
                    )}
                  </p>
                  <p>
                    <strong className="text-foreground">Privacy:</strong> Your API
                    key is stored locally and never shared. All requests go directly
                    to the AI provider's servers.
                  </p>
                  <p className="text-xs">
                    <strong className="text-foreground">Supported providers:</strong>{" "}
                    Groq, Hugging Face, OpenAI, DeepSeek, Together AI
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>
            Built with{" "}
            <span className="text-red-500">♥</span> using React + Vite +
            Tailwind CSS + shadcn/ui
          </p>
          <p className="mt-2">
            Powered by{" "}
            <a
              href="https://groq.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Groq
            </a>{" "}
            •{" "}
            <a
              href="https://github.com/yourusername/ai-tweet-generator"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              GitHub
            </a>
          </p>
        </div>
      </footer>

      {/* History Panel Modal */}
      <HistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onTweetSelect={(content) => {
          setGeneratedTweet(content);
          setBatchTweets([]);
          setSelectedBatchIndex(null);
          const words = content.split(" ").slice(0, 3).join(" ");
          setTopic(words);
        }}
      />

      {/* Scheduler Panel Modal */}
      <SchedulerPanel
        isOpen={showScheduler}
        onClose={() => setShowScheduler(false)}
        tweetContent={generatedTweet}
        style={style}
        topic={selectedTemplate?.name || topic || "Scheduled Tweet"}
      />

      {/* Hashtag Suggestions Modal */}
      <HashtagSuggestions
        isOpen={showHashtags}
        onClose={() => setShowHashtags(false)}
        topic={selectedTemplate?.name || topic}
        onHashtagsSelect={handleHashtagSelect}
        includeHashtags={includeHashtags}
      />

      {/* Analytics Dashboard Modal */}
      <AnalyticsDashboard
        isOpen={showAnalytics}
        onClose={() => {
          setShowAnalytics(false);
        }}
      />
    </div>
    </ErrorBoundary>
  );
}

export default App;
