# BsvWallet ⚡🔑

A simple JavaScript library for Bitcoin SV (BSV)

- enable peer to peer transactions ✅
- Typescript and JavaScript autocomplete ✅
- browser & node friendly ✅
- ❤️ easy to use ❤️

Current features:

- create your wallet (new private key)
- import your wallet (from a private key)
- get your wallet address
- sign a transactions
- broadcast a transactions
- send money (sign & then broadcast your tx)
- get your wallet balance
- get your wallet tx history
- read blockchain data
- work offline (P2PWallet)

  Next features:

- Stas token (easy NFT minting)
- Hierarchical Deterministic (HD) Wallet at 0 technical cost
- More stable RPC than Whatsonchain

## How to install

```bash
npm i bsv-wallet
```

## How to import

### Typescript

```ts
const { Wallet } from "bsv-wallet"
```

### Javascript

```js
const { Wallet } = require("bsv-wallet");
```

## How to use

#### Import a wallet

```js
const wallet = new Wallet({ key: "awkward will execute giant ..." });
```

#### Create a new Wallet and get the mnemonic

```js
const wallet = new Wallet(); // just pass nothing
const key = wallet.getPrivateKey(); // ->  "awkward will angle wide ... canoe demise execute"
```

#### Get your balance

```js
const balanceInSatoshis = await wallet.getBalance();

console.log({ balanceInSatoshis });
```

#### Get your address

```js
const myAddress = await wallet.getAddress();

console.log({ myAddress });
```

#### Sign a tx for your friend

```js
const friendAdr = "oKobVjH2dqa9U...";

const txHex = await wallet.signTx({
  to: friendAdr,
  amount: 5000,
});
```

#### Broadcast it to the blockchain

```js
const txHex = "...";

const txId = await wallet.broadcast(txHex);
// return the tx id if it worked else it will throw an error
```

## Exemple: Bob sending money to Alice

```js
const walletBob = new Wallet(key: "bob private key");

const transactionId = await walletBob.sendMoney({
  to: "alice address",
  amount: 1234
});

```

## Dev note

If you wish to contribute or encounter any issues
please contact me on discord `@Kysan#8315` or by email at `pro.kysan@protonmail.com`
