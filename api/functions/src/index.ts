import * as functions from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { Firestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { Storage } from "@google-cloud/storage";
import { onCall } from "firebase-functions/v2/https";
import { TranscoderServiceClient } from "@google-cloud/video-transcoder";
import { onObjectFinalized } from "firebase-functions/v2/storage";

initializeApp();

const firestore = new Firestore();
const storage = new Storage();
const transcoderServiceClient = new TranscoderServiceClient();

const rawVideoBucketName = "foreverstream-raw-videos";
const processedVideoBucketName = "foreverstream-processed-videos";
const location = "us-central1";

const videoCollectionId = "videos";

interface UploadRequest {
  fileExtension: string;
  metadata: {
    title: string;
    description: string;
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

export const createTranscodingJob = onObjectFinalized(
  {
    bucket: rawVideoBucketName,
    region: location,
  },
  async (object) => {
    const videoId = object.data.name.split(".")[0];

    try {
      const inputUri = `gs://${object.data.bucket}/${object.data.name}`;
      const outputUri = `gs://${processedVideoBucketName}/${videoId}/`;

      const request = {
        parent: transcoderServiceClient.locationPath(
          process.env.GOOGLE_CLOUD_PROJECT_ID! ||
            functions.config().google.project_id,
          location
        ),
        job: {
          inputUri: inputUri,
          outputUri: outputUri,
          config: {
            elementaryStreams: [
              {
                key: "video-sd",
                videoStream: {
                  h264: {
                    heightPixels: 360,
                    widthPixels: 640,
                    bitrateBps: 550000,
                    frameRate: 60,
                  },
                },
              },
              {
                key: "video-hd",
                videoStream: {
                  h264: {
                    heightPixels: 720,
                    widthPixels: 1280,
                    bitrateBps: 2500000,
                    frameRate: 60,
                  },
                },
              },
              {
                key: "audio-stream",
                audioStream: {
                  codec: "aac",
                  bitrateBps: 64000,
                },
              },
            ],
            muxStreams: [
              {
                key: "sd",
                container: "fmp4",
                elementaryStreams: ["video-sd"],
              },
              {
                key: "hd",
                container: "fmp4",
                elementaryStreams: ["video-hd"],
              },
              {
                key: "audio",
                container: "fmp4",
                elementaryStreams: ["audio-stream"],
              },
            ],
            manifests: [
              {
                fileName: "manifest.mpd",
                type: "DASH",
                muxStreams: ["sd", "hd", "audio"],
              },
            ],
          },
        },
      } as any;

      const response = await transcoderServiceClient.createJob(request);

      // Update Firestore
      await firestore.collection(videoCollectionId).doc(videoId).update({
        status: "processing",
        transcodingJobId: response[0].name,
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
        .collection("videos")
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
