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
        await $.getJSON('../build/contracts/PokeNFT.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with @truffle/contract
            const PokeNFTArtifact = data;
            App.contracts.PokeNFT = TruffleContract(PokeNFTArtifact);

            // Set the provider for our contract
            App.contracts.PokeNFT.setProvider(App.web3Provider);
        });
        await $.getJSON('../build/contracts/MarketPoke.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with @truffle/contract
            const MarketPokeArtifact = data;
            App.contracts.MarketPoke = TruffleContract(MarketPokeArtifact);

            // Set the provider for our contract
            App.contracts.MarketPoke.setProvider(App.web3Provider);
        });

        return await App.getUnsoldItems();
    },

    getUnsoldItems: async () => {
        let marketPokeInstance;
        let soccerPlayerInstance;

        web3.eth.handleRevert = true;

        await web3.eth.getAccounts(function (error, accounts) {

            if (error) {
                console.log(error);
            }

            const account = accounts[0];

            App.contracts.PokeNFT.deployed().then(function (instance) {
                soccerPlayerInstance = instance;

                App.contracts.MarketPoke.deployed().then(async function (instance) {
                    marketPokeInstance = instance;

                    try {

                        const items = await marketPokeInstance.getUnsoldItems({ from: account });
                        if (items.length > 0) {
                            for (const item of items) {
                                const tokenId = item[2];
                                const tokenURI = await soccerPlayerInstance.tokenURI(tokenId);
                                const json = atob(tokenURI.substring(29));
                                const result = JSON.parse(json);
                                result.itemId = item[0];
                                result.price = item[5];
                                result.acc = item[3];
                                $("#items").append(createItem(result));
                            }
                        } else {
                            $("#items").append("<p>There are currently no tokens for sale!</p>")
                        }
                    } catch (error) {
                        $("#items").append("<p>There are currently no tokens for sale!</p>")
                    }

                });

            })

        });

    },

    buyNFT: async (itemId, price) => {
        let marketPokeInstance;

        await web3.eth.getAccounts(function (error, accounts) {

            if (error) {
                console.log(error);
            }

            const account = accounts[0];

            App.contracts.PokeNFT.deployed().then(function (instance) {
                soccerPlayerInstance = instance;

                App.contracts.MarketPoke.deployed().then(async function (instance) {
                    marketPokeInstance = instance;

                    try {

                        await marketPokeInstance.buyNFT(soccerPlayerInstance.address, itemId, {
                            from: account,
                            value: price
                        });
                        window.location.href = "./my-nft?action=buyed";

                    } catch (error) {
                        window.location.href = "./my-nft?action=error";
                    }

                });

            });

        });

    }

}

$(function () {
    $(window).load(function () {
        App.init();
    });
});

const createItem = (result) => {
    const item = `<div class="col-12 product-item animation-element slide-top-left">`
        + `<div class="product-container" style="height: 100%;padding-bottom: 0px;padding-top: 3px">`
        + `<div class="row">`
        + `<div class="col-md-12 col-lg-2" style="margin-top: 0px"><img class="img-fluid" src="${result.image}" style="display: block;margin-left: auto;margin-right: auto"></div>`
        + `<div class="col-12 col-lg-7">`
        + `<div class="row">`
        + `<div class="col-12" style="margin-top:10px; margin-bottom: 0px">`
        + `<h2 class ="text-dark d-inline">Name: </h2>`
        + `<h2 class ="text-secondary d-inline">${result.name}</h2>`
        + `</div>`
        + `<div class="col-12" style="margin-top: 0px;margin-bottom: 2px">`
        + `<p class="text-dark d-inline">Description:</p>`
        + `<p class="text-secondary d-inline">${result.description}</p>`
        + `</div>`
        + `<div class="col-12" style="margin-top: 0px;margin-bottom: 5px">`
        + `<p class="text-dark d-inline" >Seller: </p>`
        + `<p class="text-secondary d-inline">${result.acc}</p>`
        + `</div>`
        + `</div>`
        + `</div>`
        + `<div class="col-12 col-lg-3">`
        + `<div class="row">`
        + `<div class="col-6"><button class="btn btn-light" style="border-radius: 125px;background: rgb(0,0,0); margin-top:40px" onclick="buy(${result.itemId}, ${result.price})" type="button">Buy Now!</button></div>`
        + `<div class="col-6">`
        + `<p class="product-price" style="margin-top: 43px">${web3.utils.fromWei(result.price)} ETH</p>`
        + `</div>`
        + `</div>`
        + `</div>`
    return item;
}

async function buy(itemId, price) {

    await App.buyNFT(itemId, price);

}