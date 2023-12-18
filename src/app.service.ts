import { Injectable } from '@nestjs/common';
import StellarSdk from '@stellar/stellar-sdk';

@Injectable()
export class AppService {
  private server: any;
  constructor() {
    StellarSdk.Network.useTestNetwork();
    this.server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
  }
}
