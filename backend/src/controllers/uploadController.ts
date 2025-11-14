import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { parseFile } from '../utils/fileParsingService';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const uploadController = {
  /**
   * Upload file and extract health data
   * POST /api/v1/upload/file
   */
  async uploadFile(req: Request, res: Response) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId is required',
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
        });
      }

      const file = req.file;
      console.log('[Upload] Processing file:', {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        userId,
      });

      // Validate file size (10MB limit)
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_SIZE) {
        // Clean up temp file
        fs.unlinkSync(file.path);
        return res.status(400).json({
          success: false,
          error: 'File must be under 10MB',
        });
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'text/plain',
        'text/csv',
        'text/rtf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
      ];

      if (!allowedTypes.includes(file.mimetype)) {
        fs.unlinkSync(file.path);
        return res.status(400).json({
          success: false,
          error: 'Unsupported file type',
        });
      }

      // Parse file and extract data
      console.log('[Upload] Extracting content from file...');
      const parseResult = await parseFile(file.path, file.originalname, file.mimetype);

      console.log('[Upload] Parse result:', {
        success: parseResult.success,
        confidence: parseResult.extractedData?.confidence,
        dataType: parseResult.extractedData?.dataType,
        entriesCount: parseResult.extractedData?.entries?.length,
        summary: parseResult.extractedData?.summary,
      });

      if (!parseResult.success || !parseResult.extractedData) {
        fs.unlinkSync(file.path);
        return res.status(400).json({
          success: false,
          error: parseResult.error || 'Failed to extract data from file',
        });
      }

      // Accept all uploads - let the AI determine relevance during conversations
      console.log('[Upload] File content extracted successfully');

      // Upload file to Supabase Storage
      console.log('[Upload] Uploading to Supabase Storage...');
      const timestamp = Date.now();
      const fileExt = path.extname(file.originalname);
      const fileName = `${timestamp}-${file.originalname}`;
      const storagePath = `${userId}/${fileName}`;

      const fileBuffer = fs.readFileSync(file.path);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(storagePath, fileBuffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      // Clean up temp file
      fs.unlinkSync(file.path);

      if (uploadError) {
        console.error('[Upload] Supabase storage error:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload file to storage',
        });
      }

      // Get public URL (even though bucket is private, we store the path)
      const { data: urlData } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(storagePath);

      const fileUrl = urlData.publicUrl;

      // Extract date range from extracted data
      let dateRangeStart = null;
      let dateRangeEnd = null;
      if (parseResult.extractedData.dateRange) {
        dateRangeStart = parseResult.extractedData.dateRange.start;
        dateRangeEnd = parseResult.extractedData.dateRange.end;
      }

      // Store extracted data in database
      console.log('[Upload] Storing extracted data in database...');
      const { data: dbData, error: dbError } = await supabase
        .from('uploaded_file_data')
        .insert({
          user_id: userId,
          file_url: fileUrl,
          file_name: file.originalname,
          file_type: file.mimetype,
          file_size_bytes: file.size,
          extracted_data: parseResult.extractedData,
          extraction_metadata: {
            model: 'gemini-2.5-flash',
            timestamp: new Date().toISOString(),
            confidence: parseResult.extractedData.confidence,
          },
          data_categories: parseResult.dataCategories || [],
          date_range_start: dateRangeStart,
          date_range_end: dateRangeEnd,
          summary: parseResult.extractedData.summary,
        })
        .select()
        .single();

      if (dbError) {
        console.error('[Upload] Database error:', dbError);
        return res.status(500).json({
          success: false,
          error: 'Failed to save extracted data',
        });
      }

      console.log('[Upload] File processed successfully:', dbData.id);

      res.json({
        success: true,
        fileId: dbData.id,
        fileName: file.originalname,
        extractedData: parseResult.extractedData,
        dataCategories: parseResult.dataCategories,
        message: 'File uploaded and analyzed successfully',
      });
    } catch (error: any) {
      console.error('[Upload] Error in uploadFile:', error);
      
      // Clean up temp file if it exists
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to process file upload',
      });
    }
  },

  /**
   * Get user's uploaded files
   * GET /api/v1/upload/files
   */
  async getUploadedFiles(req: Request, res: Response) {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId is required',
        });
      }

      const { data: files, error } = await supabase
        .from('uploaded_file_data')
        .select('id, file_name, file_type, file_size_bytes, upload_date, data_categories, summary, date_range_start, date_range_end')
        .eq('user_id', userId)
        .order('upload_date', { ascending: false });

      if (error) {
        console.error('[Upload] Error fetching files:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch uploaded files',
        });
      }

      res.json({
        success: true,
        files: files || [],
      });
    } catch (error: any) {
      console.error('[Upload] Error in getUploadedFiles:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch uploaded files',
      });
    }
  },

  /**
   * Get specific uploaded file data
   * GET /api/v1/upload/files/:id
   */
  async getUploadedFile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId is required',
        });
      }

      const { data: file, error } = await supabase
        .from('uploaded_file_data')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error || !file) {
        return res.status(404).json({
          success: false,
          error: 'File not found',
        });
      }

      res.json({
        success: true,
        file,
      });
    } catch (error: any) {
      console.error('[Upload] Error in getUploadedFile:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch file',
      });
    }
  },

  /**
   * Delete uploaded file
   * DELETE /api/v1/upload/files/:id
   */
  async deleteUploadedFile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId is required',
        });
      }

      // Get file info first
      const { data: file, error: fetchError } = await supabase
        .from('uploaded_file_data')
        .select('file_url, user_id')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (fetchError || !file) {
        return res.status(404).json({
          success: false,
          error: 'File not found',
        });
      }

      // Extract storage path from URL
      const urlParts = file.file_url.split('/user-uploads/');
      if (urlParts.length === 2) {
        const storagePath = urlParts[1];
        
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('user-uploads')
          .remove([storagePath]);

        if (storageError) {
          console.error('[Upload] Error deleting from storage:', storageError);
          // Continue anyway to delete DB record
        }
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('uploaded_file_data')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('[Upload] Error deleting from database:', deleteError);
        return res.status(500).json({
          success: false,
          error: 'Failed to delete file',
        });
      }

      res.json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error: any) {
      console.error('[Upload] Error in deleteUploadedFile:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete file',
      });
    }
  },
};

