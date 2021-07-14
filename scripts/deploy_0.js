const namehash = require('eth-ens-namehash');
const utils = require('web3-utils');

const { sha3 } = require('web3-utils')
// const { ethers } = require('ethers');

const { BigNumber:BN } = ethers
const tld = "test";
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

async function main() {
    const accounts = await ethers.getSigners()

    const ENSRegistry = await ethers.getContractFactory('ENSRegistry')
    const PublicResolver = await ethers.getContractFactory('PublicResolver')
    const FIFSRegistrar = await ethers.getContractFactory('FIFSRegistrar')
    const ReverseRegistrar = await ethers.getContractFactory('ReverseRegistrar')

    const ens = await ENSRegistry.deploy()
    await ens.deployed()
    console.log('ENS:', ens.address)

    // -- setup registrar
    const resolver = await PublicResolver.deploy(
        ens.address, '0x296E78Ed5bA3e81C7508514893CC93Cd6063d9c2')
    await resolver.deployed()
    console.log('RESOLVER:', resolver.address)

    const resolverNode = namehash.hash("resolver");
    const resolverLabel = sha3("resolver");
    await ens.setSubnodeOwner(
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        resolverLabel, accounts[0].address)
    await ens.setResolver(resolverNode, resolver.address)
    await resolver.functions['setAddr(bytes32,address)'](resolverNode, resolver.address)

    // -- setup registrar
    const registrar = await FIFSRegistrar.deploy(
        ens.address, namehash.hash(tld))
    await registrar.deployed()
    console.log('REGISTRAR:', registrar.address)
    await ens.setSubnodeOwner(
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        sha3(tld), registrar.address)

    // -- setup reverse registrar
    const reverseRegistrar = await ReverseRegistrar.deploy(
        ens.address, resolver.address)
    await reverseRegistrar.deployed()
    await ens.setSubnodeOwner(
        "0x0000000000000000000000000000000000000000000000000000000000000000", 
        sha3("reverse"), accounts[0].address);
    await ens.setSubnodeOwner(
        namehash.hash("reverse"), utils.sha3("addr"), 
        reverseRegistrar.address);
}

main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
});