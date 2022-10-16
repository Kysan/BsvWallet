import HDPrivateKeyManager, { WalletConstructorParams } from "./HDPrivateKey";
import bsv from "bsv";
import Address from "bsv/lib/address";
import Blockchain from "./Blockchain";

import { adrToAdrHash, getTxId } from "./Utils/Crypto";
import StasTokenSchema from "./Utils/Types/StasTokenSchema";

export type OutputRequest = {
  type: "normal" | "op return";
  to: string; // address
  amount: number;
  opReturnData: string;
};

export type UTXO = {
  privKeyIndex: number;
  txId: string;
  satoshis: number;
  outputIndex: number;
  script: any;
  ownerAddress: string;
};

class HDWallet extends HDPrivateKeyManager {
  public blockchain: Blockchain;

  constructor(params: WalletConstructorParams | undefined) {
    const {
      key = "",
      keyFormat = "mnemonic",
      language = "ENGLISH",
      network = "livenet",
      ...options
    } = params || {};
    super({ key, keyFormat, language, network, ...options });
    this.blockchain = new Blockchain(network);
  }

  getAddress(): string {
    return super.getAddress(0).toString();
  }

  /**
   * @param maxIndex this function with download the history of each derivated address from 0 to this
   * @returns
   */
  public async getUtxo(): Promise<UTXO[]> {
    const utxo = await this.blockchain.getBulkUTXO([this.getAddress()]);

    const allUTXO = utxo.map((utxo) => {
      const ownerAddress = this.getDerivatedAddress(utxo.privateKeyIndex);
      const improvedData = {
        privKeyIndex: utxo.privateKeyIndex,
        txId: utxo.tx_hash,
        satoshis: utxo.value,
        outputIndex: utxo.tx_pos,
        script: bsv.Script(new Address(ownerAddress)),
        ownerAddress: utxo.ownerAddress,
      };
      return improvedData;
    });

    return allUTXO;
  }

  public async signTx(output: OutputRequest | OutputRequest[]) {
    // TODO : checker si le montant en utxo est disponible
    const tx = new bsv.Transaction();

    // * on charge les inputs
    const utxo = await this.getUtxo();

    tx.from(utxo);

    // * on charge les ouputs
    if (Array.isArray(output)) {
      output.forEach(({ to: address, amount }) => tx.to(address, amount));
    } else {
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
    const txHex = tx.sign(privateKeys);

    return txHex.toString();
  }

  /**
   * broadcast the transaction
   * equivalent of
   * ```js
   * wallet.blockchain.boardcast(txHex)
   * ```
   * @param txHex
   * @returns txhash also called txid
   */
  public async broadcast(txHex: string): Promise<string> {
    await this.blockchain.broadcast(txHex);
    return getTxId(txHex);
  }

  public async getBalance() {
    const utxo = await this.getUtxo();
    // console.log({ utxo });

    const totalSat = utxo.reduce((total, utxo) => total + utxo.satoshis, 0);
    // TODO: return confirmed et unconfirmed seperatly
    return totalSat;
  }

  // * tout les utxo doivent être sur la clef d'indexe 0
  public async createTokenContractTx(
    schema: StasTokenSchema,
    supply: number
  ): Promise<string> {
    const adr = this.getAddress();
    const publicKeyHash = adrToAdrHash(adr);

    // * on crée notre script avec le schema du token
    const contractScript = bsv.Script.fromASM(
      `OP_DUP OP_HASH160 ${publicKeyHash} OP_EQUALVERIFY OP_CHECKSIG`
    );
    contractScript.add(bsv.Script.buildDataOut(JSON.stringify(schema)));

    // * on crée la transaction
    const tx = new bsv.Transaction();

    // on récupère les utxo
    const utxo = await this.getUtxo();
    tx.from(utxo); // on les mets en input

    // * puis on met notre script custom en output
    tx.addOutput(
      new bsv.Transaction.Output({
        script: contractScript,
        satoshis: supply,
      })
    );

    // on oublie pas de récupéré ce qui est en trop dans nos utxo
    tx.change(adr);

    const privateKeys = utxo.map((utxo) =>
      this.getDerivatedPrivateKey(utxo.privKeyIndex)
    );

    // * puis on signe le tout
    tx.sign(privateKeys);

    // * et enfin on retourne la transaction à broadcast
    return tx.toString();
  }
}

export default HDWallet;
