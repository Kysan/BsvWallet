import bsv from "bsv";
import { getTxId } from "./Utils/Crypto";
import {
  extractAddressFromPayToPublicKeyScript,
  getTxUnspendOutput,
} from "./Utils/Tx";

interface Input {
  prevTxId: string;
  prevTxOutputIndex: number;
  script: string;
  sequenceNumber: number;
}

interface Output {
  satoshis: number;
  script: string;
  index: number;
}

class ReadOnlyTx {
  private txHex: string;

  constructor(txHex: string) {
    this.txHex = txHex;
  }

  getInputs(): Input[] {
    const tx = bsv.Transaction(this.txHex);

    return tx.inputs.map((input) => ({
      prevTxId: input.prevTxId.toString("hex"),
      prevTxOutputIndex: input.outputIndex,
      script: new bsv.Script(input._scriptBuffer).toASM(),
      // targetAdr: extractPublicKeyFromScript(input._scriptBuffer),
      sequenceNumber: input.sequenceNumber,
    }));
  }

  getOutputs(): Output[] {
    const tx = bsv.Transaction(this.txHex);

    return tx.outputs.map((output, i) => ({
      script: new bsv.Script(output._scriptBuffer).toASM(),
      satoshis: output._satoshis,
      index: i,
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
