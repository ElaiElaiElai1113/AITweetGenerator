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
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Vision feature states
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia | null>(null);
  const [customContext, setCustomContext] = useState("");

  // Phase 3 feature states
  const [showScheduler, setShowScheduler] = useState(false);
  const [showHashtags, setShowHashtags] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<Date | null>(null);

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
      setLastGeneratedAt(new Date());
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
          setLastGeneratedAt(new Date());
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
          setLastGeneratedAt(new Date());
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
          setLastGeneratedAt(new Date());
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
  const errorMessage = error || streamError;
  const isMissingApiKey = !!errorMessage && errorMessage.includes("No API key found");
  const statusLine = loading || isStreaming
    ? `Generating with ${currentProvider}`
    : lastGeneratedAt
    ? `Last generated at ${new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(lastGeneratedAt)}`
    : "Ready to generate";
  const examplePrompts = [
    "3 underrated tips for remote developers",
    "A quick launch update for my new SaaS",
    "What I learned after shipping a side project in 30 days",
  ];

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
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-[1fr_350px] gap-6">
          {/* Left Column - Input */}
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
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
              <p className="text-muted-foreground text-base">
                {uploadedMedia
                  ? "AI will analyze your media and create the perfect tweet"
                  : selectedTemplate
                  ? selectedTemplate.description
                  : batchMode
                  ? `Generate ${batchCount} variations and pick the best one`
                  : "Generate engaging tweets in seconds using multiple AI providers"}
              </p>
            </div>

            {/* Quick Tools */}
            <Card className="border-border/60 bg-muted/40">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Quick Tools</h3>
                  <p className="text-xs text-muted-foreground">Keep the core flow focused</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  <Button
                    variant={batchMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBatchMode(!batchMode)}
                    className="justify-start"
                    title="Toggle Batch Mode (Ctrl+B)"
                  >
                    <Layers className="mr-2 h-4 w-4" />
                    Batch Mode
                  </Button>
                  <Button
                    variant={useStreaming ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUseStreaming(!useStreaming)}
                    className="justify-start"
                    title="Toggle Streaming (Ctrl+S)"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Streaming
                  </Button>
                  <Button
                    variant={showTemplates ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="justify-start"
                    title="Toggle Templates (Ctrl+T)"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Templates
                  </Button>
                  <Button
                    variant={uploadedMedia ? "default" : "outline"}
                    size="sm"
                    onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                    className="justify-start"
                    title="Upload Image/Video"
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Upload Media
                  </Button>
                  <Button
                    variant={showHistory ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                    className="justify-start"
                    title="History (Ctrl+H)"
                  >
                    <History className="mr-2 h-4 w-4" />
                    History
                  </Button>
                  <Button
                    variant={showPreview ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="justify-start"
                    title="Toggle Preview (Ctrl+P)"
                  >
                    {showPreview ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                    Preview
                  </Button>
                  <Button
                    variant={showHashtags ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowHashtags(!showHashtags)}
                    className="justify-start"
                    title="Hashtag Suggestions (Alt+H)"
                  >
                    <Hash className="mr-2 h-4 w-4" />
                    Hashtags
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenScheduler}
                    className="justify-start"
                    title="Schedule Tweet (Ctrl+D)"
                    disabled={!generatedTweet}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule
                  </Button>
                  <Button
                    variant={showAnalytics ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowAnalytics(!showAnalytics)}
                    className="justify-start"
                    title="Analytics (Ctrl+A)"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>

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
              <CardContent className="space-y-4">
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
                  className="min-h-[88px] resize-none"
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">Try:</span>
                  {examplePrompts.map((prompt) => (
                    <Button
                      key={prompt}
                      variant="outline"
                      size="sm"
                      onClick={() => setTopic(prompt)}
                      className="h-7 px-2 text-xs"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
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
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Enhancements</p>
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
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Advanced Options</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    >
                      {showAdvancedOptions ? "Hide" : "Show"}
                    </Button>
                  </div>
                  {showAdvancedOptions ? (
                    <div className="space-y-4">
                      <AdvancedControls
                        settings={advancedSettings}
                        onChange={setAdvancedSettings}
                      />
                      <PresetSelector
                        style={style}
                        includeHashtags={includeHashtags}
                        includeEmojis={includeEmojis}
                        advancedSettings={advancedSettings}
                        onLoadPreset={handleLoadPreset}
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Hidden to keep the flow simple. Use when you need more control.
                    </p>
                  )}
                </div>

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
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{statusLine}</span>
                  {batchMode && <span>{batchCount} variations</span>}
                </div>
                {errorMessage && (
                  <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                    <p className="font-semibold mb-1">Generation failed</p>
                    <p className="text-sm">{errorMessage}</p>
                    {isMissingApiKey && (
                      <p className="text-xs mt-2 text-destructive/80">
                        Add a provider key to `.env` and restart the dev server.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Keyboard Shortcuts Info */}
            <Card className="bg-muted/40 border-border/50">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-sm mb-3">Keyboard Shortcuts</h3>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
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
          <div className="space-y-6">
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
                    <h3 className="text-base font-semibold">Live Preview</h3>
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

            {/* Provider + Privacy */}
            <Card className="bg-muted/40 border-border/60">
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Provider:</strong>{" "}
                    <span className="text-primary font-mono">{currentProvider}</span>
                  </p>
                  <p>
                    <strong className="text-foreground">Privacy:</strong> Your API
                    key is stored locally and never shared.
                  </p>
                  <p className="text-xs">
                    Requests are sent directly to the provider's servers.
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
