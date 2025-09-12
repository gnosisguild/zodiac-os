// SPDX-License-Identifier: MIT

// implementation based on https://gist.github.com/Arachnid/6950b3367258b5d5033f6e1c411086e8
// cowswap contracts taken from https://github.com/cowprotocol/contracts/releases/tag/v1.3.2

pragma solidity ^0.8.12;

import "./cowProtocol/libraries/GPv2Order.sol";
import "./cowProtocol/mixins/GPv2Signing.sol";
import "./cowProtocol/interfaces/IERC20.sol";

contract CowswapOrderSigner {
    using GPv2Order for GPv2Order.Data;
    using GPv2Order for bytes;

    GPv2Signing public immutable signing;
    bytes32 public immutable domainSeparator;
    address public immutable deployedAt;

    constructor(GPv2Signing _signing) {
        require(address(_signing) != address(0), "Invalid signing address");
        signing = _signing;
        domainSeparator = _signing.domainSeparator();
        deployedAt = address(this);
    }

    function _setPreSignature(
        GPv2Order.Data calldata order,
        bool signed
    ) internal {
        require(address(this) != deployedAt, "DELEGATECALL only");

        // compute order UID
        bytes32 orderDigest = order.hash(domainSeparator);
        bytes memory orderUid = new bytes(GPv2Order.UID_LENGTH);
        orderUid.packOrderUidParams(orderDigest, address(this), order.validTo);

        signing.setPreSignature(orderUid, signed);
    }

    function signOrder(
        GPv2Order.Data calldata order,
        uint32 validDuration, // seconds
        uint256 feeAmountBP // basis points
    ) external {
        require(
            block.timestamp + validDuration > order.validTo,
            "Dishonest valid duration"
        );
        require(
            order.feeAmount <= (order.sellAmount * feeAmountBP) / 100_00 + 1,
            "Fee too high"
        );

        _setPreSignature(order, true);
    }

    function unsignOrder(GPv2Order.Data calldata order) external {
        _setPreSignature(order, false);
    }
}
