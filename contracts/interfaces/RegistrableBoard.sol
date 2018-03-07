pragma solidity ^0.4.19;

import "./Board.sol";


contract RegistrableBoard is Board {
    /**
     * Register provided thread into this board, it will be added to the top of the thread list
     * If provided contract is not Thread contract or has no compatible version, it throws
     */
    function registerThread(Thread thread) external returns (bool success);
}