import { P2PWallet } from "../src";

/*
const [wallet, walletClarence, walletAntho] = [
  "awkward will execute giant dwarf few diagram era elite wage decade fame",
  "cloth reward eagle alert bamboo opinion stool wreck priority kangaroo task century",
  "mule innocent angle wide version canoe demise volcano visual enact duty brother"
]
.map(key => new Wallet({ key, network: "testnet" }))*/

//   key: "donor decrease room rice series race twin blur oblige beef dolphin script",
// const myWallet = new Wallet({
//   key: "mule innocent angle wide version canoe demise volcano visual enact duty brother",
//   network: "testnet",
// });

const test = async () => {
  const myWallet = new P2PWallet({
    key: "mule innocent angle wide version canoe demise volcano visual enact duty brother",
    network: "testnet",
  });

  const bob = new P2PWallet({
    network: "testnet",
    key: "repair series evil fish river inmate cherry gesture west dragon window apple",
  });

  const alice = new P2PWallet({
    network: "testnet",
    key: "bicycle ability what march case globe essence thank design omit home list",
  });

  const showAllBalance = async () => {
    console.log({
      myAdr: myWallet.getAddress(),
      aliceAdr: alice.getAddress(),
      mine: myWallet.getBalance(),
      alice: alice.getBalance(),
      bob: bob.getBalance(),
    });
  };

  const syncWithBlockchain = async () => {
    await myWallet.downloadUTXO();
    await alice.downloadUTXO();
    // await bob.downloadUTXO();
  };

  await syncWithBlockchain();
  // console.log({
  //   myUtxo: myWallet.cache.unspendOuputs,
  //   aliceUtxo: alice.cache.unspendOuputs,
  // });

  console.log({
    aliceAdrs: [alice.getNewAddress(), alice.getNewAddress()],
  });

  // const tx1 = await myWallet.signTx({
  //   to: alice.getAddress(12),
  //   amount: 500,
  // });

  // await alice.receive(tx1);

  await showAllBalance();

  // console.log({
  //   mine: await myWallet.getBalance(),
  //   alice: await alice.getBalance(),
  //   bob: await bob.getBalance(),
  // });

  // await alice.receive(txHex);
  // await bob.receive(txHex);

  // console.log({ tx: txHex });
};

test();

/*

const test = async () => {
  const [adrAntho] = walletAntho.getAddresses(0, 3);
  const [adrClarence] = walletClarence.getAddresses(0, 3);

  wallet.lastUnusedAddressIndex = 100;
  console.log({
    balance: await wallet.getBalance()
  })

  const symbol = "MCT"
  const supply = 1000;
  const schema =
  {
    name: 'Example Token',
    protocolId: '<protocol id>',
    symbol: symbol,
    description: 'Example token ',
    image: 'https://www.taal.com/wp-content/themes/taal_v2/img/favicon/favicon-96x96.png',
    totalSupply: supply,
    decimals: 0,
    satsPerToken: 1,
    properties: {
      legal: {
        terms: '© 2020 TAAL TECHNOLOGIES SEZC\nALL RIGHTS RESERVED. ANY USE OF THIS SOFTWARE IS SUBJECT TO TERMS AND CONDITIONS OF LICENSE. USE OF THIS SOFTWARE WITHOUT LICENSE CONSTITUTES INFRINGEMENT OF INTELLECTUAL PROPERTY. FOR LICENSE DETAILS OF THE SOFTWARE, PLEASE REFER TO: www.taal.com/stas-token-license-agreement',
        licenceId: '1234'
      },
      issuer: {
        organisation: 'Blocksteed Tutorials',
        legalForm: 'Limited Liability Public Company',
        governingLaw: 'UK',
        mailingAddress: '1 Industry Way, Purham',
        issuerCountry: 'UK',
        jurisdiction: '',
        email: 'info@example.com'
      },
      meta: {
        schemaId: 'token1',
        website: 'website of the issuer',
        legal: {
          terms: 'the terms of the issuer'
        }
      }
    }
  }

  const contractTxHex = await wallet.createTokenContractTx(schema, 1000)
  wallet.broadcast(contractTxHex)

  
}

test()




*/
