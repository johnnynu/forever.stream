using Google.Cloud.Firestore;

namespace video_processing_service.Models
{
    [FirestoreData]
    public class Video
    {
        [FirestoreProperty]
        public string? Id { get; set; }

        [FirestoreProperty]
        public string? Uid { get; set; }

        [FirestoreProperty]
        public string? Filename { get; set; }

        [FirestoreProperty]
        public string? Status { get; set; }

        [FirestoreProperty]
        public string? Title { get; set; }

        [FirestoreProperty]
        public string? Description { get; set; }
    }
}