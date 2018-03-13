import assertRevert from 'zeppelin-solidity/test/helpers/assertRevert';

const ThreadList = artifacts.require('ThreadList');
const OwnedThread = artifacts.require('OwnedThread');

contract('ThreadList', async (accounts) => {
    let threadList;

    it('Should have no element first', async () => {
        threadList = await ThreadList.new();
        let size = await threadList.getSize.call({from: accounts[0]});
        assert.equal(size.toNumber(), 0, 'Size is not 0');
        await assertRevert(threadList.get.call(0, {from: accounts[0]}), 'Excepted get(0) to throw, there should not be any elements');
    });

    let threadA;

    it('First element should be added to the list', async () => {
        threadA = await OwnedThread.new('is there could be nuko themed meme', 'nukonuko');

        await threadList.addFirst(threadA.address, {from: accounts[0]});
        // We don't have any way to check if the call was successful

        let size = await threadList.getSize.call({from: accounts[0]});
        assert.equal(size.toNumber(), 1, 'Size should be 1');

        let element0 = await threadList.get.call(0, {from: accounts[0]});
        // FIXME web3.isAddress is moved to web3.utils.isAddress in web3 1.0.0
        assert.isTrue(web3.isAddress(element0), 'Returned value not address');
        assert.equal(element0, threadA.address, 'Returned value is not desired address');
    });

    let threadB;

    it('Secound element should be added to the list and be the first element of it', async () => {
        threadB = await OwnedThread.new('like new new', 'i like android', {from: accounts[0]});

        await threadList.addFirst(threadB.address, {from: accounts[0]});

        let size = await threadList.getSize.call({from: accounts[0]});
        assert.equal(size.toNumber(), 2, 'Size should be 2 now');

        let element0 = await threadList.get.call(0, {from: accounts[0]});
        assert.equal(element0, threadB.address, 'The first element should be the thread just added in');
        let element1 = await threadList.get.call(1, {from: accounts[0]});
        assert.equal(element1, threadA.address, 'Second element should be the thread added before');
        await assertRevert(threadList.get.call(2, {from: accounts[0]}), 'Expected function to throw when getting element 2 that should not exist');
    });

    let threadC;

    it('Third element should be added to the list and the list structure has to be kept', async () => {
        threadC = await OwnedThread.new('its the third one', 'are\'n you board by now', {from: accounts[0]});

        await threadList.addFirst(threadC.address, {from: accounts[0]});

        let size = await threadList.getSize.call({from: accounts[0]});
        assert.equal(size.toNumber(), 3, 'Size should be 3');

        let element0 = await threadList.get.call(0, {from: accounts[0]});
        assert.equal(element0, threadC.address, 'Non desired first element');
        let element1 = await threadList.get.call(1, {from: accounts[0]});
        assert.equal(element1, threadB.address, 'Non desired second element');
        let element2 = await threadList.get.call(2, {from: accounts[0]});
        assert.equal(element2, threadA.address, 'Non desired third element');
        await assertRevert(threadList.get.call(3, {from: accounts[0]}), 'Expected function to throw when getting element 3 that should not exist');
    });

    it('Removing an middle one', async () => {
        await threadList.remove(1, {from: accounts[0]});

        let size = await threadList.getSize.call({from: accounts[0]});
        assert.equal(size.toNumber(), 2, 'Size should be 2');

        let element0 = await threadList.get.call(0, {from: accounts[0]});
        assert.equal(element0, threadC.address, 'Non desired first element');
        let element1 = await threadList.get.call(1, {from: accounts[0]});
        assert.equal(element1, threadA.address, 'Non desired second element');
        await assertRevert(threadList.get.call(2, {from: accounts[0]}), 'Expected get(2) to throw');
        await assertRevert(threadList.get.call(3, {from: accounts[0]}), 'Expected get(3) to throw');
    });

    let threadD;

    it('Adding a new one and removing the last one', async () => {
        threadD = await OwnedThread.new('More', 'more', {from: accounts[0]});
        await threadList.addFirst(threadD.address, {from: accounts[0]});

        let size = await threadList.getSize.call({from: accounts[0]});
        assert.equal(size.toNumber(), 3, 'Size should be 3');

        let element0 = await threadList.get.call(0, {from: accounts[0]});
        assert.equal(element0, threadD.address, 'Non desired first element');
        let element1 = await threadList.get.call(1, {from: accounts[0]});
        assert.equal(element1, threadC.address, 'Non desired second element');
        let element2 = await threadList.get.call(2, {from: accounts[0]});
        assert.equal(element2, threadA.address, 'Non desired third element');
        await assertRevert(threadList.get.call(3, {from: accounts[0]}), 'Expected get(3) to throw');
        await assertRevert(threadList.get.call(4, {from: accounts[0]}), 'Expected get(4) to throw');

        // Remove last one

        await threadList.remove(2, {from: accounts[0]});

        size = await threadList.getSize.call({from: accounts[0]});
        assert.equal(size.toNumber(), 2, 'Size should be 2');

        element0 = await threadList.get.call(0, {from: accounts[0]});
        assert.equal(element0, threadD.address, 'Non desired first element');
        element1 = await threadList.get.call(1, {from: accounts[0]});
        assert.equal(element1, threadC.address, 'Non desired second element');
        await assertRevert(threadList.get.call(2, {from: accounts[0]}), 'Expected get(2) to throw');
        await assertRevert(threadList.get.call(3, {from: accounts[0]}), 'Expected get(3) to throw');
        await assertRevert(threadList.get.call(4, {from: accounts[0]}), 'Expected get(4) to throw');
    });

    let threadE;

    it('Adding a new one and removing the first one', async () => {
        threadE = await OwnedThread.new('Lastone', 'last', {from: accounts[0]});
        await threadList.addFirst(threadE.address, {from: accounts[0]});

        let size = await threadList.getSize.call({from: accounts[0]});
        assert.equal(size.toNumber(), 3, 'Size should be 3');

        let element0 = await threadList.get.call(0, {from: accounts[0]});
        assert.equal(element0, threadE.address, 'Non desired first element');
        let element1 = await threadList.get.call(1, {from: accounts[0]});
        assert.equal(element1, threadD.address, 'Non desired second element');
        let element2 = await threadList.get.call(2, {from: accounts[0]});
        assert.equal(element2, threadC.address, 'Non desired second element');
        await assertRevert(threadList.get.call(3, {from: accounts[0]}), 'Expected get(3) to throw');
        await assertRevert(threadList.get.call(4, {from: accounts[0]}), 'Expected get(4) to throw');
        await assertRevert(threadList.get.call(5, {from: accounts[0]}), 'Expected get(5) to throw');

        // Remove first one

        await threadList.remove(0, {from: accounts[0]});

        size = await threadList.getSize.call({from: accounts[0]});
        assert.equal(size.toNumber(), 2, 'Size should be 2');

        element0 = await threadList.get.call(0, {from: accounts[0]});
        assert.equal(element0, threadD.address, 'Non desired first element');
        element1 = await threadList.get.call(1, {from: accounts[0]});
        assert.equal(element1, threadC.address, 'Non desired second element');
        await assertRevert(threadList.get.call(2, {from: accounts[0]}), 'Expected get(2) to throw');
        await assertRevert(threadList.get.call(3, {from: accounts[0]}), 'Expected get(3) to throw');
        await assertRevert(threadList.get.call(4, {from: accounts[0]}), 'Expected get(4) to throw');
        await assertRevert(threadList.get.call(5, {from: accounts[0]}), 'Expected get(5) to throw');
    });

});
