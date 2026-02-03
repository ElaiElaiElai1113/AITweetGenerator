import { Card } from "./ui/card";
import { BadgeCheck } from "lucide-react";

interface TweetPreviewProps {
  content: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
}

export function TweetPreview({
  content,
  username = "yourhandle",
  displayName = "Your Name",
}: TweetPreviewProps) {
  // Parse tweet content for links, hashtags, mentions
  const parseContent = (text: string) => {
    // Escape HTML first
    let parsed = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Links
    parsed = parsed.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" class="text-[#1d9bf0] hover:underline" target="_blank" rel="noopener">$1</a>'
    );

    // Hashtags
    parsed = parsed.replace(
      /(#\w+)/g,
      '<span class="text-[#1d9bf0] hover:underline cursor-pointer">$1</span>'
    );

    // Mentions
    parsed = parsed.replace(
      /(@\w+)/g,
      '<span class="text-[#1d9bf0] hover:underline cursor-pointer">$1</span>'
    );

    return parsed;
  };

  // Process thread format
  const isThread = content.includes("1/") || content.includes("1/");
  const tweets = content
    .split(/\d+\/\d+\s*/)
    .filter((t) => t.trim().length > 0);

  const characterCount = content.length;
  const getCharacterColor = () => {
    if (characterCount > 280) return "text-red-500";
    if (characterCount > 260) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <Card className="overflow-hidden bg-white dark:bg-black border-gray-200 dark:border-gray-800">
      <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-3 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Twitter Preview
          </span>
          <span className={`text-xs font-medium ${getCharacterColor()}`}>
            {characterCount}/280
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {isThread ? (
          <>
            {tweets.map((tweet, index) => (
              <div key={index} className="flex gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="font-bold text-gray-900 dark:text-white text-[15px]">
                      {displayName}
                    </span>
                    <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500" />
                    <span className="text-gray-500 dark:text-gray-400 text-[15px]">
                      @{username}
                    </span>
                    {index > 0 && (
                      <span className="text-gray-500 dark:text-gray-400 text-[15px]">
                        · Showing thread
                      </span>
                    )}
                  </div>
                  <div
                    className="text-[15px] text-gray-900 dark:text-white whitespace-pre-wrap break-words mt-1"
                    dangerouslySetInnerHTML={{
                      __html: parseContent(
                        index === 0 && tweets.length > 1
                          ? `${tweet}\n\n🧵 ${tweets.length}/${tweets.length}`
                          : tweet
                      ),
                    }}
                  />
                </div>
              </div>
            ))}
            {tweets.length > 1 && (
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2">
                <span className="font-medium">{tweets.length}</span> tweets in
                thread
              </div>
            )}
          </>
        ) : (
          <div className="flex gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="font-bold text-gray-900 dark:text-white text-[15px]">
                  {displayName}
                </span>
                <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500" />
                <span className="text-gray-500 dark:text-gray-400 text-[15px]">
                  @{username}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-[15px]">
                  · Now
                </span>
              </div>
              <div
                className="text-[15px] text-gray-900 dark:text-white whitespace-pre-wrap break-words mt-1"
                dangerouslySetInnerHTML={{ __html: parseContent(content) }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action bar (visual only) */}
      <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-16 text-sm">
          <span className="hover:text-blue-500 cursor-pointer flex items-center gap-2">
            💬 <span className="hidden">Reply</span>
          </span>
          <span className="hover:text-green-500 cursor-pointer flex items-center gap-2">
            🔄 <span className="hidden">Retweet</span>
          </span>
          <span className="hover:text-red-500 cursor-pointer flex items-center gap-2">
            ❤️ <span className="hidden">Like</span>
          </span>
          <span className="hover:text-blue-500 cursor-pointer flex items-center gap-2">
            🔗 <span className="hidden">Share</span>
          </span>
        </div>
      </div>
    </Card>
  );
}
