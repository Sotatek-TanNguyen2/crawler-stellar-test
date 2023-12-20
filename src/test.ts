import fs from 'fs';

import {
  TransactionBuilder,
  Keypair,
  Server,
  Networks,
  Operation,
  Contract,
  Asset,
  Memo,
  xdr,
} from 'soroban-client';

// The source account is the account we will be signing and sending from.
const sourceKeypair = Keypair.fromSecret(
  'SCS7U43YHNROSA4WU72X5S2J4AOT7PBNMPTJGJ473X3MCLP2GDOEQIMW',
);
// Derive Keypair object and public key (that starts with a G) from the secret

// Configure SorobanClient to talk to the soroban-rpc instance running on your
// local machine.
const server = new Server('https://rpc-futurenet.stellar.org:443', {
  allowHttp: true,
});

// Replace with the path to your compiled Wasm binary

async function main() {
  try {
    const contractId =
      'CB2RRDMK4ZKMJGB7LHZ2P5M52JRGLXKRO4I5K5ZRPJ6YVLZDQ2RH2DGR';
    const contract = new Contract(contractId);
    // Transactions require a valid sequence number that is specific to this account.
    // We can fetch the current sequence number for the source account from Horizon.
    const sourceAccount = await server.getAccount(sourceKeypair.publicKey());
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: '100', // Replace with the desired fee
      networkPassphrase: Networks.FUTURENET,
    })
      .addOperation(contract.call('hello', ...[xdr.ScVal.scvSymbol('world')]))
      .setTimeout(300)
      .build();

    let preparedTransaction = await server.prepareTransaction(transaction);

    // Sign the transaction with the source account's keypair.
    preparedTransaction.sign(sourceKeypair);

    // Let's see the base64-encoded XDR of the transaction we just built.
    console.log(
      `Signed prepared transaction XDR: ${preparedTransaction
        .toEnvelope()
        .toXDR('base64')}`,
    );
    try {
      let sendResponse = await server.sendTransaction(preparedTransaction);
      console.log(`Sent transaction: ${JSON.stringify(sendResponse)}`);

      if (sendResponse.status === 'PENDING') {
        let getResponse = await server.getTransaction(sendResponse.hash);
        // Poll `getTransaction` until the status is not "NOT_FOUND"
        while (getResponse.status === 'NOT_FOUND') {
          console.log('Waiting for transaction confirmation...');
          // See if the transaction is complete
          getResponse = await server.getTransaction(sendResponse.hash);
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
      } else {
      }
    } catch (err) {
      // Catch and report any errors we've thrown
      console.log('Sending transaction failed');
      console.log(JSON.stringify(err));
    }
  } catch (e) {
    console.log(e);
  }
}
main();
