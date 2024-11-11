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

interface QualityOption {
  bitrate: number;
  height: number;
  qualityIndex: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ manifestUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<dashjs.MediaPlayerClass>();
  const [currentQuality, setCurrentQuality] = useState<string>("auto");
  const [qualities, setQualities] = useState<QualityOption[]>([]);

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

    // get available qualities once stream is init
    player.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
      const videoQualities = player.getBitrateInfoListFor("video");
      if (videoQualities) {
        const formattedQualities = videoQualities
          .map((quality, index) => ({
            bitrate: quality.bitrate,
            height: quality.height,
            qualityIndex: index,
          }))
          .sort((a, b) => b.height - a.height); // sort by height, highest first

        setQualities(formattedQualities);
        console.log("Available qualities: ", formattedQualities);
      }
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = undefined;
      }
    };
  }, [manifestUrl]);

  const handleQualityChange = (quality: string, qualityIndex?: number) => {
    if (!playerRef.current) return;

    if (quality === "auto") {
      playerRef.current.updateSettings({
        streaming: { abr: { autoSwitchBitrate: { video: true } } },
      });
    } else if (qualityIndex !== undefined) {
      playerRef.current.updateSettings({
        streaming: { abr: { autoSwitchBitrate: { video: false } } },
      });
    }

    setCurrentQuality(quality);
  };

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
              onClick={() => handleQualityChange("auto")}
            >
              Auto
            </DropdownMenuItem>
            {qualities.map((quality) => (
              <DropdownMenuItem
                key={quality.height}
                className={
                  currentQuality === `${quality.height}p` ? "text-blue-400" : ""
                }
                onClick={() =>
                  handleQualityChange(
                    `${quality.height}p`,
                    quality.qualityIndex
                  )
                }
              >
                {quality.height}p
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default VideoPlayer;
