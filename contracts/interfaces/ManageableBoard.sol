pragma solidity ^0.4.19;

import "./Board.sol";


contract ManageableBoard is Board {
    event ThreadDetached();
    
    modifier ownerOnly {
        require(msg.sender == owner);
        _;
    }
    
    // Making this internal visivility and create getter.
    // somehow from outside of this contract, executing getter is more cheaper. It's quite strange.
    address internal owner;
    
    function ManageableBoard(address _owner) public {
        owner = _owner;
    }
    
    /**
     * Get the owner address of this board
     */
    function getOwner() public view returns (address _owner) {
        return owner;
    }
    
    /**
     * Get internalId of the thread's index provided.
     * WARNING: Gas cost might REALLY high!
     */
    function getInternalIdOfIndex(uint index) public view returns (uint internalId);
    
    /**
     * Remove address of thread whose index is provided from this board
     * After calling this function, you are no longer able to see the thread
     * sitting on this board's thread list
     * WARNING: You *HAVE* to call lock() before calling this function.
     *          Because of what index is, index of the thread you want to detach
     *          might change during calling this thread; if another people made
     *          new thread on this board almost simultaneously and he/she's transaction
     *          was included before your 'detach thread' transaction,
     *          new thread will be the top thread, making your target thread's index to be +1,
     *          consequently detaching a non desired thread which was
     *          coincidentally the previous index thread.
     *          To prevent this, you *HAVE* to call lock() in advance.
     *          lock() will set this board locked state so no one other than the owner
     *          can not alter indexes of threads on your board. And then you perform
     *          this function. See lock() for more about locking feature.
     * NOTE: This will *NOT* erase thread itself from the current blockchain state.
     *       If you want to delete thread itself from the state, you need to call
     *       DesuThread.destructThread().
     * 
     * Only executable when the board is locked.
     * Only owner should be able to execute this function.
     */
    function detachThreadByIndex(uint index) public;
    
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
    function detachThreadByInternalId(uint internalId) public;
    
    /**
     * Lock this board. This board will be in locked state if you call this function.
     * During locked state, account other than the owner can not call functions
     * that will write changes to this board.
     * Often used when calling detachThreadByIndex(uint index).
     * We highly reccomend to notify people using it in advance if you are going to
     * lock your board. User might waste gas for nothing when it is entering locked state.
     * To unlock, call unlock().
     * 
     * Only owner should be able to execute this function.
     */
    function lock() public;
    
    /**
     * Unlock this board from locked state. About lock feature, See lock().
     * 
     * Only owner should be able to execute this function.
     */
    function unlock() public;
    
    /**
     * Destruct this board. This board contract will never come back to life.
     * Delete all data this board had from the current blockchain state.
     * Fund is going to be payed to the owner.
     * 
     * Only owner should be able to execute this function.
     */
    function destructBoard() public;
}
