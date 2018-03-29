pragma solidity ^0.4.19;
pragma experimental ABIEncoderV2;   // Need this for string[] return


/**
 * An interface for a basic thread
 */
interface Thread {
    /**
     * Event called when someone make post on this thread
     */
    event NewPost(uint postNumber);
    
    /**
     * Post to this thread
     */
    function post(string text) external;

    /**
     * Return a title of this thread
     */
    function getTitle() external view returns (string _title);
    
    /**
     * Return a address of poster of a post
     */
    function getPoster(uint postNumber) external view returns (address _poster);
    
    /**
     * Return a timestamp of a post
     */
    function getPostTimestamp(uint postNumber) external view returns (uint _timestamp);
    
    /**
     * Return a text of a post
     */
    function getPostText(uint postNumber) external view returns (string);
    
    /**
     * Return information about the post whose postNumber is provided
     */
    function getPostAt(uint postNumber) external view returns (address _poster, uint timestamp, string text);
    
    /**
     * Retrun an array of poster's address of posts which postNumber are from fromPostNumber to fromPostNumber + maxCount - 1.
     * posters array size is fixed and always have the length of maxCount.
     * Also return foundCount which shows how many actual post is included in posters.
     * If foundCount is 0 then there is no post found, more than 0 then only posters[0] ... posters[foundCount - 1]
     * contains actual results.
     * Revert if fromPostNumber is out of bounds (fromPostNumber < numberOfPosts)
     */
    function getPosterArray(uint fromPostNumber, uint maxCount) external view returns (address[] posters, uint foundCount);
    
    /**
     * Retrun an array of timestamp of posts which postNumber are from fromPostNumber to fromPostNumber + maxCount - 1.
     * timestamps array size is fixed and always have the length of maxCount.
     * Also return foundCount which shows how many actual post is included in timestamps.
     * If foundCount is 0 then there is no post found, more than 0 then only timestamps[0] ... timestamps[foundCount - 1]
     * contains actual results.
     * Revert if fromPostNumber is out of bounds (fromPostNumber < numberOfPosts)
     */
    function getPostTimestampArray(uint fromPostNumber, uint maxCount) external view returns (uint[] timestamps, uint foundCount);
    
    /**
     * Retrun an array of text of posts which postNumber are from fromPostNumber to fromPostNumber + maxCount - 1.
     * texts array size is fixed and always have the length of maxCount.
     * Also return foundCount which shows how many actual post is included in texts.
     * If foundCount is 0 then there is no post found, more than 0 then only texts[0] ... texts[foundCount - 1]
     * contains actual results.
     * Revert if fromPostNumber is out of bounds (fromPostNumber < numberOfPosts)
     */
    function getPostTextArray(uint fromPostNumber, uint maxCount) external view returns (string[] texts, uint foundCount);
    
    /**
     * Return an number of posts this thread have
     */
    function getNumberOfPosts() external view returns (uint numberOfPosts);
}