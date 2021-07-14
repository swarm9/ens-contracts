const { ethers } = require('hardhat')
const namehash = require('eth-ens-namehash')
const utils = require('web3-utils');
const { sha3 } = require('web3-utils')
const { provider:P } = ethers
const tld = "eth";


async function tldis(ens) {
    const accounts = await ethers.getSigners()
    const TLD = 'is'
    const PublicResolver = await ethers.getContractFactory('PublicResolver')
    const R0 = await PublicResolver.deploy(ens.address, ethers.constants.AddressZero)
    await R0.deployed()
    console.log('R0:', R0.address)
    console.log('____ 1')
    await ens.setSubnodeOwner(
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        sha3('is'), accounts[0])
    console.log('____ 2')
    await ens.setResolver(namehash.hash('O8.is'), R0.address)
    await ens.setResolver(namehash.hash('O2.is'), R0.address)
    console.log('____ 3')
    await R0.functions['setAddr(bytes32,address)'](namehash.hash('O8.is'), ethers.utils.getAddress('0x1111111111111111111111111111111111111111'))
    await R0.functions['setAddr(bytes32,address)'](namehash.hash('O2.is'), ethers.utils.getAddress('0x2222222222222222222222222222222222222222'))
    console.log('____ 4')


}

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
    console.log('REVERSE_REGISTRAR:', reverseRegistrar.address)
    await ens.setSubnodeOwner(
        "0x0000000000000000000000000000000000000000000000000000000000000000", 
        sha3("reverse"), accounts[0].address);
    await ens.setSubnodeOwner(
        namehash.hash("reverse"), utils.sha3("addr"), 
        reverseRegistrar.address);

    // var r0 = await ens.resolver(namehash.hash('alias.test'))
    P._network.ensAddress = ens.address
    console.log(P._network)
    
    var R0 = await PublicResolver.attach(await ens.resolver(namehash.hash('resolver')))
    console.log(await R0.functions['addr(bytes32)'](namehash.hash('resolver')))

    var R1 = await P.getResolver('resolver')
    R1.name = 'root-resolver'
    
    console.log(await P.resolveName('resolver'))
    console.log(R1.name)

    await tldis(ens)
}

main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
});