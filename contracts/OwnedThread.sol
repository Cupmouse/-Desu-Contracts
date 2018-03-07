pragma solidity ^0.4.19;

import "./interfaces/PostRemovableThread.sol";


contract OwnedThread is PostRemovableThread {
    modifier ownerOnly {
        require(msg.sender == owner);
        _;
    }
    
    struct Post {
        address poster;
        uint timestamp;
        string text;
    }
    
    bytes32 constant private VERSION = "cupmouse-0.0.1";
    bytes32 constant private SUB_VERSION = "owned";
    
    address constant private NYAN_ADDRESS = 0x2222222222222222222222222222222222222222;
    
    address private owner;
    string private title;
    Post[] private posts;
    
    function OwnedThread(string _title, string text) public {
        require(bytes(text).length != 0);  // No content not allowed
        owner = msg.sender;
        
        title = _title;
        posts.length++; // Allocate a new array element
        posts[0] = Post(msg.sender, now, text);
    }
    
    function post(string text) external returns (bool success) {
        require(bytes(text).length != 0);  // Reject if there is no content
        
        uint postNumber = posts.length++;  // Increase array size by 1
        posts[postNumber] = Post(msg.sender, now, text);    // now means block.timestamp
        
        NewPost(msg.sender, postNumber);   // Call event NewPost
        
        return true;
    }
    
    function getTitle() public view returns (string _title) {
        return title;
    }

    function getPoster(uint postNumber) public view returns (address poster) {
        return posts[postNumber].poster;
    }
    
    function getPostTimestamp(uint postNumber) public view returns (uint timestamp) {
        return posts[postNumber].timestamp;
    }
    
    function getPostText(uint postNumber) public view returns (string text) {
        return posts[postNumber].text;
    }
    
    function removePost(uint postNumber) external ownerOnly returns (bool success) {
        require(postNumber < posts.length);
        require(postNumber != 0);    // The first post can not be removed, if you want to, use destructThread
        
        posts[postNumber] = Post(NYAN_ADDRESS, 0, "にゃーん");
        
        PostRemoved(msg.sender, postNumber);    // Call the event
        
        return true;
    }
    
    function getNukoboardThreadVersion() public view returns (bytes32) {
        return VERSION;
    }
    
    /**
     * Self destruct this thread
     * Remaining nukos are sent to the owner
     */
    function destructThread() public ownerOnly {
        selfdestruct(owner);
    }
}