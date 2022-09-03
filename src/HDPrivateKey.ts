import Address from "bsv/lib/address";
import _HDPrivateKey from "bsv/lib/hdprivatekey";

import words from "bsv/lib/mnemonic/words";
import Mnemonic from "bsv/mnemonic";
import { KeyFormat } from "./Utils/KeyFormat";
import MnemonicLanguage from "./Utils/MnemonicLanguages";
import * as Words from "bsv/lib/mnemonic/words/index.js";

const HDPrivateKeyFromMnemonic = (
  key: PrivateKeyString,
  language: MnemonicLanguage,
  network: BsvNetwork
) => {
  const mnemonicObj = Mnemonic(key, Words[language]);
  return _HDPrivateKey.fromSeed(mnemonicObj.toSeed(), network);
};

export type BsvNetwork = "testnet" | "livenet";

/**
 * in the mnemonic format
 */
type PrivateKeyString = string;

export type WalletConstructorParams = {
  key?: PrivateKeyString;
  network?: BsvNetwork;
  language?: MnemonicLanguage;
  keyFormat?: KeyFormat;
};

class HDPrivateKeyManager {
  private masterHDPrivateKey: _HDPrivateKey;
  private network: BsvNetwork;
  private mnemonic: string;

  constructor({ key, keyFormat, language, network }: WalletConstructorParams) {
    // * si il n'y a pas de clef on crée un nouveau wallet
    if (!key) {
      const mnemonic = Mnemonic.fromRandom(Words[language]);

      this.masterHDPrivateKey = _HDPrivateKey.fromSeed(
        mnemonic.toSeed(),
        network
      );
      this.mnemonic = mnemonic.toString();
      return;
    }

    if (keyFormat == "seed") {
      // * c'est de la merde on peut pas recup le mnemonic avec ça
      this.masterHDPrivateKey = _HDPrivateKey.fromString(key);
    }

    if (keyFormat == "mnemonic") {
      const mnemonic = key;
      const privKey = HDPrivateKeyFromMnemonic(mnemonic, language, network);
      this.masterHDPrivateKey = privKey;
      this.mnemonic = mnemonic;
    }

    this.network = network;
  }

  /**
   * ------ Wrapper BSV.JS ----
   */
  protected _getPrivateKey(index: number): any {
    return this.masterHDPrivateKey.deriveChild(
      `m/44'/${this.network == "testnet" ? 1 : 0}'/0'/0/${index}`,
      false
    ).privateKey;
  }

  protected getPublicKey(index: number): any {
    return this._getPrivateKey(index).publicKey;
  }

  protected getAddress(index: number): any {
    return Address.fromPublicKey(this.getPublicKey(index), this.network);
  }

  // * clean interface
  protected getDerivatedPublicKey(index: number): string {
    return this.getPublicKey(index).toString();
  }

  protected getDerivatedPrivateKey(index: number): string {
    return this._getPrivateKey(index).toString();
  }

  protected getDerivatedAddress(index: number): string {
    return this.getAddress(index).toString();
  }

  public getPrivateKey(language: MnemonicLanguage = "ENGLISH"): string {
    if (!this.mnemonic) {
      throw new Error(
        'you should create the private key instance from the "mnemonic" KeyFormat if you would like to use this feature'
      );
    }

    if (language != "ENGLISH") {
      throw new Error(
        "sorry mnemonic language other than english are not yet implemented"
      );
    }
    // todo: changement de langage
    const wordList = words[language];

    return this.mnemonic;
  }

  /**
   * give out a range of adresses
   */
  public getAddresses(start: number, end: number): string[] {
    // * in case of wreid input
    if (end < start) {
      const tmp = start;
      start = end;
      end = tmp;
    }
    // console.log({ start, end });

    const addresses = [];
    for (let n = start; n <= end; ++n) {
      addresses.push(this.getDerivatedAddress(n));
    }

    return addresses;
  }

  public toString(): string {
    return this.getPrivateKey();
  }
}

export default HDPrivateKeyManager;
