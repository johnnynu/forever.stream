# ForeverStream

A simplified YouTube clone built as a full-stack learning project. ForeverStream demonstrates core video platform functionality including user authentication, video upload, processing, and streaming.

## 🎯 Project Overview

ForeverStream is a video sharing platform that allows users to upload, view, and manage videos. This project focuses on implementing the essential features of a video platform while exploring scalable cloud architecture patterns.

## ✨ Features

- **User Authentication**: Sign in/out using Google accounts
- **Video Upload**: Authenticated users can upload videos
- **Video Processing**: Automatic transcoding to multiple formats (360p, 720p)
- **Video Viewing**: Browse and watch uploaded videos (public access)
- **Responsive Design**: Built with Vite.js for optimal user experience

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Vite.js, React
- **Backend**: Firebase Functions (Node.js)
- **Database**: Firestore (NoSQL)
- **Authentication**: Firebase Auth
- **Video Storage**: Google Cloud Storage
- **Video Processing**: Cloud Run workers with FFmpeg
- **Message Queue**: Cloud Pub/Sub
- **Hosting**: Cloud Run

### High-Level System Design

```
[Web Client] → [Firebase Functions API] → [Firestore Database]
     ↓                    ↓
[Firebase Auth]    [Cloud Storage] → [Pub/Sub] → [Processing Workers]
                        ↓                              ↓
                 [Raw Videos]                [Processed Videos]
```

## 🔧 Core Components

### 1. User Authentication
- Google OAuth integration via Firebase Auth
- Automatic user document creation using Firebase triggers
- User profile management in Firestore

### 2. Video Upload Flow
- Signed URL generation for secure direct uploads to Cloud Storage
- Authentication-gated upload process
- Support for multiple video formats

### 3. Video Processing Pipeline
- Asynchronous processing using Cloud Pub/Sub message queue
- FFmpeg-based transcoding to multiple resolutions
- Scalable Cloud Run workers that auto-scale based on demand
- Metadata storage in Firestore upon completion

### 4. Video Streaming
- Processed videos served from public Cloud Storage bucket
- Metadata-driven video listing and playback
- Support for multiple quality options

## 🛠️ Development Workflow

1. **Frontend Development**: Vite.js app with Firebase Auth integration
2. **API Development**: Firebase Functions for video upload/metadata operations
3. **Processing Pipeline**: Cloud Run services for video transcoding
4. **Database Design**: Firestore collections for users and video metadata

## 🔄 Future Enhancements

- Video commenting and rating system
- Advanced search and filtering
- User subscriptions and notifications
- Content moderation and illegal content detection
- Analytics and usage tracking
- Mobile app development

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Built with ❤️ for learning and portfolio demonstration**
