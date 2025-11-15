/**
 * Upload Service
 * 
 * API client for file upload and management endpoints.
 * Handles uploading files, tracking progress, and managing uploaded files.
 */

import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system';
import { API_BASE_URL } from '../config/api';

/**
 * Get authentication headers with Supabase token
 */
async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  
  return {
    'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
  };
}

/**
 * Upload a file and extract health data with progress tracking
 * 
 * @param {string} fileUri - Local file URI
 * @param {string} fileName - Original file name
 * @param {string} mimeType - File MIME type
 * @param {string} userId - User ID
 * @param {function} onProgress - Progress callback (receives object with totalBytesSent, totalBytesExpectedToSend, progress)
 * @returns {Promise<object>} Upload result with extracted data
 */
export async function uploadFile(fileUri, fileName, mimeType, userId, onProgress = null) {
  try {
    console.log('[UploadService] Uploading file:', {
      fileName,
      mimeType,
      userId: userId?.substring(0, 8) + '...',
    });

    const headers = await getAuthHeaders();

    // Initialize progress at 0%
    if (onProgress) {
      onProgress({
        totalBytesSent: 0,
        totalBytesExpectedToSend: 100,
        progress: 0,
      });
    }

    let uploadComplete = false;
    let simulatedProgress = 0;
    
    // Start simulated progress for AI processing (30% to 95%)
    // This runs while waiting for the server response
    const progressInterval = setInterval(() => {
      if (uploadComplete) {
        clearInterval(progressInterval);
        return;
      }
      
      // Increment progress to show AI is working
      // Start at 30% (after upload) and move to 95%
      if (simulatedProgress < 0.95) {
        simulatedProgress += 0.03; // Increment by 5% every interval
        if (onProgress) {
          console.log('[UploadService] Simulated AI processing progress:', Math.round(simulatedProgress * 100) + '%');
          onProgress({
            totalBytesSent: Math.round(simulatedProgress * 100),
            totalBytesExpectedToSend: 100,
            progress: simulatedProgress,
          });
        }
      }
    }, 200); // Update every 200ms

    // Create upload task with progress callback
    const uploadTask = FileSystem.createUploadTask(
      `${API_BASE_URL}/upload/file`,
      fileUri,
      {
        fieldName: 'file',
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        headers: {
          ...headers,
        },
        parameters: {
          userId,
        },
      },
      (progressData) => {
        if (onProgress && progressData.totalBytesExpectedToSend > 0) {
          const progress = progressData.totalBytesSent / progressData.totalBytesExpectedToSend;
          // Upload is typically fast (0-30%), then AI processing takes over
          const adjustedProgress = progress * 0.3; // Scale upload to 0-30%
          console.log('[UploadService] Upload progress:', {
            sent: progressData.totalBytesSent,
            total: progressData.totalBytesExpectedToSend,
            percent: Math.round(adjustedProgress * 100) + '%',
          });
          
          // Only update if higher than simulated progress
          if (adjustedProgress > simulatedProgress) {
            simulatedProgress = adjustedProgress;
            onProgress({
              totalBytesSent: progressData.totalBytesSent,
              totalBytesExpectedToSend: progressData.totalBytesExpectedToSend,
              progress: adjustedProgress,
            });
          }
        }
      }
    );

    // Execute the upload (this includes waiting for server processing)
    const uploadResult = await uploadTask.uploadAsync();
    
    // Mark upload as complete and stop simulated progress
    uploadComplete = true;
    clearInterval(progressInterval);

    console.log('[UploadService] Upload status:', uploadResult.status);

    if (uploadResult.status !== 200) {
      const errorData = JSON.parse(uploadResult.body);
      throw new Error(errorData.error || 'Upload failed');
    }

    const data = JSON.parse(uploadResult.body);

    console.log('[UploadService] File uploaded and processed successfully:', {
      fileId: data.fileId,
      dataCategories: data.dataCategories,
    });

    // Call progress callback with 100% when complete
    if (onProgress) {
      onProgress({
        totalBytesSent: 100,
        totalBytesExpectedToSend: 100,
        progress: 1,
      });
    }

    return {
      success: true,
      fileId: data.fileId,
      fileName: data.fileName,
      extractedData: data.extractedData,
      dataCategories: data.dataCategories,
      message: data.message,
    };
  } catch (error) {
    console.error('[UploadService] Error uploading file:', error);
    
    let errorMessage = error.message;
    if (error.message === 'Network request failed' || error.message.includes('Network')) {
      errorMessage = 'Unable to connect to server. Please check your connection.';
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get user's uploaded files
 * 
 * @param {string} userId - User ID
 * @returns {Promise<object>} List of uploaded files
 */
export async function getUploadedFiles(userId) {
  try {
    console.log('[UploadService] Fetching uploaded files for user:', userId);
    
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/upload/files?userId=${userId}`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch uploaded files');
    }

    console.log('[UploadService] Files count:', data.files?.length || 0);
    
    return {
      success: true,
      files: data.files || [],
    };
  } catch (error) {
    console.error('[UploadService] Error fetching files:', error);
    return {
      success: false,
      error: error.message,
      files: [],
    };
  }
}

/**
 * Get specific uploaded file data
 * 
 * @param {string} fileId - File ID
 * @param {string} userId - User ID
 * @returns {Promise<object>} File data
 */
export async function getUploadedFile(fileId, userId) {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/upload/files/${fileId}?userId=${userId}`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch file');
    }

    return {
      success: true,
      file: data.file,
    };
  } catch (error) {
    console.error('[UploadService] Error fetching file:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete an uploaded file
 * 
 * @param {string} fileId - File ID
 * @param {string} userId - User ID
 * @returns {Promise<object>} Success status
 */
export async function deleteUploadedFile(fileId, userId) {
  try {
    console.log('[UploadService] Deleting file:', fileId);
    
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/upload/files/${fileId}?userId=${userId}`, {
      method: 'DELETE',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete file');
    }

    console.log('[UploadService] File deleted successfully');
    
    return {
      success: true,
      message: data.message,
    };
  } catch (error) {
    console.error('[UploadService] Error deleting file:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

