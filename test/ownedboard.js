import expectThrow from 'zeppelin-solidity/test/helpers/expectThrow';

const OwnedBoard = artifacts.require('OwnedBoard');
const OwnedThread = artifacts.require('OwnedThread');

contract('OwnedBoard', async (accounts) => {
    let ownedBoard;

    it('Deploy', async () => {
        ownedBoard = await OwnedBoard.new({from: accounts[0]});
    });

    it('Reject registering non Thread contract', async () => {
        let decoy = await OwnedBoard.new({from: accounts[1]});

        await expectThrow(ownedBoard.registerThread(decoy.address, {from: accounts[0]}));
    });

    let ownedThread1;

    it('Register Thread contract', async () => {
        ownedThread1 = await OwnedThread.new('t', 't', {from: accounts[0]});

        await ownedBoard.registerThread(ownedThread1.address, {from: accounts[0]});

        let stored0 = await ownedBoard.getThread.call(0, {from: accounts[0]});
        assert.equal(ownedThread1.address, stored0, 'Non desired thread address');
    });

    let ownedThread2;

    it('Register another Thread contract', async () => {
        ownedThread2 = await OwnedThread.new('q', 'q', {from: accounts[1]});

        await ownedBoard.registerThread(ownedThread2.address, {from: accounts[0]});

        let stored0 = await ownedBoard.getThread.call(0, {from: accounts[0]});
        assert.equal(ownedThread2.address, stored0, 'Non desired thread address for index 0');
        let stored1 = await ownedBoard.getThread.call(1, {from: accounts[0]});
        assert.equal(ownedThread1.address, stored1, 'Non desired thread address for index 1');
    });

    it('Call destructBoard() from non owner account to see if it reverts', async () => {
        await expectThrow(ownedBoard.destructBoard({from: accounts[1]}));
    });

    it('Call destructBoard() from owner account', async() => {
        await ownedBoard.destructBoard({from: accounts[0]});

        let removeThread = await ownedBoard.getThread.call(0, {from: accounts[1]});
        assert.equal(removeThread, '0x0', 'Not wiped from blockchain');
    });
});