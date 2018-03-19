pragma solidity ^0.4.19;

import "./interfaces/OwnedBoard.sol";
import "./DesuThread.sol";


contract DesuBoard is OwnedBoard {
    struct ListElement {
        uint previous;
        uint next;
        
        Thread thread;
    }
    
    /**
     * uint maximum value, used for marking terminals of list
     */
    uint constant private UINT_LARGEST = 2**255 - 1;
    bytes32 constant private VERSION = "cupmouse-0.0.1";    // Probably not needed
    
    ListElement[] private listElements;
    uint private first = 0;
    uint private last = 0;
    uint private size = 0;

    function DesuBoard() public Owned(msg.sender) { }
    
    function makeNewThread(string title, string text) public {
        // Create new thread contract
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
        return listElements[getInternalIndexOf(index)].thread;
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
        uint cur = getInternalIndexOf(startIndex);
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

    // TODO This is not good. If another tx that will remove or add a thread was executed before calling this,
    // it won't be removed as executor thought as thread's index will be different
    /**
     * Remove thread from this list positioned at the provided index
     */
     function removeThread(uint index) public returns (bool success) {
         uint internalIndex = getInternalIndexOf(index);
         uint previousIIndex = listElements[internalIndex].previous;
         uint nextIIndex = listElements[internalIndex].next;
         
         if (previousIIndex != UINT_LARGEST) {
             // There is a previous element, it is not the first element in this list
             // Skip this element and connect the previous element to the next element
             listElements[previousIIndex].next = nextIIndex;
         } else first = listElements[internalIndex].next;   // It is the first element, give the 'first' to next one
         
         if (nextIIndex != UINT_LARGEST) {
             // There is a next element, it is not the last element in this list
             // Skip this element and connet the next element to the previous element
             listElements[nextIIndex].previous = previousIIndex;
         } else last = listElements[internalIndex].previous;// Same as changing first, give the 'last' to next one

         size--;    // Size is decreased by 1

         return true;
     }

    function destructBoard() public ownerOnly {
        selfdestruct(owner);
    }
    
    /**
     * Get the internal index of the element in this list which index is provided
     * Either looked up from the first or the last
     */
    function getInternalIndexOf(uint index) private view returns (uint internalIndex) {
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
}
