import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AmazonService {
  private readonly logger = new Logger(AmazonService.name);

  async createProduct(
    title: string,
    description: string,
    images?: Express.Multer.File[],
  ) {
    this.logger.warn('Amazon integration is coming soon!');
    
    return {
      status: 'coming_soon',
      marketplace: 'Amazon',
      message: 'Amazon marketplace integration is currently under development',
      data: {
        title,
        description,
        imageCount: images?.length || 0,
      },
    };
  }
}
