import { getVideos } from "@/firebase/functions";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface Video {
  id?: string;
  uid?: string;
  fileName?: string;
  status?: "processing" | "processed";
  title?: string;
  description?: string;
  uploadedAt?: string;
  processedAt?: string;
}

const VideoCard = ({ video }: { video: Video }) => {
  // Format the date using date-fns
  const uploadTime = video.uploadedAt
    ? formatDistanceToNow(new Date(video.uploadedAt), { addSuffix: true })
    : "recently";

  return (
    <Card className="overflow-hidden bg-background border-0 shadow-none">
      <CardContent className="p-0">
        <Link to={`/watch?v=${video.fileName}`} className="space-y-3">
          {/* Video Thumbnail */}
          <div className="aspect-video relative rounded-xl overflow-hidden bg-muted">
            <img
              src="/thumbnail.png"
              alt={video.title || "Video thumbnail"}
              className="object-cover w-full h-full transition-transform hover:scale-105 duration-200"
            />
            {video.status === "processing" && (
              <div className="absolute bottom-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                Processing
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="space-y-1 px-1">
            <h3 className="font-medium leading-tight text-base line-clamp-2">
              {video.title || "Untitled Video"}
            </h3>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              <span>{video.uid || "Anonymous"}</span>
              <div className="flex items-center gap-1">
                <span>Uploaded {uploadTime}</span>
              </div>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
};

const VideoCardSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="aspect-video w-full rounded-xl" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  </div>
);

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const fetchedVideos = await getVideos();
        setVideos(fetchedVideos);
      } catch (error) {
        setError("Failed to load videos");
        console.error("Error fetching videos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }
  return (
    <main className="container mx-auto pt-20 px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
        {loading
          ? Array(12)
              .fill(0)
              .map((_, i) => (
                <div key={i}>
                  <VideoCardSkeleton />
                </div>
              ))
          : videos.map((video) => <VideoCard key={video.id} video={video} />)}
      </div>
    </main>
  );
}
