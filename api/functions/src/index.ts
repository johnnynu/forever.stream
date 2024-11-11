import * as functions from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { Firestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { Storage } from "@google-cloud/storage";
import { onCall } from "firebase-functions/v2/https";
import { onObjectFinalized } from "firebase-functions/v2/storage";
import { createTranscodingJob } from "./transcoding";

initializeApp();

const firestore = new Firestore();
const storage = new Storage();

const rawVideoBucketName = "foreverstream-raw-videos";
const processedVideoBucketName = "foreverstream-processed-videos";
const location = "us-central1";

const videoCollectionId = "videos";

interface UploadRequest {
  fileExtension: string;
  metadata: {
    title: string;
    description: string;
    width: number;
    height: number;
  };
}

export const createUser = functions.auth.user().onCreate((user) => {
  const userInfo = {
    uid: user.uid,
    email: user.email,
    photoUrl: user.photoURL,
  };

  firestore.collection("users").doc(user.uid).set(userInfo);
  logger.info(`User Created: ${JSON.stringify(userInfo)}`);
  return;
});

export const generateUploadUrl = onCall(
  { maxInstances: 1 },
  async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "The function must be called while authenticated"
      );
    }

    const timestamp = Date.now();

    const auth = request.auth;
    const data = request.data as UploadRequest;
    const bucket = storage.bucket(rawVideoBucketName);
    const fileName = `${auth.uid}-${timestamp}.${data.fileExtension}`;
    const documentId = `${auth.uid}-${timestamp}`;
    const file = bucket.file(fileName);

    const videoDoc = {
      id: documentId,
      uid: auth.uid,
      fileName: fileName,
      status: "uploaded",
      title: data.metadata.title,
      description: data.metadata.description,
      width: data.metadata.width,
      height: data.metadata.height,
      UploadedAt: new Date().toISOString(),
    };

    await firestore.collection(videoCollectionId).doc(documentId).set(videoDoc);
    logger.info(`Created Firestore document with ID: ${documentId}`);

    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    logger.info(`Generated upload URL for ${fileName}`);

    return { url, fileName, documentId };
  }
);

export const getVideos = onCall({ maxInstances: 1 }, async () => {
  const snapshot = await firestore
    .collection(videoCollectionId)
    .limit(10)
    .get();
  return snapshot.docs.map((doc) => doc.data());
});

export const createTranscodingJobFunction = onObjectFinalized(
  {
    bucket: rawVideoBucketName,
    region: location,
  },
  async (object) => {
    const videoId = object.data.name.split(".")[0];

    try {
      const inputUri = `gs://${object.data.bucket}/${object.data.name}`;
      const outputUri = `gs://${processedVideoBucketName}/${videoId}/`;

      const videoDoc = await firestore
        .collection(videoCollectionId)
        .doc(videoId)
        .get();
      const videoData = videoDoc.data();

      if (!videoData?.width || !videoData?.height) {
        throw new Error("Video dimensions not found in metadata");
      }

      const width = parseInt(videoData.width);
      const height = parseInt(videoData.height);

      await createTranscodingJob(
        process.env.GOOGLE_CLOUD_PROJECT_ID!,
        location,
        inputUri,
        outputUri,
        width,
        height
      );

      // Update Firestore
      await firestore
        .collection(videoCollectionId)
        .doc(videoId)
        .update({
          status: "processing",
          inputResolution: `${width}x${height}`,
        });
    } catch (error: any) {
      console.error("Error creating transcoding job:", error);
      await firestore.collection(videoCollectionId).doc(videoId).update({
        status: "error",
        error: error.message,
      });
      throw error;
    }
  }
);

export const handleTranscodedVideo = onObjectFinalized(
  {
    bucket: processedVideoBucketName,
    region: location,
  },
  async (object) => {
    console.log("File created in processed bucket:", object.data.name);
    // Only proceed if this is a manifest file
    if (!object.data.name.endsWith("manifest.mpd")) return;

    const videoId = object.data.name.split("/")[0];

    try {
      // Update the video document in Firestore
      await firestore
        .collection(videoCollectionId)
        .doc(videoId)
        .update({
          status: "processed",
          processedUrl: `https://storage.googleapis.com/${processedVideoBucketName}/${videoId}/manifest.mpd`,
          processedAt: new Date().toISOString(),
        });

      console.log(`Updated video ${videoId} status to processed`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      console.error("Error updating transcoded video status:", errorMessage);
      await firestore.collection(videoCollectionId).doc(videoId).update({
        status: "error",
        error: errorMessage,
      });
      throw error;
    }
  }
);
