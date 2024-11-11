import {
  TranscoderServiceClient,
  protos,
} from "@google-cloud/video-transcoder";

interface Resolution {
  width: number;
  height: number;
  bitrate: number;
}

const STANDARD_RESOLUTIONS: Resolution[] = [
  { width: 3840, height: 2160, bitrate: 16000000 }, // 4K
  { width: 2560, height: 1440, bitrate: 8000000 }, // 2K
  { width: 1920, height: 1080, bitrate: 4500000 }, // 1080p
  { width: 1280, height: 720, bitrate: 2500000 }, // 720p
  { width: 854, height: 480, bitrate: 1000000 }, // 480p
];

function getTargetResolutions(
  inputWidth: number,
  inputHeight: number
): Resolution[] {
  // sort res from highest to lowest
  const sortedResolutions = [...STANDARD_RESOLUTIONS].sort(
    (a, b) => b.height - a.height
  );

  // find highest res thats <= input
  const targetResolutions = sortedResolutions.filter(
    (res) => res.height <= inputHeight && res.width <= inputWidth
  );

  // always include 480p as min quality
  if (!targetResolutions.find((res) => res.height === 480)) {
    targetResolutions.push(
      STANDARD_RESOLUTIONS[STANDARD_RESOLUTIONS.length - 1]
    );
  }

  return targetResolutions;
}

function createElementaryStreams(resolutions: Resolution[]) {
  const streams: protos.google.cloud.video.transcoder.v1.IElementaryStream[] =
    [];

  // add video streams for each valid res
  resolutions.forEach((res, index) => {
    streams.push({
      key: `video-${res.height}p`,
      videoStream: {
        h264: {
          heightPixels: res.height,
          widthPixels: res.width,
          bitrateBps: res.bitrate,
          frameRate: 60,
          profile: "high",
          preset: "veryfast",
          rateControlMode: "vbr",
          tune: "zerolatency",
        },
      },
    });
  });

  // add audio stream
  streams.push({
    key: "audio-stream",
    audioStream: {
      codec: "aac",
      bitrateBps: 128000, // 128 kbps
      sampleRateHertz: 48000,
    },
  });

  return streams;
}

// create mux streams for each res
function createMuxStreams(resolutions: Resolution[]) {
  const streams: protos.google.cloud.video.transcoder.v1.IMuxStream[] = [];

  resolutions.forEach((res) => {
    streams.push({
      key: `${res.height}p`,
      container: "fmp4",
      elementaryStreams: [`video-${res.height}p`],
    });
  });

  streams.push({
    key: "audio",
    container: "fmp4",
    elementaryStreams: ["audio-stream"],
  });

  return streams;
}

export async function createTranscodingJob(
  projectId: string,
  location: string,
  inputUri: string,
  outputUri: string,
  inputWidth: number,
  inputHeight: number
) {
  const client = new TranscoderServiceClient();

  // get res based on input video
  const targetResolutions = getTargetResolutions(inputWidth, inputHeight);

  // Create job
  const config = {
    elementaryStreams: createElementaryStreams(targetResolutions),
    muxStreams: createMuxStreams(targetResolutions),
    manifests: [
      {
        fileName: "manifest.mpd",
        type: "DASH",
        muxStreams: [
          ...targetResolutions.map((res) => `${res.height}p`),
          "audio",
        ],
      },
    ],
  };

  const request = {
    parent: client.locationPath(projectId, location),
    job: {
      inputUri,
      outputUri,
      config,
    },
  } as any;

  return client.createJob(request);
}
