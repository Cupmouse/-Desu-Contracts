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

    struct MapEntry {
        bool exist; // Used to check if a entry actually exist
        uint internalId;
    }

    modifier ownerOnly {
        require(msg.sender == owner);
        _;
    }

    modifier requireNotLocked {
        require(!boardLock);
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

    // Making this internal visivility and create getter.
    // somehow from outside of this contract, executing getter is more cheaper. It's quite strange.
    address private owner;

    // List
    ListElement[] private listElements;
    uint private first = UINT_LARGEST;
    uint private last = UINT_LARGEST;
    uint private size = 0;

    /**
     * Mapping address of registered threads to it's internal id
     */
    // if you use internalId as value, you can not tell if entry exists or not when internalId is 0
    mapping(address => MapEntry) private attachedThreads;

    // Properties of board
    bool private boardLock = false;

    function DesuBoard() public {
        owner = msg.sender;
    }

    function bumpThread() external requireNotLocked {
        MapEntry memory entry = attachedThreads[msg.sender];
        require(entry.exist); // Should be attached to this board

        if (size == 1) {
            // Bump? ok done
            return;
        }

        uint bumpedId = entry.internalId;

        if (bumpedId == first) {
            // Excluding condition below if the bumped thread is the first element
            return;
        }
        // It's new garanteed that this board has more than 2 threads and
        // the bumped thread is not the first thread of it

        // Previous neighbors say sayonara to this thread
        uint prevId = listElements[bumpedId].previous;
        uint nextId = listElements[bumpedId].next;

        // Previous element always exists
        // Connect prev element and next element, which can be not exist
        listElements[prevId].next = nextId;

        if (nextId != UINT_LARGEST) // If next element does exist, connect it to the new neighbor
            listElements[nextId].previous = prevId;

        // It's all about bumped thread itself from here below
        // Move element of bumped thread to the top
        listElements[bumpedId].previous = UINT_LARGEST;
        listElements[bumpedId].next = first;

        // Previous first element now have previous element
        listElements[first].previous = bumpedId;

        // First thread changed
        first = bumpedId;

        if (last == bumpedId) {
            // It is no longer the last one
            // If bumped one is the last element, and list size > 1, it must have
            // previous element
            last = prevId;
        }

        // Size won't change

        // Thread is bumped, fire a event
        ThreadBumped();
    }

    function makeNewThread(string title, string text) external lockAffectable {
        // Create new thread contract
        // Most explorer is not supporting tracking of this newly created contract
        // It creates ACTUAL contract on the blockchain that have an address
        Thread newThread = new DesuThread(this, msg.sender, title, text);

        // Add thread at the top of the list
        uint addedId = listElements.length++;  // Get index number and widen array by one
        require(addedId < UINT_LARGEST);  // Check if it reached the uint maximum, if do throw (probably never happens)

        if (first == UINT_LARGEST) {
            // It's the very first element
            // Add the very first element to list
            listElements[addedId] = ListElement(UINT_LARGEST, UINT_LARGEST, newThread);

            // First element to be added to the list, last element is also this one
            last = addedId;
        } else {
            // Add new element to this list as first
            listElements[addedId] = ListElement(UINT_LARGEST, first, newThread);

            // Connect added element to previous the first element
            ListElement memory nextElement = listElements[first];
            // Update next element's reference to neighbor
            listElements[first] = ListElement(addedId, nextElement.next, nextElement.thread);
        }

        // Added element is the first element of this list
        first = addedId;

        size++;

        // Put it to reversal mapping (thread => internalId)
        attachedThreads[newThread] = MapEntry(true, addedId);

        NewThread(msg.sender, newThread);
    }

    function getThreadAt(uint index) external view returns (Thread thread) {
        return listElements[getInternalIdOfIndex(index)].thread;
    }

    function getFirstThread() external view returns (Thread thread) {
        require(first != UINT_LARGEST);
        return listElements[first].thread;
    }

    /**
     * Get the last thread of this board
     */
    function getLastThread() external view returns (Thread thread) {
        require(last != UINT_LARGEST);
        return listElements[last].thread;
    }

    function getNumberOfThreads() external view returns (uint numberOfThreads) {
        return size;
    }

    function getThreadArray(uint startIndex, uint maxCount) external view returns (Thread[] threads, uint foundCount) {
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

    /**
     * Get the owner address of this board
     */
    function getOwner() external view returns (address _owner) {
        return owner;
    }

    function isLocked() external view returns (bool _lock) {
        return boardLock;
    }

    /**
     * Get a bool value whether a board has been destructed or not
     * Return true if a board has NOT been destructed, false if destructed
     */
    function isAlive() external pure returns (bool _alive) {
        return true;    // Seems like constant? selfdestruct will erase this too!
    }

    function detachThreadByInternalId(uint internalId) external ownerOnlyLockAffectable {
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

        delete attachedThreads[listElements[internalId].thread];   // Delete this first
        delete listElements[internalId];    // Delete this after

        // TODO maybe reduce array size??? (internalId will NOT be consistent)
    }

    function setLock(bool lockState) external ownerOnly {
        boardLock = lockState;
    }

    function destructBoard() external ownerOnly {
        selfdestruct(owner);
    }
}
