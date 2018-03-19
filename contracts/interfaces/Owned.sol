pragma solidity ^0.4.19;


contract Owned {
    modifier ownerOnly {
        require(msg.sender == owner);
        _;
    }
    
    address internal owner;
    
    function Owned(address _owner) public {
        owner = _owner;
    }
    
    function getOwner() public view returns (address _owner) {
        return owner;
    }
}