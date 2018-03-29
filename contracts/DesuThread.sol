pragma solidity ^0.4.19;
pragma experimental ABIEncoderV2;

import "./interfaces/ManageableThread.sol";
import "./DesuBoard.sol";


contract DesuThread is ManageableThread {
    struct Post {
        address poster;
        uint timestamp;
        string text;
    }

    /**
     * This modifier only accepts if msg.sender is the owner of parent board of this thread
     * If parent board does not exist, anyone can pass this modifier
     */
    modifier boardOwnerOnly {
        address boardOwner = parentBoard.getOwner();
        // If board owner is 0x00... assume there is no owner and let through
        require(boardOwner != address(0) && msg.sender == boardOwner);
        _;
    }

    address constant private NYAN_ADDRESS = 0x2222222222222222222222222222222222222222;

    DesuBoard private parentBoard;

    string private title;
    Post[] private posts;

    function DesuThread(DesuBoard _parentBoard, address threadPoster, string _title, string text) public {
        require(bytes(text).length != 0);  // No content not allowed

        parentBoard = _parentBoard;

        title = _title;
        posts.length++; // Allocate a new array element
        posts[0] = Post(threadPoster, now, text);
    }

    function post(string text) external {
        require(bytes(text).length != 0);  // Reject if there is no content

        uint postNumber = posts.length++;  // Increase array size by 1
        posts[postNumber] = Post(msg.sender, now, text);    // now means block.timestamp

        // This should revert if parent board has been destructed
        parentBoard.bumpThread();

        NewPost(postNumber);   // Call event NewPost
    }

    function getTitle() external view returns (string _title) {
        return title;
    }

    function getPoster(uint postNumber) external view returns (address poster) {
        return posts[postNumber].poster;
    }

    function getPostTimestamp(uint postNumber) external view returns (uint timestamp) {
        return posts[postNumber].timestamp;
    }

    function getPostText(uint postNumber) external view returns (string text) {
        return posts[postNumber].text;
    }

    function getPostAt(uint postNumber) external view returns (address _poster, uint timestamp, string text) {
        Post memory postAt = posts[postNumber];
        return (postAt.poster, postAt.timestamp, postAt.text);
    }

    function getPosterArray(uint fromPostNumber, uint maxCount) external view returns (address[] posters, uint foundCount) {
        require(fromPostNumber < posts.length);

        address[] memory rtn = new address[](maxCount);

        uint limitCount = calcLimitCount(fromPostNumber, maxCount);

        for (uint i = 0; i < limitCount; i++) {
            rtn[i] =  posts[fromPostNumber + i].poster;
        }

        return (rtn, limitCount);
    }

    function getPostTimestampArray(uint fromPostNumber, uint maxCount) external view returns (uint[] timestamps, uint foundCount) {
        require(fromPostNumber < posts.length);

        uint[] memory rtn = new uint[](maxCount);

        uint limitCount = calcLimitCount(fromPostNumber, maxCount);

        for (uint i = 0; i < limitCount; i++) {
            rtn[i] =  posts[fromPostNumber + i].timestamp;
        }

        return (rtn, limitCount);
    }

    function getPostTextArray(uint fromPostNumber, uint maxCount) external view returns (string[] texts, uint foundCount) {
        require(fromPostNumber < posts.length);

        string[] memory rtn = new string[](maxCount);

        uint limitCount = calcLimitCount(fromPostNumber, maxCount);

        for (uint i = 0; i < limitCount; i++) {
            rtn[i] =  posts[fromPostNumber + i].text;
        }

        return (rtn, limitCount);
    }

    function getNumberOfPosts() external view returns (uint numberOfPosts) {
        return posts.length;
    }

    /**
     * Get an address of parent board of this thread
     */
    function getParentBoard() external view returns (address _parentBoard) {
        return parentBoard;
    }

    function removePost(uint postNumber) external boardOwnerOnly {
        require(postNumber < posts.length);
        require(postNumber != 0);    // The first post can not be removed, if you want to, use destructThread

        posts[postNumber] = Post(NYAN_ADDRESS, 0, "にゃーん");

        PostRemoved(postNumber);    // Call the event
    }

    function destructThread() external boardOwnerOnly {
        selfdestruct(parentBoard.getOwner());
    }

    /**
     * For shortening source code
     */
    function calcLimitCount(uint fromPostNumber, uint maxCount) private view returns (uint limitCount) {
        if (posts.length <= fromPostNumber + maxCount)
            return posts.length - fromPostNumber;
        else
            return fromPostNumber + maxCount - 1;
    }
}