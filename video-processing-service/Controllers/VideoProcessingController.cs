using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using video_processing_service.Models;
using video_processing_service.Services;

namespace video_processing_service.Controllers
{
    [ApiController]
    [Route("")]
    public class VideoProcessingController : ControllerBase
    {
        private readonly ILogger<VideoProcessingController> _logger;
        private readonly StorageService _storageService;
        private readonly FirestoreService _firestoreService;

        public VideoProcessingController(ILogger<VideoProcessingController> logger, StorageService storageService, FirestoreService firestoreService)
        {
            _logger = logger;
            _storageService = storageService;
            _firestoreService = firestoreService;
        }

        [HttpPost("process-video")]
        public async Task<IActionResult> ProcessVideo([FromBody] PubSubMessage message)
        {
            if (message?.Message?.Data == null)
            {
                return BadRequest("Invalid message format");
            }

            string decodedData = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(message.Message.Data));
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
            };
            var data = JsonSerializer.Deserialize<PubSubData>(decodedData, options);

            if (string.IsNullOrEmpty(data?.Name))
            {
                return BadRequest("Missing filename in message data");
            }

            string inputFileName = data.Name;
            string outputFileName = $"processed-{inputFileName}";
            string videoId = Path.GetFileNameWithoutExtension(inputFileName);

            try
            {
                // Check if video is already being processed or has been processed
                if (!await _firestoreService.IsVideoNew(videoId))
                {
                    return BadRequest("Video is already processing or has been processed");
                }

                // Set initial processing status
                await _firestoreService.SetVideo(videoId, new Video
                {
                    Id = videoId,
                    Uid = videoId.Split('-')[0],
                    Status = "processing"
                });

                // Process the video (download, convert, upload)
                await _storageService.DownloadRawVideoAsync(inputFileName);
                Console.WriteLine($"Downloaded raw video: {inputFileName}");
                await _storageService.ConvertVideoAsync(inputFileName, outputFileName);
                Console.WriteLine($"Converted video: {inputFileName} to {outputFileName}");
                await _storageService.UploadProcessedVideoAsync(outputFileName);
                Console.WriteLine($"Uploaded processed video: {outputFileName}");

                // Update status to processed
                Console.WriteLine("About to update video status");
                await _firestoreService.UpdateVideo(videoId, new Dictionary<string, object>
                {
                    {"Status", "processed"},
                    {"Filename", outputFileName},
                });
                Console.WriteLine("Successfully updated video status");

                // Clean up local files
                _storageService.DeleteRawVideo(inputFileName);
                _storageService.DeleteProcessedVideo(outputFileName);
                Console.WriteLine("Cleaned up local files");

                return Ok("Processing finished successfully");
            }
            catch (Exception ex)
            {

                _logger.LogError(ex, "Error processing video");

                // Clean up local files in case of error
                _storageService.DeleteRawVideo(inputFileName);
                _storageService.DeleteProcessedVideo(outputFileName);

                return StatusCode(500, "An error occured while processing the video");
            }
        }
    }

    public class PubSubMessage
    {
        public PubSubMessageData? Message { get; set; }
        public string? Subscription { get; set; }
    }

    public class PubSubMessageData
    {
        public Dictionary<string, string>? Attributes { get; set; }
        public string? Data { get; set; }
        public string? MessageId { get; set; }
        public string? PublishTime { get; set; }
    }

    public class PubSubData
    {
        public required string Kind { get; set; }
        public required string Id { get; set; }
        public required string SelfLink { get; set; }
        public required string Name { get; set; }
        public required string Bucket { get; set; }
        public required string Generation { get; set; }
        public required string Metageneration { get; set; }
        public required string ContentType { get; set; }
        public required string TimeCreated { get; set; }
        public required string Updated { get; set; }
        public required string StorageClass { get; set; }
        public required string TimeStorageClassUpdated { get; set; }
        public required string Size { get; set; }
        public required string Md5Hash { get; set; }
        public required string MediaLink { get; set; }
        public required string Crc32c { get; set; }
        public required string Etag { get; set; }
    }
}