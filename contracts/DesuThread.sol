pragma solidity ^0.4.19;

import "./interfaces/ManageableThread.sol";
import "./DesuBoard.sol";


contract DesuThread is ManageableThread {
    struct Post {
        address poster;
        uint timestamp;
        string text;
    }
    
    address constant private NYAN_ADDRESS = 0x2222222222222222222222222222222222222222;
    
    string private title;
    Post[] private posts;
    
    function DesuThread(DesuBoard parentBoard, string _title, string text) public ManageableThread(parentBoard) {
        require(bytes(text).length != 0);  // No content not allowed
        
        title = _title;
        posts.length++; // Allocate a new array element
        posts[0] = Post(msg.sender, now, text);
    }
    
    function post(string text) public {
        require(bytes(text).length != 0);  // Reject if there is no content
        
        uint postNumber = posts.length++;  // Increase array size by 1
        posts[postNumber] = Post(msg.sender, now, text);    // now means block.timestamp
        
        NewPost(msg.sender, postNumber);   // Call event NewPost
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
    
    function removePost(uint postNumber) public boardOwnerOnly {
        require(postNumber < posts.length);
        require(postNumber != 0);    // The first post can not be removed, if you want to, use destructThread
        
        posts[postNumber] = Post(NYAN_ADDRESS, 0, "にゃーん");
        
        PostRemoved(postNumber);    // Call the event
    }
    
    function destructThread() public boardOwnerOnly {
        selfdestruct(parentBoard.getOwner());
    }
}