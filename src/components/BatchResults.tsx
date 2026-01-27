import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Check, Copy, Twitter } from "lucide-react";
import { TweetPreview } from "./TweetPreview";

interface BatchResultsProps {
  tweets: string[];
  onSelect: (tweet: string, index: number) => void;
  selectedIndex: number | null;
  onCopy: (tweet: string) => void;
  onTweet: (tweet: string) => void;
  copiedIndex: number | null;
}

export function BatchResults({
  tweets,
  onSelect,
  selectedIndex,
  onCopy,
  onTweet,
  copiedIndex,
}: BatchResultsProps) {
  if (tweets.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Choose your favorite ({tweets.length} options)
      </h3>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tweets.map((tweet, index) => {
          const isSelected = selectedIndex === index;
          const isCopied = copiedIndex === index;

          return (
            <Card
              key={index}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isSelected
                  ? "ring-2 ring-primary shadow-lg"
                  : "hover:ring-1 hover:ring-primary/50"
              }`}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Option number */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Option {index + 1}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>

                  {/* Tweet content */}
                  <div
                    className="text-sm whitespace-pre-wrap break-words min-h-[120px] p-3 bg-muted rounded cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => onSelect(tweet, index)}
                  >
                    {tweet}
                  </div>

                  {/* Character count */}
                  <div className="text-xs text-muted-foreground">
                    {tweet.length} characters
                    {tweet.length > 280 && (
                      <span className="text-red-500 ml-2">
                        ({tweet.length - 280} over limit)
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onCopy(tweet)}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
                      onClick={() => onTweet(tweet)}
                    >
                      <Twitter className="w-3 h-3 mr-1" />
                      Post
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selection hint */}
      {selectedIndex === null && (
        <p className="text-sm text-muted-foreground text-center">
          Click on any tweet to select it, or use the buttons to copy/post directly
        </p>
      )}
    </div>
  );
}
