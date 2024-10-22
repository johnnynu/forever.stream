using System.Reflection.Metadata;
using Google.Cloud.Firestore;
using video_processing_service.Models;

namespace video_processing_service.Services
{
    public class FirestoreService
    {
        private readonly FirestoreDb _firestoreDb;
        private const string VideoCollectionId = "videos";

        public FirestoreService()
        {
            _firestoreDb = FirestoreDb.Create(GetProjectId());
        }

        private string GetProjectId()
        {
            string? projectId = Environment.GetEnvironmentVariable("GOOGLE_CLOUD_PROJECT_ID");
            if (string.IsNullOrEmpty(projectId))
            {
                throw new InvalidOperationException("GOOGLE_CLOUD_PROJECT_ID environment variable is not set");
            }
            return projectId;
        }

        public async Task<Video?> GetVideo(string videoId)
        {
            DocumentReference docRef = _firestoreDb.Collection(VideoCollectionId).Document(videoId);
            DocumentSnapshot snapshot = await docRef.GetSnapshotAsync();
            return snapshot.Exists ? snapshot.ConvertTo<Video>() : null;
        }

        public async Task SetVideo(string videoId, Video video)
        {
            DocumentReference docRef = _firestoreDb.Collection(VideoCollectionId).Document(videoId);
            await docRef.SetAsync(video, SetOptions.MergeAll);
        }

        public async Task UpdateVideo(string videoId, Dictionary<string, object> updates)
        {
            DocumentReference docRef = _firestoreDb.Collection(VideoCollectionId).Document(videoId);
            DocumentSnapshot snapshot = await docRef.GetSnapshotAsync();
            if (!snapshot.Exists)
            {
                throw new Exception($"Document {videoId} does not exist");
            }
            await docRef.UpdateAsync(updates);
        }

        public async Task<bool> IsVideoNew(string videoId)
        {
            var video = await GetVideo(videoId);
            return video?.Status == null;
        }
    }
}