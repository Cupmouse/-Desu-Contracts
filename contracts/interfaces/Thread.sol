pragma solidity ^0.4.19;


/**
 * An interface for a thread
 */
contract Thread {
    /**
     * Event called when someone make post on this Thread
     */
    event NewPost(address addr, uint postNumber);
    
    /**
     * Post to this thread
     */
    function post(string text) external returns (bool success);

    /**
     * Return a address of poster of a post
     */
    function getPoster(uint postNumber) public view returns (address poster);

    /**
     * Return a title of this thread
     */
    function getTitle() public view returns (string);
    
    /**
     * Return a timestamp of a post
     */
    function getPostTimestamp(uint postNumber) public view returns (uint);
    
    /**
     * Return a text of a post
     */
    function getPostText(uint postNumber) public view returns (string);
}