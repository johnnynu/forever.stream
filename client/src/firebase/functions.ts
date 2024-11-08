import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

const generateUploadUrl = httpsCallable(functions, "generateUploadUrl");
const getVideosFunction = httpsCallable(functions, "getVideos");

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

export interface VideoMetadata {
  title: string;
  description: string;
}

export const uploadVideo = async (file: File, metadata: VideoMetadata) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await generateUploadUrl({
      fileExtension: file.name.split(".").pop(),
      metadata: {
        title: metadata.title,
        description: metadata.description,
      },
    });

    const { url, fileName } = response.data;

    // upload file via signed url
    await fetch(url, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    return fileName;
  } catch (error) {
    console.error("Error in upload process: ", error);
    throw error;
  }
};

export const getVideos = async () => {
  const response = await getVideosFunction();
  return response.data as Video[];
};
