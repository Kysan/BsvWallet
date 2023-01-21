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
  constructor(params?: WalletConstructorParams) {
    const {
      key = "",
      keyFormat = "mnemonic",
      language = "ENGLISH",
      network = "livenet",
      ...options
    } = params || {};
    super({ key, keyFormat, language, network, ...options });
    this.cache = new BlockchainCache(this, super.getAddress(0).toString());
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

  async getAddress(): Promise<string> {
    return super.getAddress(0).toString();
  }

  public async getUtxo(): Promise<UTXO[]> {
    const address = await this.getAddress();

    const utxo = this.cache.getUnspendTxOuputOf(address);

    const allUTXO = utxo.map((utxo) => {
      const ownerAddress = this.getDerivatedAddress(0);
      const improvedData = {
        ...utxo.toBsvJsUtxoFormat(0, ownerAddress),
        script: bsv.Script(new Address(address)), // au cas ou ça marche pas : utxo.script
        ownerAddress: address,
      };
      return improvedData;
    });

    return allUTXO;
  }

  public async signTx(
    output: OutputRequest | OutputRequest[],
    autoUpdate: boolean = true
  ) {
    // TODO : checker si le montant en utxo est disponible
    const tx = new bsv.Transaction();

    // * on charge les inputs
    const utxo = await this.getUtxo();

    tx.from(utxo);

    // * on charge les ouputs
    const balance = await this.getBalance();

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
    const myAdr = await this.getAddress();
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

  public async getBalance() {
    const totalSat = await this.cache.getBalance(await this.getAddress());

    // TODO: return confirmed et unconfirmed seperatly
    return totalSat;
  }

  public async receive(txHex: string): Promise<string> {
    return this.cache.broadcast(txHex);
  }
}

export default P2PWallet;
