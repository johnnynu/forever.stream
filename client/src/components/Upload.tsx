import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { uploadVideo } from "../firebase/functions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const Upload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [showMetadataDialog, setShowMetadataDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState({
    title: "",
    description: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    // Get the first file from the input
    const file = event.target.files?.item(0);

    if (file) {
      // Set uploading state to true when starting the upload
      setSelectedFile(file);
      setShowMetadataDialog(true);
      // Reset metadata form
      setMetadata({
        title: file.name.split(".")[0], // use filename as default
        description: "",
      });
    }
  };

  const handleMetadataSubmit = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      await uploadVideo(selectedFile, metadata);
      alert("Video uploaded successfully!");
    } catch (error) {
      alert(`Failed to upload video: ${error}`);
    } finally {
      setIsUploading(false);
      setShowMetadataDialog(false);
      setSelectedFile(null);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <Button
        variant="ghost"
        size="icon"
        className="hidden sm:inline-flex"
        disabled={isUploading}
        onClick={handleFileSelect}
      >
        {isUploading ? "Uploading..." : <Video className="h-5 w-5" />}
      </Button>

      <Dialog open={showMetadataDialog} onOpenChange={setShowMetadataDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload Video</DialogTitle>
            <DialogDescription>
              Add details about your video to help viewers find it.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={metadata.title}
                onChange={(e) =>
                  setMetadata({ ...metadata, title: e.target.value })
                }
                placeholder="Enter video title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={metadata.description}
                onChange={(e) =>
                  setMetadata({ ...metadata, description: e.target.value })
                }
                placeholder="Tell viewers about your video"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowMetadataDialog(false);
                setSelectedFile(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleMetadataSubmit} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload Video"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Upload;
