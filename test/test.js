
const { P2PWallet } = require("./../lib")





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