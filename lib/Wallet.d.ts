import HDPrivateKeyManager, { WalletConstructorParams } from "./HDPrivateKey";
import Blockchain from "./Blockchain";
import StasTokenSchema from "./Utils/Types/StasTokenSchema";
export declare type OutputRequest = {
    type: "normal" | "op return";
    to: string;
    amount: number;
    opReturnData: string;
};
export declare type UTXO = {
    privKeyIndex: number;
    txId: string;
    satoshis: number;
    outputIndex: number;
    script: any;
    ownerAddress: string;
};
declare class HDWallet extends HDPrivateKeyManager {
    blockchain: Blockchain;
    constructor(params: WalletConstructorParams | undefined);
    getAddress(): Promise<string>;
    /**
     * @param maxIndex this function with download the history of each derivated address from 0 to this
     * @returns
     */
    getUtxo(): Promise<UTXO[]>;
    signTx(output: OutputRequest | OutputRequest[]): Promise<any>;
    /**
     * broadcast the transaction
     * equivalent of
     * ```js
     * wallet.blockchain.boardcast(txHex)
     * ```
     * @param txHex
     * @returns txhash also called txid
     */
    broadcast(txHex: string): Promise<string>;
    getBalance(): Promise<number>;
    createTokenContractTx(schema: StasTokenSchema, supply: number): Promise<string>;
    getHistory(): Promise<{
        inputs: {
            index: number;
            to: string;
            satoshis: number;
            hash: any;
        }[];
        hash: string;
        outputs: {
            index: number;
            to: string;
            satoshis: number;
        }[];
        time: number;
    }[]>;
}
export default HDWallet;
