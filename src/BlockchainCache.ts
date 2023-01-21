import { BsvNetwork } from "./HDPrivateKey";
import { getTxId } from "./Utils/Crypto";
import { splitInGroupOf } from "./Utils/GroupBy";
import AddressBalance from "./Utils/HTTPResponse/AddressBalance";
import { TxDetails } from "./Utils/HTTPResponse/TxDetails";
import { UnspendTransactionWoC } from "./Utils/HTTPResponse/UnspendTransaction";
import ReadOnlyTx from "./ReadOnlyTx";

import { AccountTxHistory } from "./Utils/TxHistory";

import fs from "fs";
import P2PWallet from "./P2PWallet";
import UTXO from "./UTXO";

type BitcoinAddress = string;

const checkCacheFolder = (path = "./.txs/") => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }

  return path;
};

const write = (filePath: string, utxos: UTXO[]) => {
  const folderPath = checkCacheFolder();
  const path = folderPath + filePath;
  fs.writeFileSync(
    path,
    JSON.stringify(
      utxos.map((utxo) => utxo.serialize()),
      null,
      4
    )
  );
};

const read = (filePath: string): UTXO[] => {
  const folderPath = checkCacheFolder();
  const path = folderPath + filePath;
  if (!fs.existsSync(path)) {
    write(filePath, []);
    return [];
  }

  var fileBuffer = fs.readFileSync(path);

  const serializedUtxo = JSON.parse(fileBuffer.toString());

  return serializedUtxo.map((utxo) => UTXO.deserialize(utxo));
};

class BlockchainCache {
  private userFirstAdr: BitcoinAddress;

  private wallet: P2PWallet;
  get spendOuputs(): UTXO[] {
    return read(this.userFirstAdr + ".spend.tx");
  }

  get unspendOuputs(): UTXO[] {
    return read(this.userFirstAdr + ".unspend.tx");
  }

  set spendOuputs(utxos) {
    write(this.userFirstAdr + ".spend.tx", utxos);
  }
  set unspendOuputs(utxos) {
    write(this.userFirstAdr + ".unspend.tx", utxos);
  }
  constructor(instancerWallet: P2PWallet, userFirstAdr: string) {
    this.wallet = instancerWallet;
    this.userFirstAdr = userFirstAdr;
  }

  loadAllUnspendTx(rawTxs: string[]) {
    this.unspendOuputs = [];
    this.spendOuputs = [];
    for (let tx of rawTxs) {
      this.broadcast(tx);
    }
  }

  async getBalance(address: string): Promise<number> {
    let totalSatoshis = 0;

    const utxoOfThisAdr = this.getUnspendTxOuputOf(address);

    utxoOfThisAdr.forEach((utxo) => {
      totalSatoshis += utxo.satoshis;
    });

    return totalSatoshis;
  }

  async getBalancesFromAddresses(addresses: string[]) {
    let totalSatoshis = 0;

    for (let address of addresses) {
      totalSatoshis += await this.getBalance(address);
    }

    return totalSatoshis;
  }

  // * return the tx id
  broadcast = (txHex: string): string => {
    const tx = new ReadOnlyTx(txHex);

    const outputs = tx.getOutputs();

    const inputs = tx.getInputs();

    let unspendOuputs = [...this.unspendOuputs];
    let spendOuputs = [...this.spendOuputs];

    console.log({ unspendOuputs, spendOuputs });

    // * on vire les inputs de cette tx du caches car ils sont utilisés
    for (let input of inputs) {
      const newSpendOutputs = [];

      for (let unspendOuput of unspendOuputs) {
        if (
          unspendOuput.txId == input.prevTxId &&
          unspendOuput.ouputIndex == input.prevTxOutputIndex
        ) {
          newSpendOutputs.push(unspendOuput);
        }
      }

      const isInNewSpendOutPut = (txo: UTXO) => {
        return newSpendOutputs.find((ntxo) => ntxo.equal(txo)) && true;
      };

      // * on les enlèves des unspend
      unspendOuputs = this.unspendOuputs.filter(
        (txo) => !isInNewSpendOutPut(txo)
      );
      // * et on les passes à spend
      spendOuputs.push(...newSpendOutputs);
    }

    // * et on ajoutes les nouveaux outputs
    for (let output of outputs) {
      const utxo = new UTXO(txHex, output.index);
      // const withoutduplicate = this.unspendOuputs.filter(
      //   (o) => o.ouputIndex != utxo.ouputIndex && o.txId != utxo.txId
      // );
      // process.exit();
      unspendOuputs.push(utxo);
    }

    this.unspendOuputs = unspendOuputs;
    this.spendOuputs = spendOuputs;

    return getTxId(txHex);
  };

  getUnspendTxOuputOf(address: string): UTXO[] {
    return this.unspendOuputs.filter((utxo) => utxo.isOwnedBy(address));
  }
}

export default BlockchainCache;
