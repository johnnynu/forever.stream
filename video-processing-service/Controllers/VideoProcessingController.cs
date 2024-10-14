using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace video_processing_service.Controllers
{
    [ApiController]
    [Route("")]
    public class VideoProcessingController : ControllerBase
    {
        private readonly ILogger<VideoProcessingController> _logger;
        private readonly StorageService _storageService;

        public VideoProcessingController(ILogger<VideoProcessingController> logger, StorageService storageService)
        {
            _logger = logger;
            _storageService = storageService;
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

            Console.WriteLine($"Deserialized data - Name: {data?.Name}, Bucket: {data?.Bucket}, Size: {data?.Size}");

            if (string.IsNullOrEmpty(data?.Name))
            {
                return BadRequest("Missing filename in message data");
            }

            string inputFileName = data.Name;
            string outputFileName = $"processed-{inputFileName}";

            try
            {
                // Process the video (download, convert, upload)
                await _storageService.DownloadRawVideoAsync(inputFileName);
                Console.WriteLine($"Downloaded raw video: {inputFileName}");
                await _storageService.ConvertVideoAsync(inputFileName, outputFileName);
                Console.WriteLine($"Converted video: {inputFileName} to {outputFileName}");
                await _storageService.UploadProcessedVideoAsync(outputFileName);
                Console.WriteLine($"Uploaded processed video: {outputFileName}");

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