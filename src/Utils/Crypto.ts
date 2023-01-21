import * as bsv from "bsv";
import { Encoders } from "..";

const getTxId = (tx_hex) => {
  const tx_buffer = Buffer.from(tx_hex, "hex");
  const hash_buff = bsv.crypto.Hash.sha256sha256(tx_buffer);
  const big_endian_str = hash_buff.toString("hex");
  const little_endian_str = big_endian_str.match(/../g).reverse().join("");
  return little_endian_str;
};

const sha256ripemd160 = (buffer: Buffer): Buffer => {
  return bsv.crypto.sha256ripemd160(buffer);
};

// const adrToHashV2 = (adr: string) => {
//  sha256ripemd160(
//     Encoders.Base58StrToBuffer(adrAntho).toString("hex")
//   // ),
// };

/**
 * ancienne version avec nom incorrecte
 */
const adrToAdrHashV1 = (adr) => {
  // * note:
  // adr: sha256ripemd160(
  //   Encoders.Base58StrToBuffer(adrAntho).toString("hex")
  // ),

  // ajouter les imports
  const Script = require("bsv/lib/script/script");
  const Address = require("bsv/lib/address");

  const script = Script.fromAddress(new Address(adr));
  const hashedAdr = script.toASM().split(" ")[2];

  return hashedAdr;
};

export { getTxId, sha256ripemd160, adrToAdrHashV1 as adrToAdrHash };
