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

        return await App.getMyTokens();
    },
    //Funzione che restituisce tutti i token del proprietario che chiama tale funzione, da tali token vengono poi creati gli item.
    getMyTokens: async () => {
        let pokeNFTInstance;

        web3.eth.handleRevert = true;
        //Prendo la lista degli account e salvo nella variabile account il primo account che trovo, che farà da proprietario.
        await web3.eth.getAccounts(function(error, accounts) {
            
            if (error) {
                console.log(error);
            }

            const account = accounts[0];
            $('#acc').append("  (account: "+account+")");
            //Effettuo un deploy del contratto e creo quindi un'istanza.
            App.contracts.PokeNFT.deployed().then(async function(instance) {
                pokeNFTInstance = instance;
                try {
                    //Da tale istanza chiamo la funzione del contratto getMyTokens del proprietario e salvo i risultati nei due array items e ids
                    const results = await pokeNFTInstance.getMyTokens({ from: account });
                    const items = results[0];
                    const ids = results[1];

                    //Itero l'array items, castandolo come oggetto, e decodifico ogni item, dato che contiene l'URL del token codificato, avro quindi
                    //in result i parametri name, descriptio e l'URL image, successivamente assegno a result anche il tokenID corrispondente all'array ids.
                    //Di conseguenza posso poi creare l'item, tramite funzione createItem, passando il parametro result.
                    for (const [index, item] of Object.entries(items)) {
                        const json = atob(item.substring(29));    
                        const result = JSON.parse(json);
                        result.tokenId = ids[index].words[0];
                        $("#items").append(createItem(result));
                    }
                } catch (error) {
                    $("#items").append("<p>You currently don't have any tokens!</p>")
                }

            });

        });

    },
    //Funzione che crea l'item sul market, quando esso deve essere venduto.
    create: async (tokenId, price) => {
        let marketPokeInstance;
        let pokeNFTInstance;
        //Prendo la lista degli account e salvo nella variabile account, il primo della lista.
        await web3.eth.getAccounts(function(error, accounts) {
            
            if (error) {
                console.log(error);
            }
            const account = accounts[0];

            //Effettuo il deploy del contratto NFC e del mercato e successivamente creo le istanze.
            App.contracts.PokeNFT.deployed().then(function (instance) {                
                pokeNFTInstance = instance;
                
                App.contracts.MarketPoke.deployed().then(async function(instance) {
                    marketPokeInstance = instance;

                    try {
                        //Converto il valore ETH in WEI 
                        const priceInWei = await web3.utils.toWei(price);

                        const listingPrice = await marketPokeInstance.getListingPrice();
        
                        await pokeNFTInstance.setApprovalForAll(marketPokeInstance.address, true, {
                            from: account
                        });
                        //console.log(pokeNFTInstance.address);
                        await marketPokeInstance.create(pokeNFTInstance.address, tokenId, priceInWei, {
                            from: account,
                            value: listingPrice
                        });
                        window.location.href = "./my-nft?action=selling";
    
                    } catch (error) {
                        window.location.href = "./my-nft?action=error";
                    }
    
                });
    
            })
            
        });

    }

}

$(function() {
    $(window).load(function() {
        App.init();
    });
});

const createItem = (result) => {
    const item = `<div class="col-12 product-item animation-element slide-top-left">`
        + `<div class="product-container" style="height: 100%;padding-bottom: 0px;padding-top: 3px">`
        + `<div class="row">`
        + `<div class="col-md-12 col-lg-2" style="margin-top: 10px"><img class="img-fluid" src="${result.image}" style="display: block;margin-left: auto;margin-right: auto; width: 100px; height: 100px"></div>`
        + `<div class="col-12 col-lg-6">`
        + `<div class="row">`
        + `<div class="col-12" style="margin-top:25px; margin-bottom: 2px">`
        + `<h2 class ="text-dark d-inline" style="margin-top: 0px">Name: </h2>`
        + `<h2 class ="text-secondary d-inline">${result.name}</h2>`
        + `</div>`
        + `<div class="col-12">`
        + `<p class="text-dark d-inline" style="margin-top: 0px;margin-bottom: 0px">Description:</p>`
        + `<p class="text-secondary d-inline">${result.description}</p>`
        + `</div>`
        + `</div>`
        + `</div>`
        + `<div class="col-12 col-lg-4">`
        + `<div class="card shadow mb-1" style="margin-top: 0px;">`
        + `<div class="card-header py-2">`
        + `<h6 class="m-0 fw-bold" style="color: rgb(0,0,0)">You want to sell this token?</h6>`
        + `</div>`
        + `<div class="card-body">`
        + `<div class="user">`
        + `<div class="row">`
        + `<div class="mb-1 col-md-12 col-lg-8"><input id="price${result.tokenId}" class="form-control form-control-user" placeholder="Enter price in ETH" name="price"></div>`
        + `<div class="col-md-12 col-lg-4"><button class="btn btn-dark d-block btn-user w-100" onclick="sell(${result.tokenId})" type="submit" style="background: rgb(0,0,0);">Sell Now!</button></div>`
        + `</div>`
        + `</div>`
        + `</div>`
        + `</div>`
        + `</div>`
        + `</div>`
        + `</div>`
    return item;
}

async function sell(tokenId) {

    const price = $(`#price${tokenId}`).val();
    if (price == '') {
        toastr.error("Price is not valid!");
    } else {
        if (!/^(([0-9]+)(\.[0-9]+)?)$/.test(price)) {
            toastr.error("Price is not valid!");
        } else {
            if (price <= 0) {
                toastr.error("Price is not valid!");
            } else {
                await App.create(tokenId, price);
            }
        }
    }

}