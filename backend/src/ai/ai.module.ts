import { Module } from "@nestjs/common";
import { AIVisionService } from "./ai-vision.service";

@Module({
  providers: [AIVisionService],
  exports: [AIVisionService],
})
export class AIModule {}
