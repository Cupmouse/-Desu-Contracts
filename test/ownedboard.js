import expectThrow from 'zeppelin-solidity/test/helpers/expectThrow';
import assertRevert from 'zeppelin-solidity/test/helpers/assertRevert';

const OwnedBoard = artifacts.require('OwnedBoard');
const OwnedThread = artifacts.require('OwnedThread');

contract('OwnedBoard', async (accounts) => {
  let ownedBoard;

  let removedThreads = 0;
  let expectedList = [];

  const callAddThread = async (title, text, accountAs) => {
    await ownedBoard.makeNewThread(title, text, {from: accountAs});
    expectedList.unshift([title, text]);
  };

  const callRemoveThread = async (index, accountAs) => {
    await ownedBoard.removeThread(index, {from: accountAs});
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

      for (let i = 0; i < threads.length; i++) {
        const elemThread = OwnedThread.at(threads[i]);
        const title = await elemThread.getTitle.call({from: accounts[0]});
        const text = await elemThread.getPostText.call(0, {from: accounts[0]});

        assert.equal(title, expectedList[i][0], `Non desired thread title for index ${i}`);
        assert.equal(text, expectedList[i][1], `Non desired thread text for index ${i}`);
      }
    }

    for (let i = 0; i < removedThreads + 1; i++) {
      await assertRevert(ownedBoard.getThreadAt.call(expectedList.length + i, {from: accounts[0]}), `Expected get(${i}) to revert`);
    }
  };

  it('deploy', async () => {
    ownedBoard = await OwnedBoard.new({from: accounts[0]});
  });

  it('should not have elements', async () => {
    // This will assert if current state in the blockchain is the same as expected one
    await assertThreadArray();
  });

  it('register thread contract', async () => {
    await callAddThread('is there could be nuko themed meme', 'nukonuko', accounts[0]);
  });

  it('check current state on the blockchain using getThreadArray(uint,uint)', async () => {
    await assertThreadArray();
  });

  it('check registered thread using getThreadAt(uint)', async () => {
    const element0 = await callGetThread(0);
    // FIXME web3.isAddress is moved to web3.utils.isAddress in web3 1.0.0
    assert.isTrue(web3.isAddress(element0), 'Returned value not address');

    const thr = OwnedThread.at(element0);
    const title = await thr.getTitle.call({from: accounts[0]});
    const text = await thr.getPostText.call(0, {from: accounts[0]});

    assert.equal(title, expectedList[0][0], 'Returned value is not desired title');
    assert.equal(text, expectedList[0][1], 'Returned value is not desired text');
  });

  it('secound element should be added to the list and be the first element of it', async () => {
    await callAddThread('like new new', 'i like android', accounts[0]);
    await assertThreadArray();
  });

  it('third element should be added to the list and the list structure has to be kept', async () => {
    await callAddThread('its the third one', 'are\'n you board by now', accounts[0]);
    // await ownedBoard.registerThread(newThread.address, {from: accounts[0]}); here for checking checking method lol
    await assertThreadArray();
  });

  it('removing an middle one', async () => {
    await callRemoveThread(1, accounts[0]);
    await assertThreadArray();
  });

  it('adding a new one and removing the last one', async () => {
    await callAddThread('More', 'more', accounts[0]);
    await assertThreadArray();

    // Remove last one

    await callRemoveThread(2, accounts[0]);
    await assertThreadArray();
  });

  it('adding a new one and removing the first one', async () => {
    await callAddThread('Lastone', 'last', accounts[0]);
    await assertThreadArray();

    // Remove first one

    await callRemoveThread(0, accounts[0]);
    await assertThreadArray();
  });

  it('remove to remain 1 more', async () => {
    await callRemoveThread(0, accounts[0]);
    await assertThreadArray();
  });

  it('remove all', async () => {
    await callRemoveThread(0, accounts[0]);
    await assertThreadArray();
    assert.equal(await callGetSize(), 0, 'All thread had to be removed');
  });

  it('add one again', async () => {
    await callAddThread('Revive', 'Noice', accounts[1]);
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