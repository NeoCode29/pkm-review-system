import { Injectable, Logger, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { SupabaseService } from '../auth/supabase.service';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket = 'proposals';
  private bucketReady = false;

  constructor(private readonly supabaseService: SupabaseService) {}

  async onModuleInit() {
    await this.ensureBucket();
  }

  private async ensureBucket() {
    if (this.bucketReady) return;
    try {
      const client = this.supabaseService.getClient();
      const { data: buckets } = await client.storage.listBuckets();
      const exists = buckets?.some((b) => b.name === this.bucket);
      if (!exists) {
        this.logger.warn(`Bucket "${this.bucket}" not found, creating...`);
        const { error } = await client.storage.createBucket(this.bucket, {
          public: false,
          fileSizeLimit: 10 * 1024 * 1024,
        });
        if (error) {
          this.logger.error(`Failed to create bucket: ${error.message}`);
        } else {
          this.logger.log(`✅ Bucket "${this.bucket}" created`);
        }
      } else {
        this.logger.log(`✅ Bucket "${this.bucket}" exists`);
      }
      this.bucketReady = true;
    } catch (err) {
      this.logger.error(`Bucket check failed: ${err}`);
    }
  }

  async upload(
    filePath: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<string> {
    await this.ensureBucket();
    const client = this.supabaseService.getClient();

    const { data, error } = await client.storage
      .from(this.bucket)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Failed to upload file to "${filePath}": ${error.message} (statusCode: ${(error as any).statusCode})`);
      throw new InternalServerErrorException(`Gagal mengupload file: ${error.message}`);
    }

    return data.path;
  }

  async getSignedUrl(filePath: string, expiresIn = 3600): Promise<string> {
    const client = this.supabaseService.getClient();

    // Debug: Log the bucket and path being accessed
    this.logger.log(`Getting signed URL for bucket: ${this.bucket}, path: ${filePath}`);

    // First try to list the file to verify it exists
    const pathParts = filePath.split('/');
    const folderPath = pathParts.slice(0, -1).join('/');
    const { data: listData, error: listError } = await client.storage
      .from(this.bucket)
      .list(folderPath);

    if (listError) {
      this.logger.error(`Failed to list folder ${folderPath}: ${listError.message}`);
    } else {
      this.logger.log(`Files in folder ${folderPath}: ${listData?.map(f => f.name).join(', ') || 'none'}`);
    }

    const { data, error } = await client.storage
      .from(this.bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      this.logger.error(`Supabase storage error: ${error.message}, code: ${(error as any).statusCode || 'unknown'}`);
      if (error.message?.includes('not found') || error.message?.includes('Object not found')) {
        this.logger.warn(`File not found in storage: ${filePath}`);
      } else {
        this.logger.error(`Failed to get signed URL: ${error.message}`);
      }
      throw new InternalServerErrorException('Gagal mendapatkan URL file');
    }

    return data.signedUrl;
  }

  async download(filePath: string): Promise<Buffer> {
    const client = this.supabaseService.getClient();

    const { data, error } = await client.storage
      .from(this.bucket)
      .download(filePath);

    if (error) {
      this.logger.error(`Failed to download file: ${error.message}`);
      throw new InternalServerErrorException('Gagal mengunduh file');
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async remove(filePath: string): Promise<void> {
    const client = this.supabaseService.getClient();

    const { error } = await client.storage
      .from(this.bucket)
      .remove([filePath]);

    if (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
    }
  }

  buildPath(type: 'original' | 'revised', teamId: bigint, filename: string): string {
    const timestamp = Date.now();
    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${type}/${teamId}/${timestamp}_${sanitized}`;
  }
}
