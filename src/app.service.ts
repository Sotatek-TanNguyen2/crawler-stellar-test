import { Injectable, Logger } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import SorobanClient from 'soroban-client';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private readonly blockPerJob: number = 20;
  private server: any;
  private currentLedger: number;
  constructor() {
    this.server = new SorobanClient.Server(
      'https://rpc-futurenet.stellar.org:443',
      {
        allowHttp: true,
      },
    );
    this.currentLedger = 172716;
  }

  @Timeout(0)
  async getEvents() {
    while (true) {
      const startLedger = this.currentLedger;
      const lastestLedger = await this.server.getLatestLedger();
      if (lastestLedger?.sequence >= startLedger + this.blockPerJob) {
        const data = await this.server.getEvents({
          startLedger,
          filters: [
            {
              type: 'contract',
              contractIds: [
                'CADQYRNKK5RHOYF7Z3KNLCDRI6P2NOR65WS5BSX5TNF3XMI7VX325RP6',
              ],
            },
          ],
          pagination: {
            limit: this.blockPerJob,
          },
        });
        this.logger.log(
          `Crawled from ${startLedger} to ${
            startLedger + this.blockPerJob
          } with data ${JSON.stringify(data)}`,
        );
        this.currentLedger = startLedger + this.blockPerJob;
      } else {
        this.logger.log(
          `currentLedger: ${this.currentLedger}, lastestLedger: ${lastestLedger?.sequence}. Waiting for next job...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }
}
