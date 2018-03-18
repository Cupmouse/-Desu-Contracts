pragma solidity ^0.4.19;

import "./interfaces/Thread.sol";


contract ThreadList {
    struct ListElement {
        uint previous;
        uint next;
        
        Thread thread;
    }
    
    /**
     * uint maximum value, used for marking of terminals of list
     */
    uint constant private UINT_LARGEST = 2**255 - 1;
    
    ListElement[] private elements;
    uint private first = 0;
    uint private last = 0;
    uint private size = 0;
    
    /**
     * Add provided thread to this list as the first element
     * It won't throw even if provided thread variable is not Thread contract
     */
    function addFirst(Thread thread) external {
        uint added_iindex = elements.length++;  // Get index number and widen array by one
        require(added_iindex < UINT_LARGEST);  // Check if it reached the uint maximum, if do throw (probably never happens)
        
        if (added_iindex == 0) {
            // It's the very first element
            // Add the very first element to list
            elements[added_iindex] = ListElement(UINT_LARGEST, UINT_LARGEST, thread);
            
            // First element to be added to the list, last element is also this one
            last = added_iindex;
        } else {
            // Add new element to this list as first
            elements[added_iindex] = ListElement(UINT_LARGEST, first, thread);
            
            // Connect added element to previous the first element
            ListElement memory nextElement = elements[first];
            // Update next element's reference to neighbor
            elements[first] = ListElement(added_iindex, nextElement.next, nextElement.thread);
        }
        
        // Added element is the first element of this list
        first = added_iindex;
        
        size++;
    }
    
    /**
     * Get the first thread of this list
     */
    function getFirst() external view returns (Thread thread) {
        require(first != UINT_LARGEST);
        return elements[first].thread;
    }
    
    /**
     * Get the last thread of this list
     */
    function getLast() external view returns (Thread thread) {
        require(last != UINT_LARGEST);
        return elements[last].thread;
    }
    
    /**
     * Get the thread positioned at provided index
     */
    function get(uint index) external view returns (Thread thread) {
        return elements[getInternalIndexOf(index)].thread;
    }
    
    /**
     * Get the threads array that maximum size is maxCount and from startIndex
     */
    function getSeq(uint startIndex, uint maxCount) external view returns (Thread[] threads, uint foundCount) {
        Thread[] memory threadSeq = new Thread[](maxCount);
        uint count = 0;
        // Get internal index of startIndex, if startIndex exceeds list size then reverts
        uint cur = getInternalIndexOf(startIndex);
        // Don't set initial value because cur might represents 'no more elements'
        ListElement memory curElem;
        
        while (cur != UINT_LARGEST) {
            curElem = elements[cur];
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
    
    /**
     * Get the size of this list
     */
    function getSize() external view returns (uint _size) {
        return size;
    }
    
    /**
     * Remove thread from this list positioned at the provided index
     */
     function remove(uint index) external returns (bool success) {
         uint internalIndex = getInternalIndexOf(index);
         uint previousIIndex = elements[internalIndex].previous;
         uint nextIIndex = elements[internalIndex].next;
         
         if (previousIIndex != UINT_LARGEST) {
             // There is a previous element, it is not the first element in this list
             // Skip this element and connect the previous element to the next element
             elements[previousIIndex].next = nextIIndex;
         } else first = elements[internalIndex].next;   // It is the first element, give the 'first' to next one
         
         if (nextIIndex != UINT_LARGEST) {
             // There is a next element, it is not the last element in this list
             // Skip this element and connet the next element to the previous element
             elements[nextIIndex].previous = previousIIndex;
         } else last = elements[internalIndex].previous;// Same as changing first, give the 'last' to next one

         size--;    // Size is decreased by 1

         return true;
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
                
                cur = elements[cur].previous;   // Move cursor to previous internal element index
                count++;
            }
        } else {
            // Search from the first element
            
            cur = first;
            
            while (cur != UINT_LARGEST) {
                if (count == index)
                    return cur;
                
                cur = elements[cur].next;   // Move cursor to next internal element index
                count++;
            }
        }
    }
}