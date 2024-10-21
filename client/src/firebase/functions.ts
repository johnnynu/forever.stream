import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();

const generateUploadUrl = httpsCallable(functions, "generateUploadUrl");

export const uploadVideo = async (file: File) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response: any = await generateUploadUrl({
    fileExtension: file.name.split(".").pop(),
  });

  // upload file via signed url
  await fetch(response?.data?.url, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  return;
};
