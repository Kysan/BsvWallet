import HDPrivateKeyManager, { WalletConstructorParams } from "./HDPrivateKey";
import bsv from "bsv";
import Address from "bsv/lib/address";
import Blockchain from "./Blockchain";

import { adrToAdrHash, getTxId } from "./Utils/Crypto";
import StasTokenSchema from "./Utils/Types/StasTokenSchema";
import MnemonicLanguage from "./Utils/MnemonicLanguages";

export type OutputRequest = {
  type?: "normal" | "op return";
  to: string; // address
  amount: number;
  opReturnData?: string;
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

  constructor(params?: WalletConstructorParams) {
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

  async getAddress(): Promise<string> {
    return super.getAddress(0).toString();
  }

  /**
   * @param maxIndex
   * @returns
   */
  public async getUtxo(): Promise<UTXO[]> {
    const address = await this.getAddress();

    const utxo = await this.blockchain.getUnspendTxOuput(address);

    const allUTXO = utxo.map((utxo) => {
      const ownerAddress = this.getDerivatedAddress(0);
      const improvedData = {
        privKeyIndex: 0,
        txId: utxo.tx_hash,
        satoshis: utxo.value,
        outputIndex: utxo.tx_pos,
        script: bsv.Script(new Address(address)),
        ownerAddress: address,
      };
      return improvedData;
    });

    return allUTXO;
  }

  public async sendMoney(output: OutputRequest | OutputRequest[]) {
    const txHex = await this.signTx(output);
    return await this.broadcast(txHex);
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
    const myAdr = await this.getAddress();
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
    const adr = await this.getAddress();
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

  public async getHistory() {
    const walletAddress = await this.getAddress();
    const txs = await this.blockchain.getHistory(walletAddress);
    const hash = txs.map((tx) => tx.tx_hash);
    const txsDetails = await this.blockchain.getBulkTxDetails(hash);

    // txsDetails.forEach((a) => console.log(JSON.stringify(a, null, 4)));
    const inputsHash = txsDetails.flatMap((tx) =>
      tx.inputs.map((input) => input.hash)
    );

    const inputTxDetails = await this.blockchain.getBulkTxDetails(inputsHash);

    const findInputDetail = ({ index, hash }) => {
      // * on retrouve la tx correspondante
      const tx = inputTxDetails.find((tx) => tx.hash == hash);

      // * si on en a trouvé une on charge les détails des outputs à l'index donnée de l'input
      if (tx) {
        var details = tx.outputs[index];
      }

      return {
        index: 0,
        to: "error",
        satoshis: 0,
        hash,
        ...details,
      };
    };

    return txsDetails.map((tx) => ({
      ...tx,
      inputs: tx.inputs.map((input) => findInputDetail(input)),
    }));
  }
}

export default HDWallet;
