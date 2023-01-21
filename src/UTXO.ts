import { getTxId } from "./Utils/Crypto";
import ReadOnlyTx, { TxInput } from "./ReadOnlyTx";
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
  private outputIndex: number;
  private walletIndex: number;
  private ownerAddress: string;
  constructor(
    txHex: string,
    outputIndex: number,
    walletIndex: number,
    ownerAdr: string
  ) {
    this.transaction = new ReadOnlyTx(txHex);
    this.outputIndex = outputIndex;
    this.walletIndex = walletIndex;
    this.ownerAddress = ownerAdr;
  }

  get txId() {
    return this.transaction.getId();
  }

  get ouputIndex() {
    return this.outputIndex;
  }

  get satoshis() {
    return this.transaction.getOutputs()[this.outputIndex].satoshis;
  }
  serialize() {
    return JSON.stringify({
      id: this.txId,
      tx: this.transaction.toString(),
      outputIndex: this.outputIndex,
      walletIndex: this.walletIndex,
      ownerAddress: this.ownerAddress,
    });
  }

  static deserialize(s: string): UTXO {
    const { tx, walletIndex, outputIndex, ownerAddress } = JSON.parse(s);
    return new UTXO(tx, outputIndex, walletIndex, ownerAddress);
  }

  toBsvJsUtxoFormat(): BsvJsUtxoFormat {
    return {
      privKeyIndex: this.walletIndex,
      txId: this.transaction.getHash(),
      satoshis: this.transaction.getOutputs()[this.outputIndex].satoshis,
      outputIndex: this.outputIndex,
      script: this.transaction.getOutputs()[this.outputIndex].script,
      ownerAddress: this.ownerAddress,
    };
  }

  isOwnedBy(address: string): boolean {
    const { script } = this.transaction.getOutputs()[this.outputIndex];

    const txTargetAdrHash = extractAddressFromPayToPublicKeyScript(script);
    const originAdrHash = adrToAdrHash(address);

    return txTargetAdrHash == originAdrHash;
  }

  equal(txOutput: UTXO) {
    return (
      txOutput.txId == this.txId && txOutput.ouputIndex == txOutput.ouputIndex
    );
  }

  matchTxInput(input: TxInput) {
    return (
      this.txId == input.prevTxId && this.outputIndex == input.prevTxOutputIndex
    );
  }
}

export default UTXO;
