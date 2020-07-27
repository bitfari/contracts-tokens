const BigNum = require("bn.js");
import * as fs from "fs";
const fetch = require("node-fetch");
import {
  StacksTestnet,
  broadcastTransaction,
  makeContractDeploy,
  TxBroadcastResultOk,
  TxBroadcastResultRejected,
} from "@blockstack/stacks-transactions";

const STACKS_API_URL = "http://testnet-master.blockstack.org:20443";
const SIDECAR_API_URL = "https://sidecar.staging.blockstack.xyz";
const network = new StacksTestnet();
network.coreApiUrl = STACKS_API_URL;

const keys = JSON.parse(
  fs.readFileSync("../../blockstack/stacks-blockchain/keychain.json").toString()
).paymentKeyInfo;

async function deployContract(contractName: string, fee: number) {
  const codeBody = fs
    .readFileSync(`./contracts/experiments/${contractName}.clar`)
    .toString();

  const transaction = await makeContractDeploy({
    contractName,
    codeBody,
    senderKey: keys.privateKey,
    fee: new BigNum(fee),
    network,
  });

  const result = await broadcastTransaction(transaction, network);
  if ((result as TxBroadcastResultRejected).error) {
    if (
      (result as TxBroadcastResultRejected).reason === "ContractAlreadyExists"
    ) {
      return "" as TxBroadcastResultOk;
    } else {
      throw new Error(
        `failed to deploy ${contractName}: ${JSON.stringify(result)}`
      );
    }
  }
  const processed = await processing(result as TxBroadcastResultOk);
  if (!processed) {
    throw new Error(`failed to deploy ${contractName}: transaction not found`);
  }
  return result as TxBroadcastResultOk;
}

function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processing(tx: String, count: number = 0): Promise<boolean> {
  var result = await fetch(
    `${SIDECAR_API_URL}/sidecar/v1/tx/${tx.substr(1, tx.length - 2)}`
  );
  var value = await result.json();
  console.log(value);
  if (value.tx_status === "success") {
    return true;
  }
  if (count > 30) {
    return false;
  }

  await timeout(10000);
  return processing(tx, count + 1);
}

async function deployFlipCoin() {
  var contractName = "flip-coin";
  return deployContract(contractName, 1780);
}

async function deployFlipCoinTaxOffice() {
  var contractName = "flip-coin-tax-office";
  return deployContract(contractName, 224);
}

async function deployFlipCoinJackpot() {
  var contractName = "flip-coin-jackpot";
  return deployContract(contractName, 3200);
}

async function deployFlipCoinAtTwo() {
  var contractName = "flip-coin-at-two";
  return deployContract(contractName, 4788);
}

(async () => {
  await deployFlipCoin();
  await deployFlipCoinTaxOffice();
  await deployFlipCoinJackpot();
  await deployFlipCoinAtTwo();
})();
