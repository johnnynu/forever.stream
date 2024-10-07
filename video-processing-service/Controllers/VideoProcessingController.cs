using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using FFMpegCore;
using FFMpegCore.Enums;

namespace video_processing_service.Controllers
{
    [ApiController]
    [Route("")]
    public class VideoProcessingController : ControllerBase
    {
        private readonly ILogger<VideoProcessingController> _logger;

        public VideoProcessingController(ILogger<VideoProcessingController> logger)
        {
            _logger = logger;
        }

        [HttpPost("process-video")]
        public async Task<IActionResult> ProcessVideo([FromBody] VideoProcessingRequest request)
        {
            // Check if the input file path is defined
            if (string.IsNullOrEmpty(request.InputFilePath) || string.IsNullOrEmpty(request.OutputFilePath))
            {
                return BadRequest("Missing file path");
            }

            try
            {
                // Create the FFmpeg command
                bool success = await FFMpegArguments
                    .FromFileInput(request.InputFilePath)
                    .OutputToFile(request.OutputFilePath, true, options => options
                        .WithVideoCodec(VideoCodec.LibX264)
                        .WithConstantRateFactor(23)
                        .WithAudioCodec(AudioCodec.Aac)
                        .WithVariableBitrate(4)
                        .WithVideoFilters(filterOptions => filterOptions
                            .Scale(VideoSize.FullHd))
                        .WithFastStart())
                    .ProcessAsynchronously();

                if (success)
                {
                    _logger.LogInformation("Processing finished successfully");
                    return Ok("Video processing completed successfully");
                }
                else
                {
                    _logger.LogError("Processing failed");
                    return StatusCode(500, "Video processing failed");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"An error occurred: {ex.Message}");
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }
    }

    public class VideoProcessingRequest
    {
        public required string InputFilePath { get; set; }
        public required string OutputFilePath { get; set; }
    }
}