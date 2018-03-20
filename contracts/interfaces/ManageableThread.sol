pragma solidity ^0.4.19;

import "./Thread.sol";
import "./ManageableBoard.sol";


contract ManageableThread is Thread {
    /**
     * This modifier only accepts if msg.sender is the owner of parent board of this thread
     */
    modifier boardOwnerOnly {
        require(msg.sender == parentBoard.getOwner());
        _;
    }
    
    ManageableBoard public parentBoard;
    
    function ManageableThread(ManageableBoard _parentBoard) public {
        parentBoard = _parentBoard;
    }
    
    /**
     * Event called when a post is removed by the owner
     */
    event PostRemoved(uint postNumber);
    
    /**
     * Remove the post located at index provided
     * Only board owner should be able to call
     */
    function removePost(uint index) public;
    
    /**
     * Self destruct this thread
     * Remaining nukos are sent to the owner
     * Only board owner should be able to call
     */
    function destructThread() public;
}