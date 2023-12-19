import { Injectable, Logger } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import StellarSdk from 'stellar-sdk';
console.log(StellarSdk);
// import StellarSdk from '@stellar/stellar-sdk';
// const StellarSdk = require('@stellar/stellar-sdk');
// const StellarSdk = require('stellar-sdk');

const HORIZON_RPC = 'https://horizon-testnet.stellar.org';
const FUTURE_RPC = 'https://rpc-futurenet.stellar.org:443';
const CONTRACT_ID = 'CADQYRNKK5RHOYF7Z3KNLCDRI6P2NOR65WS5BSX5TNF3XMI7VX325RP6';
const ACCOUNT_ID = 'GBMHYS6BJFB7DPRFPQWUA2VUUCKBF757NIQTIWLINLDJ6AVTKZETHTUG';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private readonly blockPerJob: number = 20;
  private readonly server: any;
  private currentLedger: number;
  constructor() {
    this.server = new StellarSdk.Horizon.Server(HORIZON_RPC, {
      allowHttp: true,
    });
    this.currentLedger = 172716;
  }

  @Timeout(0)
  async getTransactions() {
    try {
      // const data = await this.server.loadAccount();
      // const data = await this.server.transactions().forLedger(this.currentLedger).call();
      const data = await this.server
        .transactions()
        .forAccount(ACCOUNT_ID)
        .call();

      this.logger.log(data);
    } catch (error) {
      console.log('error');
      this.logger.error(error);
    }
  }

  // @Timeout(0)
  // async getEvents() {
  //   while (true) {
  //     const startLedger = this.currentLedger;
  //     const lastestLedger = await this.server.getLatestLedger();
  //     if (lastestLedger?.sequence >= startLedger + this.blockPerJob) {
  //       const data = await this.server.getEvents({
  //         startLedger,
  //         filters: [
  //           {
  //             type: 'contract',
  //             contractIds: [CONTRACT_ID],
  //           },
  //         ],
  //         pagination: {
  //           limit: this.blockPerJob,
  //         },
  //       });
  //       this.logger.log(
  //         `Crawled from ${startLedger} to ${
  //           startLedger + this.blockPerJob
  //         } with data ${JSON.stringify(data)}`,
  //       );
  //       this.currentLedger = startLedger + this.blockPerJob;
  //     } else {
  //       this.logger.log(
  //         `currentLedger: ${this.currentLedger}, lastestLedger: ${lastestLedger?.sequence}. Waiting for next job...`,
  //       );
  //       await new Promise((resolve) => setTimeout(resolve, 5000));
  //     }
  //   }
  // }
}
