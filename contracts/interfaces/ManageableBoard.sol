pragma solidity ^0.4.19;

import "./Board.sol";


// Idk but interface cannot inherit another interface.
// We have to specify all the interfaces when implement it
contract ManageableBoard is Board {
    event ThreadDetached();

    /**
     * Get internalId of the thread's index provided.
     * WARNING: Gas cost might REALLY high!
     */
    function getInternalIdOfIndex(uint index) public view returns (uint internalId);
    
    /**
     * Get bool value whether a board is locked or not
     */
    function isLocked() external view returns (bool _lock);
    
    /**
     * Do the same thing as detachThreadByIndex(uint index), but you have to provide
     * internalId of the thread you want to detach, not *INDEX*.
     * internalId is the consistent value in whole thread lifetime.
     * It won't change even if non owners make a thread at the same time.
     * So you don't have to call lock() beforehand, however, users can lose their
     * gas if this function have been executed before their function call like post() mined.
     * You might want either notify users before calling this or, as mentioned before,
     * call lock().
     * You can get internalId of specific index by calling getInternalIdOfIndex(uint).
     * 
     * Revert if internalId is out of bound
     * Only owner should be able to execute this function.
     */
    function detachThreadByInternalId(uint internalId) external;
    
    /**
     * Lock or unlock this board. This board will be in locked state if you call this function with lockState true.
     * During locked state, account other than the owner can not call functions
     * that will write changes to this board.
     * Often used when calling detachThreadByIndex(uint index).
     * We highly reccomend to notify people using it in advance if you are going to
     * lock your board. User might waste gas for nothing when it is entering locked state.
     * To unlock, call this function with lockState false.
     * 
     * Only owner should be able to execute this function.
     */
    function setLock(bool lockState) external;
    
    /**
     * Destruct this board. This board contract will never come back to life.
     * Delete all data this board had from the current blockchain state.
     * Fund is going to be payed to the owner.
     * 
     * Only owner should be able to execute this function.
     */
    function destructBoard() external;
}
