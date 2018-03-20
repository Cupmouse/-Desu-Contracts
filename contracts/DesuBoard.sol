pragma solidity ^0.4.19;

import "./interfaces/ManageableBoard.sol";
import "./DesuThread.sol";


/**
 * In lock state, tx from NON owner address that make changes to a board will be rejected&reverted.
 * So only owner can call those functions when a board is locked.
 */
contract DesuBoard is ManageableBoard {
    struct ListElement {
        uint previous;
        uint next;
        
        Thread thread;
    }
    
    modifier ownerOnlyOnLocked {
        require(msg.sender == owner);
        require(boardLock);
        _;
    }
    
    // Avoiding similar name to onlyOwnerOnLocked
    modifier lockAffectable {
        if (msg.sender != owner)
            require(!boardLock);    // Non owner can only get permission when a board is not locked
        _;
    }
    
    modifier ownerOnlyLockAffectable {
        require(msg.sender == owner);
        _;
    }
    
    /**
     * uint maximum value, used for marking terminals of list
     */
    uint constant private UINT_LARGEST = 2**255 - 1;
    
    // List
    ListElement[] private listElements;
    uint private first = UINT_LARGEST;
    uint private last = UINT_LARGEST;
    uint private size = 0;
    
    // Properties of board
    bool private boardLock = false;

    function DesuBoard() public ManageableBoard(msg.sender) { }
    
    function makeNewThread(string title, string text) public lockAffectable {
        // Create new thread contract
        // Most explorer is not supporting tracking of this newly created contract
        // It creates ACTUAL contract on the blockchain that have an address
        Thread newThread = new DesuThread(this, title, text);
        
        // Add thread at the top of the list
        uint added_iindex = listElements.length++;  // Get index number and widen array by one
        require(added_iindex < UINT_LARGEST);  // Check if it reached the uint maximum, if do throw (probably never happens)
        
        if (first == UINT_LARGEST) {
            // It's the very first element
            // Add the very first element to list
            listElements[added_iindex] = ListElement(UINT_LARGEST, UINT_LARGEST, newThread);
            
            // First element to be added to the list, last element is also this one
            last = added_iindex;
        } else {
            // Add new element to this list as first
            listElements[added_iindex] = ListElement(UINT_LARGEST, first, newThread);
            
            // Connect added element to previous the first element
            ListElement memory nextElement = listElements[first];
            // Update next element's reference to neighbor
            listElements[first] = ListElement(added_iindex, nextElement.next, nextElement.thread);
        }
        
        // Added element is the first element of this list
        first = added_iindex;
        
        size++;
        
        NewThread(msg.sender, newThread);
    }
     
    function getThreadAt(uint index) public view returns (Thread thread) {
        return listElements[getInternalIdOfIndex(index)].thread;
    }
    
    function getFirstThread() public view returns (Thread thread) {
        require(first != UINT_LARGEST);
        return listElements[first].thread;
    }
    
    /**
     * Get the last thread of this board
     */
    function getLastThread() public view returns (Thread thread) {
        require(last != UINT_LARGEST);
        return listElements[last].thread;
    }
    
    function getNumberOfThreads() public view returns (uint numberOfThreads) {
        return size;
    }
    
    function getThreadArray(uint startIndex, uint maxCount) public view returns (Thread[] threads, uint foundCount) {
        // require(startIndex + maxCount <= size); don't need this

        Thread[] memory threadSeq = new Thread[](maxCount);
        uint count = 0;
        // Get internal index of startIndex, if startIndex exceeds list size then reverts
        uint cur = getInternalIdOfIndex(startIndex);
        // Don't set initial value because cur might represents 'no more elements'
        ListElement memory curElem;
        
        while (cur != UINT_LARGEST) {
            curElem = listElements[cur];
            // Set thread cursor on to an array
            threadSeq[count] = curElem.thread;
            
            // Increment count and move to the next list element
            count++;
            cur = curElem.next;
            
            if (count >= maxCount) {
                // If we reached maxCount, get out of this loop!
                break;
            }
        }
        
        return (threadSeq, count);
    }
    
    function getInternalIdOfIndex(uint index) public view returns (uint internalId) {
        require(index < size);  // Index out of size
        
        if (size == 1)
            return first;  // List only have one element
        
        // Declaring variable here because in solidity when variable is declared scope is in entire function
        uint cur;
        uint count = 0;
        
        if (index > size / 2) {
            // Search from the last element
            
            uint reversedIndex = (size - 1) - index;   // Reversed index
            cur = last;
            
            while (cur != UINT_LARGEST) { // cur == UINT_LARGEST means reached the last element
                if (count == reversedIndex)
                    return cur;    // Found the element looking for
                
                cur = listElements[cur].previous;   // Move cursor to previous internal element index
                count++;
            }
        } else {
            // Search from the first element
            
            cur = first;
            
            while (cur != UINT_LARGEST) {
                if (count == index)
                    return cur;
                
                cur = listElements[cur].next;   // Move cursor to next internal element index
                count++;
            }
        }
    }
    
    function detachThreadByIndex(uint index) public ownerOnlyOnLocked {
        detachThreadByInternalId(getInternalIdOfIndex(index));
    }
    
    function detachThreadByInternalId(uint internalId) public ownerOnlyLockAffectable {
        require(internalId < listElements.length);  // Exceeding a bound
        
        uint previousId = listElements[internalId].previous;
        uint nextId = listElements[internalId].next;
        
        if (previousId != UINT_LARGEST) {
            // There is a previous element, it is not the first element in this list
            // Skip this element and connect the previous element to the next element
            listElements[previousId].next = nextId;
        } else first = listElements[internalId].next;   // It is the first element, give the 'first' to next one
        
        if (nextId != UINT_LARGEST) {
            // There is a next element, it is not the last element in this list
            // Skip this element and connet the next element to the previous element
            listElements[nextId].previous = previousId;
        } else last = listElements[internalId].previous;// Same as changing first, give the 'last' to next one
        
        size--;    // Size is decreased by 1
        
        // TODO should delete actual content
    }
    
    function lock() public ownerOnly {
        boardLock = true;
    }
    
    function unlock() public ownerOnly {
        boardLock = false;
    }

    function destructBoard() public ownerOnly {
        selfdestruct(owner);
    }
}
