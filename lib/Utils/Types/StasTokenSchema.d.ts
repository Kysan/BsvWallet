interface Legal {
    terms: string;
    licenceId: string;
}
interface Issuer {
    organisation: string;
    legalForm: string;
    governingLaw: string;
    mailingAddress: string;
    issuerCountry: string;
    jurisdiction: string;
    email: string;
}
interface Legal2 {
    terms: string;
}
interface Meta {
    schemaId: string;
    website: string;
    legal: Legal2;
}
interface Properties {
    legal: Legal;
    issuer: Issuer;
    meta: Meta;
}
interface StasTokenSchema {
    name: string;
    tokenId: string;
    protocolId: string;
    symbol: string;
    description: string;
    image: string;
    totalSupply: number;
    decimals: number;
    satsPerToken: number;
    properties: Properties;
}
export default StasTokenSchema;
