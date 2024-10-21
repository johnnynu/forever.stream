import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { uploadVideo } from "../firebase/functions";
import { useRef, useState } from "react";

const Upload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    // Get the first file from the input
    const file = event.target.files?.item(0);

    if (file) {
      // Set uploading state to true when starting the upload
      setIsUploading(true);
      try {
        // Call the uploadVideo function with the selected file
        const res = await uploadVideo(file);
        // Alert the user of successful upload
        alert(`File uploaded successfully. Response: ${JSON.stringify(res)}`);
      } catch (error) {
        // Alert the user if the upload fails
        alert(`Failed to upload file: ${error}`);
      } finally {
        // Reset the uploading state when the process is complete
        setIsUploading(false);
      }
    }
  };
  return (
    <>
      <input
        ref={fileInputRef}
        id="upload"
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
        onClick={handleUpload}
      >
        {isUploading ? "Uploading..." : <Video className="h-5 w-5" />}
      </Button>
    </>
  );
};

export default Upload;
