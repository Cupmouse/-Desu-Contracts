pragma solidity ^0.4.19;

import "./Thread.sol";


contract Board {
    /**
     * Event called when new thread is made
     */
    event NewThread(address poster, Thread thread);
    
    /**
     * Get a thread at index provided
     */
    function getThreadAt(uint index) public view returns (Thread thread);
    
    /**
     * Get a thread array ascending ordered by added time
     */
    function getThreadArray(uint index, uint maxCount) public view returns (Thread[] threads, uint foundCount);
    
    /**
     * Make new thread in this board
     * Newly created thread will be placed at the top in board (index = 0)
     */
    function makeNewThread(string title, string text) public;
}