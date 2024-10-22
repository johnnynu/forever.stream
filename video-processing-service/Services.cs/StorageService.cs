using Google.Cloud.Storage.V1;
using Google.Apis.Auth.OAuth2;
using System;
using System.IO;
using System.Threading.Tasks;
using FFMpegCore;
using FFMpegCore.Enums;

namespace video_processing_service.Services
{
    public class StorageService
    {
        private readonly StorageClient _storageClient;
        private const string RawVideoBucketName = "foreverstream-raw-videos";
        private const string ProcessedVideoBucketName = "foreverstream-processed-videos";
        private const string LocalRawVideoPath = "./raw-videos";
        private const String LocalProcessedVideoPath = "./processed-videos";


        public StorageService()
        {
            // Initialize StorageClient
            _storageClient = StorageClient.Create();
        }

        // Create local directories
        public void SetupDirectories()
        {
            Directory.CreateDirectory(LocalRawVideoPath);
            Directory.CreateDirectory(LocalProcessedVideoPath);
        }

        public async Task DownloadRawVideoAsync(string fileName)
        {
            using var outputStream = File.Create(Path.Combine(LocalRawVideoPath, fileName));
            await _storageClient.DownloadObjectAsync(RawVideoBucketName, fileName, outputStream);
            Console.WriteLine($"gs://{RawVideoBucketName}/{fileName} downloaded to {LocalRawVideoPath}/{fileName}.");
        }

        public async Task UploadProcessedVideoAsync(string fileName)
        {
            using var inputStream = File.OpenRead(Path.Combine(LocalProcessedVideoPath, fileName));
            var obj = await _storageClient.UploadObjectAsync(ProcessedVideoBucketName, fileName, null, inputStream);

            // Set the video to be publicly readable
            await _storageClient.UpdateObjectAsync(obj, new UpdateObjectOptions
            {
                PredefinedAcl = PredefinedObjectAcl.PublicRead
            });

            Console.WriteLine($"gs://{LocalProcessedVideoPath}/{fileName} uploaded to gs://{ProcessedVideoBucketName}/{fileName}.");
        }

        public async Task ConvertVideoAsync(string rawVideoName, string processedVideoName)
        {
            string inputPath = Path.Combine(LocalRawVideoPath, rawVideoName);
            string outputPath = Path.Combine(LocalProcessedVideoPath, processedVideoName);

            await FFMpegArguments
                    .FromFileInput(inputPath)
                    .OutputToFile(outputPath, true, options => options
                        .WithVideoCodec(VideoCodec.LibX264)
                        .WithConstantRateFactor(23)
                        .WithAudioCodec(AudioCodec.Aac)
                        .WithVariableBitrate(4)
                        .WithVideoFilters(filterOptions => filterOptions
                            .Scale(VideoSize.FullHd))
                        .WithFastStart())
                    .ProcessAsynchronously();

            Console.WriteLine("Processing finished successfully");
        }

        public void DeleteRawVideo(string fileName)
        {
            string filePath = Path.Combine(LocalRawVideoPath, fileName);
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                Console.WriteLine($"{filePath} deleted");
            }
            else
            {
                Console.WriteLine($"File not found at {filePath}");
            }
        }

        public void DeleteProcessedVideo(string fileName)
        {
            string filePath = Path.Combine(LocalProcessedVideoPath, fileName);
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                Console.WriteLine($"{fileName} deleted");
            }
            else
            {
                Console.WriteLine($"File not found at {filePath}");
            }
        }
    }
}