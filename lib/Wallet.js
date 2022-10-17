"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const HDPrivateKey_1 = __importDefault(require("./HDPrivateKey"));
const bsv_1 = __importDefault(require("bsv"));
const address_1 = __importDefault(require("bsv/lib/address"));
const Blockchain_1 = __importDefault(require("./Blockchain"));
const Crypto_1 = require("./Utils/Crypto");
class HDWallet extends HDPrivateKey_1.default {
    constructor(params) {
        const _a = params || {}, { key = "", keyFormat = "mnemonic", language = "ENGLISH", network = "livenet" } = _a, options = __rest(_a, ["key", "keyFormat", "language", "network"]);
        super(Object.assign({ key, keyFormat, language, network }, options));
        this.blockchain = new Blockchain_1.default(network);
    }
    getAddress() {
        return super.getAddress(0).toString();
    }
    /**
     * @param maxIndex this function with download the history of each derivated address from 0 to this
     * @returns
     */
    getUtxo() {
        return __awaiter(this, void 0, void 0, function* () {
            const utxo = yield this.blockchain.getBulkUTXO([this.getAddress()]);
            const allUTXO = utxo.map((utxo) => {
                const ownerAddress = this.getDerivatedAddress(utxo.privateKeyIndex);
                const improvedData = {
                    privKeyIndex: utxo.privateKeyIndex,
                    txId: utxo.tx_hash,
                    satoshis: utxo.value,
                    outputIndex: utxo.tx_pos,
                    script: bsv_1.default.Script(new address_1.default(ownerAddress)),
                    ownerAddress: utxo.ownerAddress,
                };
                return improvedData;
            });
            return allUTXO;
        });
    }
    signTx(output) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO : checker si le montant en utxo est disponible
            const tx = new bsv_1.default.Transaction();
            // * on charge les inputs
            const utxo = yield this.getUtxo();
            tx.from(utxo);
            // * on charge les ouputs
            if (Array.isArray(output)) {
                output.forEach(({ to: address, amount }) => tx.to(address, amount));
            }
            else {
                tx.to(output.to, output.amount);
            }
            // * ou oublie pas l'addresse de change
            const myAdr = this.getAddress();
            tx.change(myAdr);
            // * on récupères la clef privée qui correspond à chaque utxo
            const privateKeys = utxo.map((utxo) => this.getDerivatedPrivateKey(utxo.privKeyIndex));
            // TODO: prendre en compte les clefs privées en double dans cette liste
            // * et enfin on signe la transaction
            const txHex = tx.sign(privateKeys);
            return txHex.toString();
        });
    }
    /**
     * broadcast the transaction
     * equivalent of
     * ```js
     * wallet.blockchain.boardcast(txHex)
     * ```
     * @param txHex
     * @returns txhash also called txid
     */
    broadcast(txHex) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.blockchain.broadcast(txHex);
            return (0, Crypto_1.getTxId)(txHex);
        });
    }
    getBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            const utxo = yield this.getUtxo();
            // console.log({ utxo });
            const totalSat = utxo.reduce((total, utxo) => total + utxo.satoshis, 0);
            // TODO: return confirmed et unconfirmed seperatly
            return totalSat;
        });
    }
    // * tout les utxo doivent être sur la clef d'indexe 0
    createTokenContractTx(schema, supply) {
        return __awaiter(this, void 0, void 0, function* () {
            const adr = this.getAddress();
            const publicKeyHash = (0, Crypto_1.adrToAdrHash)(adr);
            // * on crée notre script avec le schema du token
            const contractScript = bsv_1.default.Script.fromASM(`OP_DUP OP_HASH160 ${publicKeyHash} OP_EQUALVERIFY OP_CHECKSIG`);
            contractScript.add(bsv_1.default.Script.buildDataOut(JSON.stringify(schema)));
            // * on crée la transaction
            const tx = new bsv_1.default.Transaction();
            // on récupère les utxo
            const utxo = yield this.getUtxo();
            tx.from(utxo); // on les mets en input
            // * puis on met notre script custom en output
            tx.addOutput(new bsv_1.default.Transaction.Output({
                script: contractScript,
                satoshis: supply,
            }));
            // on oublie pas de récupéré ce qui est en trop dans nos utxo
            tx.change(adr);
            const privateKeys = utxo.map((utxo) => this.getDerivatedPrivateKey(utxo.privKeyIndex));
            // * puis on signe le tout
            tx.sign(privateKeys);
            // * et enfin on retourne la transaction à broadcast
            return tx.toString();
        });
    }
}
exports.default = HDWallet;
