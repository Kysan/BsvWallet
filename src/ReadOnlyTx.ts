import bsv from "bsv";
import { adrToAdrHash, getTxId } from "./Utils/Crypto";
import {
  extractAddressFromPayToPublicKeyScript,
  getTxUnspendOutput,
} from "./Utils/Tx";

export interface TxInput {
  prevTxId: string;
  prevTxOutputIndex: number;
  script: string;
  sequenceNumber: number;
}

export interface TxOutput {
  satoshis: number;
  script: string;
  index: number;
  targetAdrHash: string;
}

class ReadOnlyTx {
  private txHex: string;

  constructor(txHex: string) {
    this.txHex = txHex;
  }

  getInputs(): TxInput[] {
    const tx = bsv.Transaction(this.txHex);

    return tx.inputs.map((input) => ({
      prevTxId: input.prevTxId.toString("hex"),
      prevTxOutputIndex: input.outputIndex,
      script: new bsv.Script(input._scriptBuffer).toASM(),
      // targetAdr: extractPublicKeyFromScript(input._scriptBuffer),
      sequenceNumber: input.sequenceNumber,
    }));
  }

  getOutputs(): TxOutput[] {
    const tx = bsv.Transaction(this.txHex);

    return tx.outputs.map((output, i) => ({
      script: new bsv.Script(output._scriptBuffer).toASM(),
      satoshis: output._satoshis,
      index: i,
      targetAdrHash: extractAddressFromPayToPublicKeyScript(
        new bsv.Script(output._scriptBuffer).toASM()
      ),
    }));
  }

  getId(): string {
    return getTxId(this.txHex);
  }

  getHash(): string {
    return this.getId();
  }

  toString() {
    return this.txHex;
  }
}

export default ReadOnlyTx;
