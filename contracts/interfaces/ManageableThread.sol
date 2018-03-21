pragma solidity ^0.4.19;

import "./Thread.sol";
import "./ManageableBoard.sol";


contract ManageableThread is Thread {
    ManageableBoard internal parentBoard;
    
    function ManageableThread(ManageableBoard _parentBoard) public {
        parentBoard = _parentBoard;
    }
    
    /**
     * Event called when a post is removed by the owner
     */
    event PostRemoved(uint postNumber);
    
    /**
     * Get an address of parent board of this thread
     */
    function getParentBoard() public view returns (address _parentBoard) {
        return parentBoard;
    }
    
    /**
     * Remove the post located at index provided
     * You can not remove the first post (postNumber == 0)
     * If you want to remove it, you have to use destructThread().
     * Please note destructThread() will delete all of posts on the thread from current state.
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