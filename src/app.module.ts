import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppService } from './app.service';

@Module({
  imports: [HttpModule, ScheduleModule.forRoot()],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
