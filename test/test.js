const { Wallet } = require("../lib")





const [wallet, walletClarence, walletAntho] = [
  "awkward will execute giant dwarf few diagram era elite wage decade fame",
  "cloth reward eagle alert bamboo opinion stool wreck priority kangaroo task century",
  "mule innocent angle wide version canoe demise volcano visual enact duty brother"
]
  .map(key => new Wallet({ key, network: "testnet" }))




const test = async () => {

  const adr = wallet.getAddress();

  console.log({ adr })

}

test()


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