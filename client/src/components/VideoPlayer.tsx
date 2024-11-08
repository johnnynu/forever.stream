import React, { useEffect, useRef, useState } from "react";
import dashjs from "dashjs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings } from "lucide-react";

interface VideoPlayerProps {
  manifestUrl: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ manifestUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<dashjs.MediaPlayerClass>();
  const [currentQuality, setCurrentQuality] = useState<
    "auto" | "720p" | "360p"
  >("auto");

  useEffect(() => {
    if (!videoRef.current) return;

    const player = dashjs.MediaPlayer().create();
    playerRef.current = player;

    player.updateSettings({
      streaming: {
        buffer: {
          fastSwitchEnabled: true,
          bufferTimeAtTopQuality: 12,
        },
        abr: {
          autoSwitchBitrate: {
            video: true,
            audio: true,
          },
          ABRStrategy: "abrDynamic",
        },
      },
    });

    player.initialize(videoRef.current, manifestUrl, true);

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = undefined;
      }
    };
  }, [manifestUrl]);

  return (
    <div className="relative w-full aspect-video bg-black group">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        crossOrigin="anonymous"
      />

      {/* Quality selection button */}
      <div className="absolute bottom-14 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/60 hover:bg-black/80 text-white"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-black/90 text-white border-gray-800"
          >
            <DropdownMenuItem
              className={currentQuality === "auto" ? "text-blue-400" : ""}
              onClick={() => {
                playerRef.current?.updateSettings({
                  streaming: { abr: { autoSwitchBitrate: { video: true } } },
                });
                setCurrentQuality("auto");
              }}
            >
              Auto
            </DropdownMenuItem>
            <DropdownMenuItem
              className={currentQuality === "720p" ? "text-blue-400" : ""}
              onClick={() => {
                if (!playerRef.current) return;
                playerRef.current.updateSettings({
                  streaming: { abr: { autoSwitchBitrate: { video: false } } },
                });
                playerRef.current.setQualityFor("video", 1);
                setCurrentQuality("720p");
              }}
            >
              720p
            </DropdownMenuItem>
            <DropdownMenuItem
              className={currentQuality === "360p" ? "text-blue-400" : ""}
              onClick={() => {
                if (!playerRef.current) return;
                playerRef.current.updateSettings({
                  streaming: { abr: { autoSwitchBitrate: { video: false } } },
                });
                playerRef.current.setQualityFor("video", 0);
                setCurrentQuality("360p");
              }}
            >
              360p
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default VideoPlayer;
