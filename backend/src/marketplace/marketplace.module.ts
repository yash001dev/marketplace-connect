import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ShopifyService } from './shopify/shopify.service';
import { AmazonService } from './amazon/amazon.service';
import { MeeshoService } from './meesho/meesho.service';

@Module({
  imports: [HttpModule],
  providers: [ShopifyService, AmazonService, MeeshoService],
  exports: [ShopifyService, AmazonService, MeeshoService],
})
export class MarketplaceModule {}
