pragma solidity ^0.4.19;

import "./Thread.sol";


contract Board {
    
    /**
     * Get a thread at index provided
     */
    function getThread(uint index) public view returns (Thread thread);
    
    /**
     * Throw if...
     * 1. thread was NOT actually thread contract
     * 2. thread was NOT compatible with this board
     */
    function testVersionCompatible(Thread thread) internal view;
}