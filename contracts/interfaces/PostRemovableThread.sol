pragma solidity ^0.4.19;

import "./Thread.sol";


contract PostRemovableThread is Thread {
    /**
     * Event called when a post is removed by executor
     */
    event PostRemoved(address executor, uint postNumber);
    
    /**
     * Remove the post located at index provided
     */
    function removePost(uint index) external returns (bool success);
}