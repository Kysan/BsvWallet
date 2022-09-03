import { adrToAdrHash, getTxId } from "./Crypto";

import bsv from "bsv";

class Tx {
  // * à faire plus tard
  private inputs: any[];
  private outputs: any[];

  addInput(input: any) {}

  addOutput(output: any) {}

  sign(keyOrKeys: string | string[]): string {
    return "";
  }
}

export type WoCUtxo = {
  satoshis: number;
  script: any;
  txid: string;
  vout: number;
};

/**
 * retourne les outputs d'une transaction
 * sous une forme qui permet de s'en servir comme donnée d'input
 * pour signer une transaction
 * depuis une tx en hexa
 * @param {string} tx_hex la tx en hexa
 */
const getTxUnspendOutput = (
  tx_hex: string,
  givenAdr: string
): Array<WoCUtxo> => {
  // TODO: checker si il y a pas une transaction dans le cache qui fait référence à celle si
  const tx = new bsv.Transaction(tx_hex);
  const outputsData = tx.toObject().outputs;

  // * à faire : fonction getTxOutputInfo qui fait très exactement ça
  const outputs = outputsData.map(({ satoshis, script }) => {
    const scriptData = new bsv.Script(script);
    const targetAdrHash = scriptData.toASM().split(" ")[2];
    return { satoshis, script, targetAdrHash };
  });

  const utxo = outputs.filter(
    (txOutput) => txOutput.targetAdrHash == adrToAdrHash(givenAdr)
  );

  return utxo.map((tx, i) => {
    const { satoshis, script } = tx;
    // * je prend juste pas targetAdrHash & j'ajoute l'identifiant de la tx
    return { satoshis, script, txid: getTxId(tx_hex), vout: i };
  });
};

/**
 * retourne les utxo dans une liste de transaction encodé en hexadécimal
 */
const getUtxos = (hex_txs: string[], ofAdr: string) => {
  const utxoData = hex_txs.map((tx) => getTxUnspendOutput(tx, ofAdr));

  const utxo = utxoData.flatMap((e) => e);
  return utxo;
};

/**
 * retourne le montant total transferé à un adresse donnée à partir d'une liste de transaction
 */
const getTotalSatoshisInUtxos = (utxo: WoCUtxo[]) => {
  const totalSatoshis = utxo.reduce(
    (total, nextUtxo) => total + nextUtxo.satoshis,
    0
  );
  return totalSatoshis;
};

/**
 * retourne le montant en satoshis pour une adresse donnée dans une liste de tx
 */
const getTotalSatoshisInTxForAdr = (txs: string[], adr: string) => {
  const utxoForThisAdr = getUtxos(txs, adr);
  return getTotalSatoshisInUtxos(utxoForThisAdr);
};

/**
 * verifie si un montant donnée à bien été transferé à une adresse donnée
 */
const verifyTxTotalAmount = (
  txs: string[],
  requiredAmount: number,
  toAdr: string
) => {
  const totalAmountOfSatoshisInTxs = getTotalSatoshisInTxForAdr(txs, toAdr);
  return totalAmountOfSatoshisInTxs >= requiredAmount;
};

export {
  getTxUnspendOutput,
  getUtxos,
  getTotalSatoshisInUtxos,
  verifyTxTotalAmount,
  getTotalSatoshisInTxForAdr,
};
