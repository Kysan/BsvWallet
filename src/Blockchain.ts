// * j'aurai pu faire des fonctions
// * mais je préfère une classe

import axios, { AxiosInstance } from "axios";
import { BsvNetwork } from "./HDPrivateKey";
import { splitInGroupOf } from "./Utils/GroupBy";
import AddressBalance from "./Utils/HTTPResponse/AddressBalance";
import { TxDetails } from "./Utils/HTTPResponse/TxDetails";
import { UnspendTransactionWoC } from "./Utils/HTTPResponse/UnspendTransaction";
import { WoCUtxo } from "./Utils/Tx";
import { AccountTxHistory } from "./Utils/TxHistory";
import { UTXO } from "./BIP32HDWallet";

type WhatsOnChainBsvNetwork = "main" | "test";

const translateNetworkNameFromBSVJSToWoC = (
  network: BsvNetwork
): WhatsOnChainBsvNetwork => {
  // *
  switch (network) {
    case "livenet":
      return "main";
    case "testnet":
      return "test";
    default:
      throw Error("untranslatable network name");
  }
};

class Blockchain {
  private api: AxiosInstance;

  constructor(network: BsvNetwork) {
    const networkName = translateNetworkNameFromBSVJSToWoC(network);

    this.api = axios.create({
      baseURL: `https://api.whatsonchain.com/v1/bsv/${networkName}`,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:15.0) Gecko/20100101 Firefox/15.0.1",
      },
    });

    // this.api.interceptors.request.use(async (req) => {
    //   return await new Promise((res) => setTimeout(() => res(req), 500));
    // });

    // this.api.interceptors.request.use((req) => {
    //   console.log(`${req.method.toUpperCase()} ${req.baseURL}${req.url}`);
    //   console.log(req.data);
    //   return req;
    // });

    // this.api.interceptors.response.use((res) => {
    //   console.log(res.data);
    //   return res;
    // });
  }

  public static getNetwork(network: BsvNetwork) {
    return new Blockchain(network);
  }

  /**
   * @param address
   * @returns the balance at a given adress
   */
  async getBalance(address: string): Promise<AddressBalance> {
    const { data } = await this.api.get(`/address/${address}/balance`);

    return data;
  }

  /**
   * @param address
   * @returns
   */
  async getBalancesFromAddresses(address: string[]) {
    // il faut split en groupe de 20
    const chunks = splitInGroupOf(address, 20);
    let res = [];
    for (let addresses of chunks) {
      const { data } = await this.api.post("/addresses/balance", {
        addresses,
      });
      res = [...res, ...data];
    }
    return res;
  }

  async getAddressInfo(address: string): Promise<any> {
    const { data } = await this.api.get(`/address/${address}/info`);

    return data;
  }

  async getBulkUTXO(addresses: string[]): Promise<
    {
      height: number;
      tx_pos: number;
      tx_hash: string;
      value: number;
      privateKeyIndex: number;
      ownerAddress: string;
    }[]
  > {
    const addressesGroups = splitInGroupOf(addresses, 20);
    const allUTXO = [];
    let i = 0;
    for (let addresses of addressesGroups) {
      const { data: UTXOData } = await this.api.post(`/addresses/unspent`, {
        addresses,
      });

      for (let { unspent, address } of UTXOData) {
        unspent.forEach((unspentOuput) => {
          allUTXO.push({
            ...unspentOuput,
            privateKeyIndex: i,
            ownerAddress: address,
          });
        });
        ++i;
      }
    }
    return allUTXO;
  }

  async getUnspendTxOuput(address: string): Promise<UnspendTransactionWoC[]> {
    try {
      var { data } = await this.api.get(`/address/${address}/unspent`);
    } catch (err) {
      console.log("error");
      console.log(err.response);
    }

    return data;
  }
  /**
   * @param txHex
   * @returns txhash also called tx id
   */
  async broadcast(txhex: string): Promise<any> {
    try {
      const { data } = await this.api.post(`/tx/raw`, { txhex });
      return data;
    } catch (err) {
      throw Error(err.response ? err.response.data : err);
    }
  }

  async getRawTx(txhash): Promise<string> {
    try {
      const { data } = await this.api.get(`/tx/${txhash}/hex`);
      return data;
    } catch (err) {
      console.log(err.response.data);
    }
  }

  async getTxDetails(txHash): Promise<TxDetails> {
    const { data } = await this.api.get(`tx/hash/${txHash}`);

    return data;
  }

  async getHistory(address: string): Promise<AccountTxHistory> {
    const { data } = await this.api.get(`/address/${address}/history`);

    return data;
  }

  async getBulkTxDetails(txHash: string[]) {
    try {
      var { data } = await this.api.post("/txs", {
        txids: txHash,
      });
    } catch (error) {
      console.log("What'sOnChain RPC error");
      // console.log({ error });
      process.exit();
    }

    type TxDetail = {
      hash: string;
      inputs: { hash: string; index: number }[];
      outputs: { index: number; to: string; satoshis: number }[];
      time: number;
    };
    const x: TxDetail[] = data
      .map(({ hash, vin, vout, time }) => ({ hash, vin, vout, time }))
      .map((tx) => ({
        hash: tx.hash,
        inputs: tx.vin.map((input) => ({
          hash: input.txid,
          index: input.vout,
        })),
        outputs: tx.vout.map((output) => ({
          index: output.n,
          to: (output?.scriptPubKey?.addresses || ["unknow"])[0],
          satoshis: output.value || -1,
        })),
        time: tx.time,
      }));

    return x;
  }
}

export default Blockchain;
