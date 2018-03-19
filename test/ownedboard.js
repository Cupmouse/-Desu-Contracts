import expectThrow from 'zeppelin-solidity/test/helpers/expectThrow';
import assertRevert from 'zeppelin-solidity/test/helpers/assertRevert';

const OwnedBoard = artifacts.require('OwnedBoard');
const OwnedThread = artifacts.require('OwnedThread');

contract('OwnedBoard', async (accounts) => {
  let ownedBoard;

  it('deploy', async () => {
    ownedBoard = await OwnedBoard.new({from: accounts[0]});
  });

  let removedThreads = 0;
  let expectedList = [];

  const addThread = async (thread, accountAs) => {
    await ownedBoard.registerThread(thread, {from: accountAs});
    expectedList.unshift(thread);
  };

  const callRemoveThread = async (index, accountAs) => {
    await ownedBoard.remove(index, {from: accountAs});
    expectedList.splice(index, 1);
    removedThreads++;
  };

  const callGetThread = async (index) => await ownedBoard.getThreadAt.call(index, {from: accounts[1]});

  const callGetSize = async () => await ownedBoard.getSize.call({from: accounts[1]});

  const assertThreadArray = async () => {
    const size = (await callGetSize()).toNumber();
    assert.equal(size, expectedList.length, 'Wrong size');

    if (size === 0) {
      // Size is zero, there is no data, it should revert
      await assertRevert(ownedBoard.getThreadArray.call(0, expectedList.length, {from: accounts[1]}));
    } else {
      const result = await ownedBoard.getThreadArray.call(0, expectedList.length, {from: accounts[1]});

      // result[1] is actual size of array contains thread address
      assert.equal(result[1].toNumber(), expectedList.length, 'getThreadArray returned size wrong');

      const threads = result[0].slice(0, result[1]);

      for (let i = 0; i < expectedList.length; i++) {
        assert.equal(threads[i], expectedList[i], `Non desired element for index ${i}`);
      }
    }

    for (let i = 0; i < removedThreads + 1; i++) {
      await assertRevert(ownedBoard.getThreadAt.call(expectedList.length + i, {from: accounts[0]}), `Expected get(${i}) to revert`);
    }
  };

  it('should not have elements', async () => {
    // This will assert if current state in the blockchain is the same as expected one
    await assertThreadArray();
  });

  let firstElem;

  it('register thread contract', async () => {
    firstElem = await OwnedThread.new('is there could be nuko themed meme', 'nukonuko', {from: accounts[0]});

    await addThread(firstElem.address, accounts[0]);
  });

  it('check current state on the blockchain using getThreadArray(uint,uint)', async () => {
    await assertThreadArray();
  });

  it('check registered thread using getThreadAt(uint)', async () => {
    const element0 = await callGetThread(0);
    // FIXME web3.isAddress is moved to web3.utils.isAddress in web3 1.0.0
    assert.isTrue(web3.isAddress(element0), 'Returned value not address');
    assert.equal(element0, firstElem.address, 'Returned value is not desired address');
  });

  it('secound element should be added to the list and be the first element of it', async () => {
    const newThread = await OwnedThread.new('like new new', 'i like android', {from: accounts[0]});

    await addThread(newThread.address, accounts[0]);
    await assertThreadArray();
  });

  it('third element should be added to the list and the list structure has to be kept', async () => {
    const newThread = await OwnedThread.new('its the third one', 'are\'n you board by now', {from: accounts[0]});

    await addThread(newThread.address, accounts[0]);
    // await ownedBoard.registerThread(newThread.address, {from: accounts[0]}); here for checking checking method lol
    await assertThreadArray();
  });

  it('removing an middle one', async () => {
    await callRemoveThread(1, accounts[0]);
    await assertThreadArray();
  });

  it('adding a new one and removing the last one', async () => {
    const newThread = await OwnedThread.new('More', 'more', {from: accounts[0]});
    await addThread(newThread.address, accounts[0]);
    await assertThreadArray();

    // Remove last one

    await callRemoveThread(2, accounts[0]);
    await assertThreadArray();
  });

  it('adding a new one and removing the first one', async () => {
    const newThread = await OwnedThread.new('Lastone', 'last', {from: accounts[0]});
    await addThread(newThread.address, accounts[0]);
    await assertThreadArray();

    // Remove first one

    await callRemoveThread(0, accounts[0]);
    await assertThreadArray();
  });

  it('reject registering non Thread contract', async () => {
    const decoy = await OwnedBoard.new({from: accounts[1]});

    await expectThrow(addThread(decoy.address, accounts[0]));
  });

  it('register another Thread contract', async () => {
    const newThread = await OwnedThread.new('q', 'q', {from: accounts[1]});

    await addThread(newThread.address, accounts[0]);
    await assertThreadArray();
  });

  it('call destructBoard() from non owner account to see if it reverts', async () => {
    await expectThrow(ownedBoard.destructBoard({from: accounts[1]}));
  });

  it('call destructBoard() from owner account', async() => {
    await ownedBoard.destructBoard({from: accounts[0]});

    let isThreadRemoved = await callGetThread(0);
    assert.equal(isThreadRemoved, '0x0', 'Not wiped from blockchain');
  });
});