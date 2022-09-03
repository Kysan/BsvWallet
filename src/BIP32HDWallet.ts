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

// * little helper function (a move dans un autre fichier)
const computeTotalInChunk = (data) => {
  return data.reduce(
    (total, { balance: { confirmed, unconfirmed }, address: adr }) => {
      const localTotal = confirmed + unconfirmed;
      return localTotal + total;
    },
    0
  );
};

class BIP32HDWallet extends HDPrivateKeyManager {
  public lastUnusedAddressIndex: number;
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
    this.lastUnusedAddressIndex = 10;
    this.blockchain = new Blockchain(network);
  }

  // * adresse ou on va recevoir
  private async getUnusedAddress(): Promise<string> {
    // * TODO : FAIRE EN SORTE QUE LE PREMIER APPEL SOIT MOINS LONG
    do {
      var adr = this.getDerivatedAddress(++this.lastUnusedAddressIndex);
      var history = await this.blockchain.getHistory(adr);
    } while (history.length > 0);
    return adr;
  }

  // * will return an unused address
  async getAddress(): Promise<string> {
    return await this.getUnusedAddress();
  }

  /**
   * @param debitedAddressIndex index of the key to use in the wallet
   * @param amount amount of BTC to send
   * @returns tx encoded in hexadicimal format
   */
  private async signTxv1(
    debitedAddressIndex: number,
    recipientAdr: string,
    amount: number,
    changeAdr?: string
  ): Promise<string> {
    changeAdr = !changeAdr ? await this.getUnusedAddress() : changeAdr;
    const myAddress = this.getDerivatedAddress(debitedAddressIndex);
    const privKey = this.getDerivatedPrivateKey(debitedAddressIndex);

    const unspendTransactions = await this.blockchain.getUnspendTxOuput(
      myAddress
    );

    const myInputs = [];

    for (let transaction of unspendTransactions) {
      // * récupérer son script en hexa depuis la blockchain
      const rawTxScript = await this.blockchain.getRawTx(
        transaction["tx_hash"]
      );

      // * l'interpèter avec la lib
      const tx = new bsv.Transaction(rawTxScript);

      console.log({ tx });
      // * et extrait les utxo
      const data = tx.toObject();
      const { satoshis, script } = data.outputs[transaction.tx_pos]; // très exactement ça // pas sur pour le tx_pos

      myInputs.push({
        txid: transaction.tx_hash,
        satoshis: satoshis,
        vout: transaction.tx_pos,
        scriptPubKey: script,
      });
    }

    // * all the stuff above is garbage to understand juste focus on this
    const finalTx = new bsv.Transaction();

    finalTx.from(myInputs);
    finalTx.to(new Address(recipientAdr), amount);
    finalTx.change(new Address(changeAdr || myAddress));
    finalTx.sign(this._getPrivateKey(debitedAddressIndex));
    return finalTx.toString();
  }

  /**
   * @param maxIndex this function with download the history of each derivated address from 0 to this
   * @returns
   */
  public async getUtxo(maxIndex?: number): Promise<UTXO[]> {
    // au cas ou cette fonction n'est jamais été appelée
    maxIndex || (await this.getUnusedAddress());

    const numberOfAddressToCheck = maxIndex || this.lastUnusedAddressIndex + 3;

    const addresses = this.getAddresses(
      0,
      Math.max(numberOfAddressToCheck, 100)
    );

    // * we will for all of the address of this wallet
    // * load it's utxo into an array

    const utxo = await this.blockchain.getBulkUTXO(addresses);

    const allUTXO = utxo.map((utxo) => {
      const ownerAddress = this.getDerivatedAddress(utxo.privateKeyIndex);
      const improvedData = {
        privKeyIndex: utxo.privateKeyIndex,
        txId: utxo.tx_hash,
        satoshis: utxo.value,
        outputIndex: utxo.tx_pos,
        script: bsv.Script(new Address(ownerAddress)),
        fromAddress: ownerAddress,
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
    const unusedAdr = await this.getUnusedAddress();
    tx.change(unusedAdr);

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
    const adr = this.getDerivatedAddress(0);
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

export default BIP32HDWallet;
