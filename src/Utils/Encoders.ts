import * as bsv from "bsv";

const base58_chars =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

const create_base58_map = () => {
  const base58M = Array(256).fill(-1);
  for (let i = 0; i < base58_chars.length; ++i)
    base58M[base58_chars.charCodeAt(i)] = i;

  return base58M;
};
const base58Map = create_base58_map();

const BufferToBase58 = (buff: Buffer) => {
  const uint8array = buff.toJSON().data;
  const result = [];

  for (const byte of uint8array) {
    let carry = byte;
    for (let j = 0; j < result.length; ++j) {
      const x = (base58Map[result[j]] << 8) + carry;
      result[j] = base58_chars.charCodeAt(x % 58);
      carry = (x / 58) | 0;
    }
    while (carry) {
      result.push(base58_chars.charCodeAt(carry % 58));
      carry = (carry / 58) | 0;
    }
  }

  for (const byte of uint8array)
    if (byte) break;
    else result.push("1".charCodeAt(0));

  result.reverse();

  return String.fromCharCode(...result);
};

const Base58StrToBuffer = (str: string): Buffer => {
  return bsv.encoding.Base58.decode(str);
};

export { BufferToBase58, Base58StrToBuffer };
