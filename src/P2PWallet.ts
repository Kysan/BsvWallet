import { OutputRequest } from "./BIP32HDWallet";
import BlockchainCache from "./BlockchainCache";
import HDPrivateKeyManager, {
  BsvNetwork,
  WalletConstructorParams,
} from "./HDPrivateKey";
import bsv from "bsv";

import Address from "bsv/lib/address";
import { UTXO } from "./Wallet";
import { Wallet } from ".";

class P2PWallet extends HDPrivateKeyManager {
  public cache: BlockchainCache;
  public lastUsedIndex: number = 0;
  constructor(params?: WalletConstructorParams) {
    const {
      key = "",
      keyFormat = "mnemonic",
      language = "ENGLISH",
      network = "livenet",
      ...options
    } = params || {};
    super({ key, keyFormat, language, network, ...options });
    this.cache = new BlockchainCache(this);
  }

  async downloadUTXO() {
    const wallet = new Wallet({
      network: this.getNetwork(),
      key: this.getPrivateKey(),
    });

    const history = await wallet.getHistory();

    const rawTxsToCache: string[] = [];

    for (let tx of history) {
      const rawTx = await wallet.blockchain.getRawTx(tx.hash);

      rawTxsToCache.push(rawTx);
    }

    return this.cache.loadAllUnspendTx(rawTxsToCache);
  }

  public getAddress(n: number = 0) {
    return super.getAddress(n).toString();
  }

  public getNewAddress() {
    this.lastUsedIndex++;
    return this.getAddress(this.lastUsedIndex);
  }

  public getBalance(): number {
    let totalSatoshis = 0;
    const utxo = this.getUtxo();
    // console.log({ utxo: utxo.map((o) => o.toBsvJsUtxoFormat()) });
    utxo.forEach((utxo) => (totalSatoshis += utxo.satoshis));

    return totalSatoshis;
  }

  public getUtxo(): UTXO[] {
    const address = this.getAddress();

    const utxo = this.cache.getBulkUtxo(0, 10);

    const allUTXO = utxo.map((utxo) => {
      const ownerAddress = this.getDerivatedAddress(0);
      const improvedData = {
        ...utxo.toBsvJsUtxoFormat(),
        script: bsv.Script(new Address(address)), // au cas ou ça marche pas : utxo.script
        ownerAddress: address,
      };
      return improvedData;
    });

    return allUTXO;
  }

  public signTx(
    output: OutputRequest | OutputRequest[],
    autoUpdate: boolean = true
  ) {
    // TODO : checker si le montant en utxo est disponible
    const tx = new bsv.Transaction();

    // * on charge les inputs
    const utxo = this.getUtxo();

    tx.from(utxo);

    // * on charge les ouputs
    const balance = this.getBalance();

    const txFees = 200;
    if (Array.isArray(output)) {
      const totalNeededBalance = output.reduce((p, n) => p + n.amount, 0);

      if (balance < totalNeededBalance + txFees) {
        throw Error("not enough satoshi to sign this transaction");
      }

      output.forEach(({ to: address, amount }) => tx.to(address, amount));
    } else {
      if (balance < output.amount + txFees) {
        throw Error("not enough satoshi to sign this transaction");
      }
      tx.to(output.to, output.amount);
    }

    // * ou oublie pas l'addresse de change
    const myAdr = this.getAddress();
    tx.change(myAdr);

    // * on récupères la clef privée qui correspond à chaque utxo
    const privateKeys = utxo.map((utxo) =>
      this.getDerivatedPrivateKey(utxo.privKeyIndex)
    );

    // TODO: prendre en compte les clefs privées en double dans cette liste

    // * et enfin on signe la transaction
    const txHex = tx.sign(privateKeys).toString();

    if (autoUpdate) {
      this.receive(txHex);
    }

    return txHex;
  }

  public receive(txHex: string): string {
    return this.cache.broadcast(txHex, 0, 10);
  }
}

export default P2PWallet;
