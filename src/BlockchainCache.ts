import { BsvNetwork } from "./HDPrivateKey";
import { adrToAdrHash, getTxId } from "./Utils/Crypto";
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
  private userAddress: BitcoinAddress;
  private walletIndex: number;
  private wallet: P2PWallet;
  get spendOuputs(): UTXO[] {
    return read(this.userAddress + ".spend.tx");
  }

  get unspendOuputs(): UTXO[] {
    return read(this.userAddress + ".unspend.tx");
  }

  set spendOuputs(utxos) {
    write(this.userAddress + ".spend.tx", utxos);
  }
  set unspendOuputs(utxos) {
    write(this.userAddress + ".unspend.tx", utxos);
  }
  constructor(instancerWallet: P2PWallet, walletIndex: number = 0) {
    this.wallet = instancerWallet;
    this.userAddress = this.wallet.getAddress(walletIndex);
    this.walletIndex = walletIndex;
  }

  loadAllUnspendTx(rawTxs: string[]) {
    this.unspendOuputs = [];
    this.spendOuputs = [];
    for (let tx of rawTxs) {
      const caches = this.wallet.getAddresses(0, this.wallet.lastUsedIndex);
      this.broadcast(tx);
    }
  }

  async getBalance(address: string): Promise<number> {
    let totalSatoshis = 0;

    const utxoOfThisAdr = this.getUnspendTxOutput();

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

  private static removeUsedUtxo(utxo: UTXO[], tx: ReadOnlyTx) {
    const inputs = tx.getInputs();

    const txoIsInInputs = (utxo: UTXO) =>
      inputs.find((input) => utxo.matchTxInput(input));

    return {
      unspend: utxo.filter((utxo) => !txoIsInInputs(utxo)),
      spend: utxo.filter((utxo) => txoIsInInputs(utxo)),
    };
  }

  // * return the tx id
  broadcast = (txHex: string, start?: number, end?: number): string => {
    if (start !== undefined && end) {
      const addresses = this.wallet.getAddresses(start, end);
      const caches = addresses.forEach((adr, i) => {
        const cache = new BlockchainCache(this.wallet, start + i);
        cache.broadcast(txHex);
      });

      return getTxId(txHex);
    }
    const tx = new ReadOnlyTx(txHex);

    let unspendOutputs = this.unspendOuputs;
    const spendOutputs = this.spendOuputs;

    for (const output of tx.getOutputs()) {
      if (adrToAdrHash(this.userAddress) == output.targetAdrHash) {
        const { spend, unspend } = BlockchainCache.removeUsedUtxo(
          [
            ...unspendOutputs,
            new UTXO(txHex, output.index, this.walletIndex, this.userAddress),
          ],
          tx
        );
        unspendOutputs = unspend;
        spendOutputs.push(...spend);
      } else {
        // pas pour cet utilisateur on ignore
      }
    }

    this.unspendOuputs = unspendOutputs;
    this.spendOuputs = spendOutputs;

    return getTxId(txHex);
  };

  getUnspendTxOutput(): UTXO[] {
    return this.unspendOuputs.filter((utxo) =>
      utxo.isOwnedBy(this.userAddress)
    );
  }

  getBulkUtxo(startIndex: number, endIndex: number) {
    const addresses = this.wallet.getAddresses(startIndex, endIndex);
    const caches = addresses.map(
      (adr, i) => new BlockchainCache(this.wallet, startIndex + i)
    );

    return caches.flatMap((c) => c.getUnspendTxOutput());
  }
}

export default BlockchainCache;
