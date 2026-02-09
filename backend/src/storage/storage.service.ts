import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../auth/supabase.service';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket = 'proposals';

  constructor(private readonly supabaseService: SupabaseService) {}

  async upload(
    filePath: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<string> {
    const client = this.supabaseService.getClient();

    const { data, error } = await client.storage
      .from(this.bucket)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw new InternalServerErrorException('Gagal mengupload file');
    }

    return data.path;
  }

  async getSignedUrl(filePath: string, expiresIn = 3600): Promise<string> {
    const client = this.supabaseService.getClient();

    const { data, error } = await client.storage
      .from(this.bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      this.logger.error(`Failed to get signed URL: ${error.message}`);
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
