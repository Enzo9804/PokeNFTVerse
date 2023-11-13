const PokeNFT = artifacts.require('PokeNFT');
const MarketPoke = artifacts.require('MarketPoke');

module.exports = function(deployer) {
    deployer.deploy(MarketPoke);
    deployer.deploy(PokeNFT);
}