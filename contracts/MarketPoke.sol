// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MarketPoke is ReentrancyGuard {

    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;

    address payable owner;
    uint256 listingPrice = 0.0025 ether;

    event ItemCreated(uint256 itemId, address nftContract, uint256 tokenId, 
        address seller, address owner, uint256 price, bool sold);

    constructor() {
        owner = payable(msg.sender);
    }

    struct Item {
        uint256 itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    mapping(uint256 => Item) private _idToItem;

    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

    function create(address nftContract, uint256 tokenId, uint256 price)
            public payable nonReentrant {
        // Verifico se il prezzo specificato è maggiore di 0 wei
        // e inoltre verifico che l'utente abbia inviato l'importo della tassa di 
        // inserzione corretto
        require(price > 0, "Price must be at least 1 wei.");
        require(msg.value == listingPrice, "Price must be equal to listing price.");

        _itemIds.increment();
        uint256 itemId = _itemIds.current();
        // Creo un nuovo item, che rappresenta l'NFT che l'utente sta mettendo in vendita.
        _idToItem[itemId] = Item(itemId,nftContract,tokenId,payable(msg.sender),payable(address(0)),price,false);
        // Emetto un evento per notificare che l'elemento è stato creato e messo in vendita
        emit ItemCreated(itemId, nftContract, tokenId, msg.sender, address(0), price, false);
        // Trasferisco l'NFT dal creatore(proprietario) al contratto del mercato
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
    }
    function buyNFT(address nftContract, uint256 itemId)
            public payable nonReentrant {
        uint price = _idToItem[itemId].price;
        uint tokenId = _idToItem[itemId].tokenId;
        require(msg.value == price, "Please submit the asking price in order to complete the purchase.");
        // Trasferisce l'importo pagato dall'acquirente al venditore del NFT.
        _idToItem[itemId].seller.transfer(msg.value);
        // L'NFT viene trasferito dal contratto al mittente della transazione, cioè l'acquirente
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
        // Aggiorna l'NFT con il nuovo proprietario, settandolo come venduto e incrementando il contatore degli
        // nft venduti
        _idToItem[itemId].owner = payable(msg.sender);
        _idToItem[itemId].sold = true;
        _itemsSold.increment();
        // Trasferisce l'importo della tassa di inserzione dal contratto al proprietario del contratto
        payable(owner).transfer(listingPrice);
    }
    // Funzione che restituisce i token non venduti
    function getUnsoldItems() public view returns (Item[] memory) {
        // Contatori che rispettivamentie restituiscono il numero totale di token, il numero totale di
        // token non venduti e inizializza un altro contatore
        uint itemCount = _itemIds.current();
        uint unsoldItemCount = _itemIds.current() - _itemsSold.current();
        uint currentIndex = 0;
        // Creo un array di items inizialmente vuoto e grande quanti sono gli items non venduti
        Item[] memory items = new Item[](unsoldItemCount);
        // Attraversa tutti gli elementi fino in quel momento generati.
        for (uint i = 1; i < itemCount + 1; i++) {
            // Controllo se l'elemento i ha indirizzo zero, ovvero se non è stato venduto
            if (_idToItem[i].owner == address(0)) {
                // Ottengo il suo identificativo
                uint currentId = _idToItem[i].itemId;
                // Ottengo il riferimento diretto all'oggetto di storage effettivo nel contratto associato all'identificativo
                Item storage currentItem = _idToItem[currentId];
                // L'elemento corrente viene inserito nell'array items all'indice corrente
                items[currentIndex] = currentItem;
                currentIndex = currentIndex + 1;
            }
        }
        return items;
    }
}