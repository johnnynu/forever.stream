/* eslint-disable @typescript-eslint/no-unused-vars */
import { useSearchParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Bookmark,
  Download,
  MoreVertical,
  Share,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import VideoPlayer from "./VideoPlayer";

export default function Watch() {
  const [searchParams] = useSearchParams();
  const videoId = searchParams.get("v")?.split(".")[0] || ""; // get video id without extension;
  const manifestUrl = videoId
    ? `https://storage.googleapis.com/foreverstream-processed-videos/${videoId}/manifest.mpd`
    : null;

  if (!manifestUrl) {
    return <div className="text-center p-4">Video not found</div>;
  }
  return (
    <div className="w-full bg-background">
      {/* Theater mode video container */}
      <div className="w-full bg-black min-h-[480px]">
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-full max-w-screen-2xl mx-auto">
            <div className="relative aspect-video">
              <VideoPlayer manifestUrl={manifestUrl} />
            </div>
          </div>
        </div>
      </div>

      {/* Video metadata and comments */}
      <div className="max-w-[1150px] mx-auto px-6">
        {/* Video title */}
        <h1 className="text-xl font-semibold mt-4">Untitled Video</h1>

        {/* Channel info and actions */}
        <div className="flex justify-between items-start mt-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/placeholder-avatar.png" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">Channel Name</h3>
              <p className="text-sm text-muted-foreground">0 subscribers</p>
            </div>
            <Button className="ml-4" variant="secondary">
              Subscribe
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted rounded-full">
              <Button variant="ghost" size="sm" className="rounded-l-full">
                <ThumbsUp className="mr-1 h-4 w-4" /> 0
              </Button>
              <Button variant="ghost" size="sm" className="rounded-r-full">
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="secondary" size="sm">
              <Share className="mr-2 h-4 w-4" /> Share
            </Button>
            <Button variant="secondary" size="sm">
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
            <Button variant="secondary" size="sm">
              <Bookmark className="mr-2 h-4 w-4" /> Save
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Video description */}
        <div className="mt-4 bg-muted rounded-xl p-3">
          <div className="flex gap-2 text-sm text-muted-foreground">
            <span>0 views</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(), { addSuffix: true })}</span>
          </div>
          <p className="mt-2 text-sm">No description available.</p>
        </div>

        {/* Comments section */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4">0 Comments</h2>

          {/* Comment input */}
          <div className="flex gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/placeholder-avatar.png" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Add a comment..."
                className="w-full bg-transparent border-b border-muted focus:border-foreground outline-none pb-1"
              />
            </div>
          </div>

          {/* Comments list */}
          <div className="mt-6 space-y-4">
            {/* Individual comments mapped here */}
          </div>
        </div>
      </div>
    </div>
  );
}
