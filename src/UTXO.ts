import { getTxId } from "./Utils/Crypto";
import ReadOnlyTx from "./ReadOnlyTx";
import { extractAddressFromPayToPublicKeyScript } from "./Utils/Tx";
import { adrToAdrHash } from "./Utils/Crypto";
type BsvJsUtxoFormat = {
  privKeyIndex: number;
  txId: string;
  satoshis: number;
  outputIndex: number;
  script: any;
  ownerAddress: string;
};

/**
 * abus de langage c'est juste un output de transaction
 */
class UTXO {
  private transaction: ReadOnlyTx;
  private index: number;

  constructor(txHex: string, index: number) {
    this.transaction = new ReadOnlyTx(txHex);
    this.index = index;
  }

  get txId() {
    return this.transaction.getId();
  }

  get ouputIndex() {
    return this.index;
  }

  get satoshis() {
    return this.transaction.getOutputs()[this.index].satoshis;
  }
  serialize() {
    return JSON.stringify({
      id: this.txId,
      tx: this.transaction.toString(),
      index: this.index,
    });
  }

  static deserialize(s: string): UTXO {
    const { tx, index } = JSON.parse(s);
    return new UTXO(tx, index);
  }

  toBsvJsUtxoFormat(pkIdx: number, ownerAddress: string): BsvJsUtxoFormat {
    return {
      privKeyIndex: pkIdx,
      txId: this.transaction.getHash(),
      satoshis: this.transaction.getOutputs()[this.index].satoshis,
      outputIndex: this.index,
      script: this.transaction.getOutputs()[this.index].script,
      ownerAddress: ownerAddress,
    };
  }

  isOwnedBy(address: string): boolean {
    const { script } = this.transaction.getOutputs()[this.index];

    const txTargetAdrHash = extractAddressFromPayToPublicKeyScript(script);
    const originAdrHash = adrToAdrHash(address);

    return txTargetAdrHash == originAdrHash;
  }

  equal(txOutput: UTXO) {
    return (
      txOutput.txId == this.txId && txOutput.ouputIndex == txOutput.ouputIndex
    );
  }
}

export default UTXO;
