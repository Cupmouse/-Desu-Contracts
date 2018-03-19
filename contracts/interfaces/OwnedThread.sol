pragma solidity ^0.4.19;

import "./Thread.sol";
import "./Owned.sol";


contract OwnedThread is Thread, Owned {
    /**
     * Event called when a post is removed by the owner
     */
    event PostRemoved(uint postNumber);
    
    /**
     * Remove the post located at index provided
     */
    function removePost(uint index) public;
}