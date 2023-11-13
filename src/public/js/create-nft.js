let value;
App = {

    web3Provider: null,
    contracts: {},

    init: async () => {
        return await App.initWeb3();        
    },

    initWeb3: async () => {
        // Modern dapp browsers...
        if (window.ethereum) {
            App.web3Provider = window.ethereum;
            try {
            // Request account access
            await window.ethereum.request({ method: "eth_requestAccounts" });;
            } catch (error) {
            // User denied account access...
            console.error("User denied account access")
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            App.web3Provider = window.web3.currentProvider;
        }
        // If no injected web3 instance is detected, fall back to Ganache
        else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }
        web3 = new Web3(App.web3Provider);

        return await App.initContract();
    },

    initContract: async () => {
        await $.getJSON('../build/contracts/PokeNFT.json', function(data) {
            // Get the necessary contract artifact file and instantiate it with @truffle/contract
            const PokeNFTArtifact = data;
            App.contracts.PokeNFT = TruffleContract(PokeNFTArtifact);
          
            // Set the provider for our contract
            App.contracts.PokeNFT.setProvider(App.web3Provider);          
        });
        await $.getJSON('../build/contracts/MarketPoke.json', function(data) {
            // Get the necessary contract artifact file and instantiate it with @truffle/contract
            const MarketPokeArtifact = data;
            App.contracts.MarketPoke = TruffleContract(MarketPokeArtifact);
          
            // Set the provider for our contract
            App.contracts.MarketPoke.setProvider(App.web3Provider);          
        });
    },

    createNFT: async (name, description, png) => {
        let pokeNFTInstance;

        await web3.eth.getAccounts(function(error, accounts) {
            
            if (error) {
                console.log(error);
            }

            const account = accounts[0];
            console.log(account);
            App.contracts.PokeNFT.deployed().then(function(instance) {
                pokeNFTInstance = instance;
                console.log(png);
                return pokeNFTInstance.createToken(name, description, png, { from: account });
            }).then(function(result) {
                window.location.href = "./my-nft?action=created";
            }).catch(function(err) {
                window.location.href = "./my-nft?action=error";
            });

        });

    }

}

$(function() {
    $(window).load(function() {
        App.init();
        $("#createNFT").click(async () => {            
            const name = $("#name").val();
            const description = $("#description").val();
            const png = value;

            if (name == '' || description == '' || png == '') {
                toastr.error("Error in input fields...");
            } else {
                await App.createNFT(name, description, png);
            }

        });
    });
});