  import { Injectable } from '@nestjs/common';
  import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
  import { ConfigService } from '@nestjs/config';
  import { Readable } from 'stream';

  @Injectable()
  export class CloudinaryService {
    constructor(private readonly configService: ConfigService) {
      cloudinary.config({
        cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
        api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
        api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
      });
    }

    // ✅ Upload an image to Cloudinary
    async uploadImage(file: Express.Multer.File, folder = 'avatars'): Promise<string> {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder, resource_type: 'image' },
          (error: UploadApiErrorResponse, result: UploadApiResponse) => {
            if (error) return reject(error);
            resolve(result.secure_url); // Return the uploaded image URL
          }
        );

        Readable.from(file.buffer).pipe(uploadStream);
      });
    }

    // ✅ Delete an image from Cloudinary
    async deleteImage(publicId: string): Promise<boolean> {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error || result.result !== 'ok') return reject(false);
          resolve(true);
        });
      });
    }
  }
