/**
 * Video download service for client-side video downloading (Instagram)
 *
 * This service handles the download and upload flow when Instagram
 * blocks server-side video access. The flow is:
 * 1. Server extracts direct MP4 URL (no download)
 * 2. Client downloads video using user's IP
 * 3. Client uploads video to server
 * 4. Server processes uploaded video
 */

// TODO: Replace with expo-file-system
import {
  createDownloadResumable,
  getInfoAsync,
  deleteAsync,
  cacheDirectory,
} from "expo-file-system/legacy";
import { api } from "../api-client";

export interface VideoDownloadProgress {
  totalBytes: number;
  downloadedBytes: number;
  percentage: number;
}

export interface VideoDownloadResult {
  localUri: string;
  size: number;
}

export interface VideoUploadResult {
  url: string;
  path: string;
  size: number;
  content_type: string;
}

export const videoDownloadService = {
  /**
   * Download video from URL to local cache.
   *
   * Uses expo-file-system to download the video to the app's cache directory.
   * Progress updates are provided via callback.
   */
  downloadVideo: async (
    downloadUrl: string,
    onProgress?: (progress: VideoDownloadProgress) => void
  ): Promise<VideoDownloadResult> => {
    const filename = `video_${Date.now()}.mp4`;
    const localUri = `${cacheDirectory}${filename}`;

    console.log(`[VideoDownload] Starting download to: ${localUri}`);

    const downloadResumable = createDownloadResumable(
      downloadUrl,
      localUri,
      {},
      (downloadProgress) => {
        if (onProgress) {
          const percentage = Math.round(
            (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100
          );
          onProgress({
            totalBytes: downloadProgress.totalBytesExpectedToWrite,
            downloadedBytes: downloadProgress.totalBytesWritten,
            percentage,
          });
        }
      }
    );

    const result = await downloadResumable.downloadAsync();
    if (!result) {
      throw new Error("Download failed - no result returned");
    }

    const fileInfo = await getInfoAsync(result.uri);
    const size = fileInfo.exists && "size" in fileInfo ? fileInfo.size ?? 0 : 0;

    console.log(`[VideoDownload] Download complete: ${size} bytes`);

    return {
      localUri: result.uri,
      size,
    };
  },

  /**
   * Upload video to server temp storage.
   *
   * Uploads the downloaded video to the server's temp-videos bucket.
   * The server will process this video and delete it after extraction.
   */
  uploadVideo: async (
    localUri: string,
    jobId: string,
    onProgress?: (percentage: number) => void
  ): Promise<VideoUploadResult> => {
    console.log(`[VideoDownload] Starting upload for job: ${jobId}`);

    // Create form data
    const formData = new FormData();

    formData.append("file", {
      uri: localUri,
      type: "video/mp4",
      name: "video.mp4",
    } as unknown as Blob);

    formData.append("job_id", jobId);

    const response = await api.post<VideoUploadResult>("/upload/video", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          onProgress(percentage);
        }
      },
    });

    console.log(`[VideoDownload] Upload complete: ${response.data.path}`);

    return response.data;
  },

  /**
   * Resume extraction after video upload.
   *
   * Tells the server to continue processing the extraction job
   * using the uploaded video file.
   */
  resumeExtraction: async (jobId: string, videoPath: string): Promise<void> => {
    console.log(`[VideoDownload] Resuming extraction for job: ${jobId}`);

    await api.post(`/extraction/jobs/${jobId}/resume`, null, {
      params: { video_path: videoPath },
    });

    console.log(`[VideoDownload] Extraction resumed`);
  },

  /**
   * Clean up local video file.
   *
   * Deletes the downloaded video from the device's cache.
   * Should be called after successful upload.
   */
  cleanupLocalVideo: async (localUri: string): Promise<void> => {
    try {
      await deleteAsync(localUri, { idempotent: true });
      console.log(`[VideoDownload] Cleaned up local file: ${localUri}`);
    } catch (error) {
      console.warn(`[VideoDownload] Failed to cleanup local video:`, error);
    }
  },

  /**
   * Full download, upload, and resume flow.
   *
   * Convenience method that handles the entire client-side download flow:
   * 1. Download video from URL
   * 2. Upload to server
   * 3. Resume extraction
   * 4. Cleanup local file
   */
  handleClientDownload: async (
    jobId: string,
    downloadUrl: string,
    onDownloadProgress?: (progress: VideoDownloadProgress) => void,
    onUploadProgress?: (percentage: number) => void
  ): Promise<string> => {
    let localUri: string | null = null;

    try {
      // Step 1: Download video
      const downloadResult = await videoDownloadService.downloadVideo(downloadUrl, onDownloadProgress);
      localUri = downloadResult.localUri;

      // Step 2: Upload to server
      const uploadResult = await videoDownloadService.uploadVideo(localUri, jobId, onUploadProgress);

      // Step 3: Resume extraction
      await videoDownloadService.resumeExtraction(jobId, uploadResult.path);

      // Step 4: Cleanup
      await videoDownloadService.cleanupLocalVideo(localUri);

      return uploadResult.path;
    } catch (error) {
      // Cleanup on error
      if (localUri) {
        await videoDownloadService.cleanupLocalVideo(localUri);
      }
      throw error;
    }
  },
};
