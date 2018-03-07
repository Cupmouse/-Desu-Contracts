pragma solidity ^0.4.19;

import "./interfaces/RegistrableBoard.sol";
import "./ThreadList.sol";


contract OwnedBoard is RegistrableBoard {
    modifier ownerOnly {
        require(msg.sender == owner);
        _;
    }
    
    bytes32 constant private COMPATIBLE_THREAD_VERSION = "cupmouse-0.0.1";

    address public owner;
    ThreadList private threadList;

    function OwnedBoard() public {
        owner = msg.sender;
        threadList = new ThreadList();
    }
    
    function registerThread(Thread thread) external returns (bool success) {
        testVersionCompatible(thread);  // Test if thread is actually Thread contract and also its version
        
        threadList.addFirst(thread);    // Add thread at the top of the list
        
        return true;
    }
    
    function getThread(uint index) public view returns (Thread thread) {
        return threadList.get(index);
    }
    
    function testVersionCompatible(Thread thread) internal view {
        require(thread.getNukoboardThreadVersion() == COMPATIBLE_THREAD_VERSION);
    }

    function destructBoard() public ownerOnly {
        selfdestruct(owner);
    }
}