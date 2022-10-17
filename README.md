# BsvWallet ⚡🔑

A simple JavaScript library for Bitcoin SV (BSV)

- enable peer to peer transactions ✅
- Typescript and JavaScript autocomplete ✅
- browser & node friendly ✅
- ❤️ easy to use ❤️

Current features:

- create a wallet (new private key)
- import a wallets (from a private key)
- get wallet address
- sign a transactions (send money)
- send/broadcast a transactions
- get wallet balance
- get wallet tx history
- read blockchain data

Next features:

- Hierarchical Deterministic (HD) Wallet at 0 technical cost
- Stas token (easy NFT minting)

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
const myMnemonic = "awkward will execute giant ...";

const wallet = new Wallet({ key: myMnemonic });
```

#### Import with a seed string

```js
const seed = "Kwn6yDoKobVjH2dqa9UZ4c5yXfUQQo6PxdQ...";

const walet = new Wallet({ key: seed, keyFormat: "string" });
```

#### Create a new Wallet and get the mnemonic

```js
const wallet = new Wallet(); // just pass nothing
const privateKey = wallet.getPrivateKey(); // ->  "awkward will angle wide ... canoe demise execute"
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
// * we import two wallets
const walletBob = new Wallet(key: "bob private key");
const walletAlice = new Wallet(key: "alice private key");


// * sign a tx for Alice with the bob wallet
const txForAlice = await walletBob.signTx({
  to: walletAlice.getAddress(),
  amount: 1234
});

// right now the tx is signed but not in the bsv blockchain
// (like a signed check but not delivered to the bank)
// to do so you will have to broadcast it

walletBob.broadcast(txForAlice) // return the tx id
```

## Dev note

If you wish to contribute or encounter any issu :  
you can contact me on discord `@Kysan#8315` or by email at `pro.kysan@protonmail.com`
