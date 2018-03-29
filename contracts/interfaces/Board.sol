pragma solidity ^0.4.19;

import "./Thread.sol";


interface Board {
    /**
     * Event called when a thread on this board was bumped
     */
    event ThreadBumped();
    
    /**
     * Event called when new thread is made
     */
    event NewThread(address poster, Thread thread);
    
    /**
     * Bump a thread. Bumped thread will be top thread on this board.
     * No one other than thread contract, which has been attached to this
     * board, can call this function. It will simply be reverted.
     * That means msg.sender has to be thread.
     */
    function bumpThread() external;
    
    /**
     * Make new thread in this board
     * Newly created thread will be placed at the top in board (index = 0)
     */
    function makeNewThread(string title, string text) external;
    
    /**
     * Get a thread at index provided
     */
    function getThreadAt(uint index) external view returns (Thread thread);
    
    /**
     * Get the first thread
     */
    function getFirstThread() external view returns (Thread firstThread);
    
    /**
     * Get a thread array ascending ordered by added time, with maximum size of maxCount
     * Returned array size is *FIXED*, contains maximum threads of maxCount, and exact amount as foundCount that also returns
     * foundCount is the amount of threads actually included in the array returns
     * Start at fromIndex, try to get maxCount amount of threads, but if it reaches last element before that,
     * return imcomplete array
     * Revert if fromIndex >= numberOfThreads
     */
    function getThreadArray(uint fromIndex, uint maxCount) external view returns (Thread[] threads, uint foundCount);
    
    /**
     * Get the number of threads this board have
     */
    function getNumberOfThreads() external view returns (uint numberOfThreads);
}