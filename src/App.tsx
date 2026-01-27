import { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Select } from "./components/ui/select";
import { generateTweet, getCurrentProvider } from "./lib/api";
import {
  saveToHistory,
  toggleFavorite,
  type SavedTweet,
} from "./lib/history";
import { useKeyboardShortcuts } from "./lib/useKeyboardShortcuts";
import { HistoryPanel } from "./components/HistoryPanel";
import { TweetPreview } from "./components/TweetPreview";
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

  // New state for features
  const [showHistory, setShowHistory] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [currentTweetId, setCurrentTweetId] = useState<string>("");

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: "Enter",
      ctrlKey: true,
      metaKey: true,
      action: () => {
        if (topic.trim() && !loading) {
          handleGenerate();
        }
      },
      description: "Generate Tweet",
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
        if (generatedTweet && !loading) {
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
      key: "Escape",
      action: () => {
        if (showHistory) setShowHistory(false);
      },
      description: "Close Dialog",
    },
  ]);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic");
      return;
    }

    setLoading(true);
    setError("");
    setGeneratedTweet("");

    try {
      const response = await generateTweet({
        topic,
        style,
        includeHashtags,
        includeEmojis,
      });

      if (response.error) {
        setError(response.error);
      } else {
        setGeneratedTweet(response.tweet);
        // Save to history
        const newTweet: SavedTweet = {
          id: Date.now().toString(),
          content: response.tweet,
          topic,
          style,
          timestamp: Date.now(),
          favorite: false,
        };
        saveToHistory(newTweet);
        setCurrentTweetId(newTweet.id);
      }
    } catch (err) {
      setError("Failed to generate tweet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedTweet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTweet = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(generatedTweet)}`;
    window.open(url, "_blank");
  };

  const handleFavorite = () => {
    if (currentTweetId) {
      toggleFavorite(currentTweetId);
    }
  };

  const currentProvider = getCurrentProvider();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">AI Tweet Generator</h1>
          </div>
          <div className="flex items-center gap-2">
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
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Input */}
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Create Viral Tweets with AI
              </h2>
              <p className="text-muted-foreground text-lg">
                Generate engaging tweets in seconds using multiple AI providers
              </p>
            </div>

            {/* Input Card */}
            <Card className="border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle>Generate Your Tweet</CardTitle>
                <CardDescription>
                  Enter a topic and customize your tweet style
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
                    placeholder="e.g., React tips, AI development, productivity hacks..."
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

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={loading || !topic.trim()}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Tweet
                    </>
                  )}
                </Button>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                    {error}
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
                  <div><kbd className="px-1.5 py-0.5 bg-background border rounded">Ctrl+C</kbd> Copy</div>
                  <div><kbd className="px-1.5 py-0.5 bg-background border rounded">Ctrl+R</kbd> Regenerate</div>
                  <div><kbd className="px-1.5 py-0.5 bg-background border rounded">Ctrl+H</kbd> History</div>
                  <div><kbd className="px-1.5 py-0.5 bg-background border rounded">Ctrl+P</kbd> Toggle Preview</div>
                  <div><kbd className="px-1.5 py-0.5 bg-background border rounded">Esc</kbd> Close dialog</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Preview & Result */}
          <div className="space-y-8">
            {/* Tweet Preview */}
            {showPreview && generatedTweet && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Live Preview</h3>
                <TweetPreview content={generatedTweet} />
              </div>
            )}

            {/* Result Card */}
            {generatedTweet && (
              <Card className="border-primary/20 shadow-lg">
                <CardHeader>
                  <CardTitle>Your Generated Tweet</CardTitle>
                  <CardDescription>
                    Copy it, tweet it directly, or regenerate with different settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-6 bg-muted rounded-lg border">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {generatedTweet}
                    </p>
                    <div className="mt-4 text-xs text-muted-foreground flex justify-between">
                      <span>{generatedTweet.length} characters</span>
                      <span
                        className={
                          generatedTweet.length > 280
                            ? "text-red-500"
                            : generatedTweet.length > 260
                            ? "text-yellow-500"
                            : "text-green-500"
                        }
                      >
                        {generatedTweet.length > 280
                          ? `-${generatedTweet.length - 280} over limit`
                          : `${280 - generatedTweet.length} remaining`}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleCopy}
                      variant="outline"
                      className="flex-1"
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
                      onClick={handleTweet}
                      className="flex-1 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
                    >
                      <Twitter className="mr-2 h-4 w-4" />
                      Post
                    </Button>
                    <Button
                      onClick={handleGenerate}
                      variant="outline"
                      disabled={loading}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
                    <Button
                      onClick={handleFavorite}
                      variant="outline"
                      size="icon"
                      title="Save to favorites"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
                    <strong className="text-foreground">Features:</strong> Live preview,
                    history with favorites, keyboard shortcuts, viral tweet generation,
                    multiple styles, hashtag and emoji options, and Twitter thread support
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
          // Extract a topic from the content for the new tweet ID
          const words = content.split(" ").slice(0, 3).join(" ");
          setTopic(words);
        }}
      />
    </div>
  );
}

export default App;
