// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "base64-sol/base64.sol";

//Viene definito un contratto che eredità le funzionalità di ERC721URIStorage, ovvero il contratto
//potrà gestire URI associati ai token.
contract PokeNFT is ERC721URIStorage {
    //Il contratto utilizzerà un contatore per identificate univocamente i token creati.
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    //evento emesso ogni volta che viene creato un nuovo token.
    event TokenCreated(string png, string tokenURI, uint256 tokenId);

    constructor() ERC721("PokeNFT", "PNFT") { }
    //Funzione che crea il token, passando i parametri nome, descrizione e un immagine png.
    function createToken(string memory name, string memory description, 
            string memory png) public returns (uint256) {
        //viene incrementato l'ID del token, appena viene chiamata la funzione
        //e viene passato l'ID corrente a tokenId.
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();
        //_safeMint crea l'nft passando l'ID del token al proprietario che chiama la funzione.
        _safeMint(msg.sender, tokenId);
        //viene creato l'URI del token e questo poi viene associato all'ID del token.
        string memory tokenURI = createTokenURI(name, description, png);
        _setTokenURI(tokenId, tokenURI);
        //viene emesso l'evento passando l'immagine, l'URI del token e l'ID del token.
        emit TokenCreated(png, tokenURI, tokenId);
        //viene restituito l'ID del token.
        return tokenId;
    
    }
    //Funzione che prende i tokens del proprietario che chiama tale funzione.
    function getMyTokens() public view returns (string[] memory, uint256[] memory) {
        //viene passato l'ID corrente a totalTokenCount che servirà come contatore,
        //e viene effettuato un controllo, se il contatore è maggiore di zero.
        uint256 totalTokenCount = _tokenIds.current();
        require(totalTokenCount > 0, "There are no tokens.");

        uint256 myTotalTokenCount = 0;
        //iterazione da 1 a totale di tokens esistenti e se l'ID del token
        //appartiene al proprietario che chiama la funzione, viene
        //incrementato la variabile che conta solo i token di tale proprietario
        for (uint256 i = 1; i < totalTokenCount + 1; i++) {            
            // Controllo se corrisponde il proprietario del token
            if (super.ownerOf(i) == msg.sender)
                myTotalTokenCount++;
        }
        //controllo se i token del proprietario sono maggiori di zero.
        require(myTotalTokenCount > 0, "Caller must be have at least 1 token.");

        //creo due array ids, myTokens, con grandezza della variabile che conta i token del proprietario.
        uint256 currentIndex = 0;
        uint256[] memory ids = new uint256[](myTotalTokenCount);
        string[] memory myTokens = new string[](myTotalTokenCount);
        //iterazione per assegnare agli array, i tokenURI del proprietario e gli ID dei token
        //(FORSE SI PUO CAMBIARE) è giusta cosi perchè altrimenti riassegno gli stessi ID a diversi token e non va bene.
        for (uint256 i = 1; i < totalTokenCount + 1; i++) {
            // Controllo se corrisponde il proprietario del token
            if (super.ownerOf(i) == msg.sender) {
                // Lo aggiungo nell'array e incremento
                myTokens[currentIndex] = super.tokenURI(i);
                ids[currentIndex] = i;
                currentIndex++; 
            }
        }
        // restituisce i due array myTokens, che contiene gli URI dei token del proprierario, e
        // ids, che contiene gli ID dei token del proprietario.
        return (myTokens, ids);

    }
    //Funzione che crea l'URI del token, passando i paramentri nome, descrizione e immagine png
    //(Cambiare imageURI con png)
    function createTokenURI(string memory name, string memory description, 
            string memory png) public pure returns (string memory) {
        //viene restituito quindi una stringa con una base e un JSON codificato in base64, avente come campi il nome, la descrizione e l'immagine png.
        string memory base = "data:application/json;base64,";
        return string(abi.encodePacked(
            base,
            Base64.encode(
                bytes(abi.encodePacked(
                    '{"name": "', name, '"', 
                    ', "description": "', description, '"', 
                    ', "attributes": ""',
                    ', "image": "', png, '" }'))
            )
        ));
    }
    // Funzione che serve solo per il testing 
    // Funzione che restituisce l'URI dell'immagine passata come parametro.
    // Format: data:image/png;base64,(Base64-encoding)
    function pngToImageURI(string memory png) public pure returns (string memory) {

        string memory base = "data:image/png;base64,";
        string memory base64encoded = Base64.encode(
            bytes(string(abi.encodePacked(png))));
        string memory imageURI = string(abi.encodePacked(base, base64encoded));
        return imageURI;
    
    }
}