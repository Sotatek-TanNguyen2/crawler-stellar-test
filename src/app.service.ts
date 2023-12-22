import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import {
  Asset,
  Contract,
  Horizon,
  Keypair,
  Networks,
  Operation,
  SorobanRpc,
  TransactionBuilder,
  xdr,
} from '@stellar/stellar-sdk';

const HORIZON_RPC = 'https://horizon-testnet.stellar.org';
const HORIZON_FUTURE = 'https://horizon-futurenet.stellar.org';
const FUTURE_RPC = 'https://rpc-futurenet.stellar.org:443';
// const CONTRACT_ID = 'CADQYRNKK5RHOYF7Z3KNLCDRI6P2NOR65WS5BSX5TNF3XMI7VX325RP6'; // increment
const CONTRACT_ID = 'CB2RRDMK4ZKMJGB7LHZ2P5M52JRGLXKRO4I5K5ZRPJ6YVLZDQ2RH2DGR'; // hello
// const ACCOUNT_ID = 'GBMHYS6BJFB7DPRFPQWUA2VUUCKBF757NIQTIWLINLDJ6AVTKZETHTUG'; // tan
const ACCOUNT_ID = 'GDBKWGXKKX3EOS7IBB6NUAEZIKZGHSUWZQWJV3RZO3OWQZFXGRXXQVHP'; // thao
const SECRET_KEY = 'SCS7U43YHNROSA4WU72X5S2J4AOT7PBNMPTJGJ473X3MCLP2GDOEQIMW'; // thao

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private readonly blockPerJob: number;
  private readonly horizonServer: Horizon.Server;
  private readonly sorobanServer: SorobanRpc.Server;
  private currentLedger: number;
  constructor(private readonly httpService: HttpService) {
    this.horizonServer = new Horizon.Server(HORIZON_FUTURE);
    this.sorobanServer = new SorobanRpc.Server(FUTURE_RPC, {
      allowHttp: true,
    });
    // this.currentLedger = 172717;
    this.currentLedger = 205900;
    this.blockPerJob = 20;
  }

  // @Timeout(0)
  async decodeXdr() {
    const xdr_encoded = {
      envelope_xdr:
        'AAAAAgAAAADCqxrqVfZHS+gIfNoAmUKyY8qWzCya7jl23WhktzRveAAAs3UAAeOrAAAAAwAAAAEAAAAAAAAAAAAAAABlgq9XAAAAAAAAAAEAAAAAAAAAGAAAAAAAAAABdRiNiuZUxJg/WfOn9Z3SYmXdUXcR1Xcxen2KryOGon0AAAAFaGVsbG8AAAAAAAABAAAADwAAAAV3b3JsZAAAAAAAAAAAAAABAAAAAAAAAAIAAAAGAAAAAXUYjYrmVMSYP1nzp/Wd0mJl3VF3EdV3MXp9iq8jhqJ9AAAAFAAAAAEAAAAHUq18j+4NqrGpTiDCfvX17cirSlTqlfL6AHv81KmSMhAAAAAAADqamQAAAzAAAAAAAAAAAAAAsxEAAAABtzRveAAAAEAI0J4ftDXHk3ybV++qPTHE3F1KjGT833hSjYTpQX7qfah3UIPuJXV8pvucs+vNQWo+DqLYcVj4hNahElkq4OkJ',
      result_xdr:
        'AAAAAAAAs3UAAAAAAAAAAQAAAAAAAAAYAAAAADpU7guLkAxroQ002lwcRYcb3YFzl4OMpV/q0T0CcGzkAAAAAA==',
      result_meta_xdr:
        'AAAAAwAAAAAAAAACAAAAAwADJIsAAAAAAAAAAMKrGupV9kdL6Ah82gCZQrJjypbMLJruOXbdaGS3NG94AAAAAlQJ0zMAAeOrAAAAAgAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAMAAAAAAAMkWQAAAABlgq0uAAAAAAAAAAEAAySLAAAAAAAAAADCqxrqVfZHS+gIfNoAmUKyY8qWzCya7jl23WhktzRveAAAAAJUCdMzAAHjqwAAAAMAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAADAAAAAAADJIsAAAAAZYKuMQAAAAAAAAABAAAAAAAAAAIAAAADAAMkiwAAAAAAAAAAwqsa6lX2R0voCHzaAJlCsmPKlswsmu45dt1oZLc0b3gAAAACVAnTMwAB46sAAAADAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAwAAAAAAAySLAAAAAGWCrjEAAAAAAAAAAQADJIsAAAAAAAAAAMKrGupV9kdL6Ah82gCZQrJjypbMLJruOXbdaGS3NG94AAAAAlQJ1/wAAeOrAAAAAwAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAMAAAAAAAMkiwAAAABlgq4xAAAAAAAAAAEAAAAAAAAAAAAAABAAAAABAAAAAgAAAA8AAAAFSGVsbG8AAAAAAAAPAAAABXdvcmxkAAAAAAAAAA==',
      fee_meta_xdr:
        'AAAAAgAAAAMAAyRZAAAAAAAAAADCqxrqVfZHS+gIfNoAmUKyY8qWzCya7jl23WhktzRveAAAAAJUCoaoAAHjqwAAAAIAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAADAAAAAAADJFkAAAAAZYKtLgAAAAAAAAABAAMkiwAAAAAAAAAAwqsa6lX2R0voCHzaAJlCsmPKlswsmu45dt1oZLc0b3gAAAACVAnTMwAB46sAAAACAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAwAAAAAAAyRZAAAAAGWCrS4AAAAA',
    };
    const envelope = xdr.TransactionEnvelope.fromXDR(
      xdr_encoded.envelope_xdr,
      'base64',
    );
    this.logger.log(JSON.stringify(envelope));

    const result = xdr.TransactionResult.fromXDR(
      xdr_encoded.result_xdr,
      'base64',
    );
    this.logger.log(JSON.stringify(result));

    const resultMeta = xdr.TransactionMeta.fromXDR(
      xdr_encoded.result_meta_xdr,
      'base64',
    );
    this.logger.log(JSON.stringify(resultMeta));

    const feeMeta = xdr.TransactionMetaV1.fromXDR(
      xdr_encoded.fee_meta_xdr,
      'base64',
    );
    this.logger.log(JSON.stringify(feeMeta));
  }

  // @Timeout(0)
  async sendTransactionHorizon() {
    try {
      const contract = new Contract(CONTRACT_ID);
      const account = await this.horizonServer.loadAccount(ACCOUNT_ID);
      const fee = await this.horizonServer.fetchBaseFee();
      const transaction = new TransactionBuilder(account, {
        fee: fee.toString(),
        networkPassphrase: Networks.FUTURENET,
      })
        .addOperation(contract.call('hello', ...[xdr.ScVal.scvString('world')]))
        .setTimeout(300)
        .build();

      transaction.sign(Keypair.fromSecret(SECRET_KEY));

      const transactionResult =
        await this.horizonServer.submitTransaction(transaction);
      this.logger.log(transactionResult);
    } catch (error) {
      this.logger.error(error);
    }
  }

  // @Timeout(0)
  async sendTransactionSoroban() {
    const contract = new Contract(CONTRACT_ID);
    const sourceKeypair = Keypair.fromSecret(SECRET_KEY);
    const sourceAccount = await this.sorobanServer.getAccount(
      sourceKeypair.publicKey(),
    );
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: Networks.FUTURENET,
    })
      .addOperation(contract.call('hello', ...[xdr.ScVal.scvSymbol('world')]))
      .setTimeout(300)
      .build();

    const preparedTransaction =
      await this.sorobanServer.prepareTransaction(transaction);

    preparedTransaction.sign(sourceKeypair);
    const sendResponse =
      await this.sorobanServer.sendTransaction(preparedTransaction);

    console.log(`Sent transaction: ${JSON.stringify(sendResponse)}`);
    if (sendResponse.status === 'PENDING') {
      let getResponse = await this.sorobanServer.getTransaction(
        sendResponse.hash,
      );

      while (getResponse.status === 'NOT_FOUND') {
        console.log('Waiting for transaction confirmation...');
        // See if the transaction is complete
        getResponse = await this.sorobanServer.getTransaction(
          sendResponse.hash,
        );
        // Wait one second
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      console.log(`getTransaction response: ${JSON.stringify(getResponse)}`);

      if (getResponse.status === 'SUCCESS') {
        // Make sure the transaction's resultMetaXDR is not empty
        if (!getResponse.resultMetaXdr) {
          throw 'Empty resultMetaXDR in getTransaction response';
        }
        // Find the return value from the contract and return it
        let transactionMeta = getResponse.resultMetaXdr;
        let returnValue = transactionMeta.v3().sorobanMeta()!.returnValue();
        console.log(`Transaction result: ${returnValue.value()}`);
      } else {
        throw `Transaction failed: ${getResponse}`;
      }
    }
  }

  // @Timeout(0)
  async getTransactionsByAcconut() {
    try {
      const data = await this.horizonServer
        .transactions()
        .forAccount(ACCOUNT_ID)
        .call();
      this.logger.log(JSON.stringify(data));
    } catch (error) {
      this.logger.error(error);
    }
  }

  // @Timeout(0)
  async getTransactionsByLedger() {
    try {
      const data = await this.horizonServer
        .transactions()
        .forLedger(205963)
        .call();
      this.logger.log(JSON.stringify(data));
    } catch (error) {
      this.logger.error(error);
    }
  }

  // @Timeout(0)
  async getEvents() {
    while (true) {
      try {
        const startLedger = this.currentLedger;
        const lastestLedger = await this.sorobanServer.getLatestLedger();
        if (lastestLedger?.sequence >= startLedger + this.blockPerJob) {
          const data = await this.sorobanServer.getEvents({
            startLedger,
            filters: [
              {
                type: 'contract',
                contractIds: [CONTRACT_ID],
              },
            ],
            limit: this.blockPerJob,
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
      } catch (error) {
        this.logger.error(error);
        this.currentLedger += this.blockPerJob;
      }
    }
  }
}
