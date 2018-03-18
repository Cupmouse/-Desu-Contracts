import expectThrow from 'zeppelin-solidity/test/helpers/expectThrow';
import assertRevert from 'zeppelin-solidity/test/helpers/assertRevert';

const OwnedBoard = artifacts.require('OwnedBoard');
const OwnedThread = artifacts.require('OwnedThread');

contract('OwnedBoard', async (accounts) => {
  let ownedBoard;

  it('deploy', async () => {
    ownedBoard = await OwnedBoard.new({from: accounts[0]});
  });

  const callGetThread = (index) => ownedBoard.getThreadAt.call(index, {from: accounts[0]});

  it('it should not have elements', async () => {
    let size = await ownedBoard.getSize.call({from: accounts[0]});
    assert.equal(size.toNumber(), 0, 'Size is not 0');
    await assertRevert(callGetThread(0), 'Excepted get(0) to throw, there should not be any elements');
  });

  let threadA;

  it('first element should be added to the list', async () => {
    threadA = await OwnedThread.new('is there could be nuko themed meme', 'nukonuko');

    await ownedBoard.registerThread(threadA.address, {from: accounts[0]});
    // We don't have any way to check if the call was successful

    let size = await ownedBoard.getSize.call({from: accounts[0]});
    assert.equal(size.toNumber(), 1, 'Size should be 1');

    let element0 = await callGetThread(0);
    // FIXME web3.isAddress is moved to web3.utils.isAddress in web3 1.0.0
    assert.isTrue(web3.isAddress(element0), 'Returned value not address');
    assert.equal(element0, threadA.address, 'Returned value is not desired address');
  });

  let threadB;

  it('secound element should be added to the list and be the first element of it', async () => {
    threadB = await OwnedThread.new('like new new', 'i like android', {from: accounts[0]});

    await ownedBoard.registerThread(threadB.address, {from: accounts[0]});

    let size = await ownedBoard.getSize.call({from: accounts[0]});
    assert.equal(size.toNumber(), 2, 'Size should be 2 now');

    let element0 = await callGetThread(0);
    assert.equal(element0, threadB.address, 'The first element should be the thread just added in');
    let element1 = await callGetThread(1);
    assert.equal(element1, threadA.address, 'Second element should be the thread added before');
    await assertRevert(callGetThread(2), 'Expected function to throw when getting element 2 that should not exist');
  });

  let threadC;

  it('third element should be added to the list and the list structure has to be kept', async () => {
    threadC = await OwnedThread.new('its the third one', 'are\'n you board by now', {from: accounts[0]});

    await ownedBoard.registerThread(threadC.address, {from: accounts[0]});

    let size = await ownedBoard.getSize.call({from: accounts[0]});
    assert.equal(size.toNumber(), 3, 'Size should be 3');

    let element0 = await callGetThread(0);
    assert.equal(element0, threadC.address, 'Non desired first element');
    let element1 = await callGetThread(1);
    assert.equal(element1, threadB.address, 'Non desired second element');
    let element2 = await callGetThread(2);
    assert.equal(element2, threadA.address, 'Non desired third element');
    await assertRevert(callGetThread(3), 'Expected function to throw when getting element 3 that should not exist');
  });

  it('removing an middle one', async () => {
    await ownedBoard.remove(1, {from: accounts[0]});

    let size = await ownedBoard.getSize.call({from: accounts[0]});
    assert.equal(size.toNumber(), 2, 'Size should be 2');

    let element0 = await callGetThread(0);
    assert.equal(element0, threadC.address, 'Non desired first element');
    let element1 = await callGetThread(1);
    assert.equal(element1, threadA.address, 'Non desired second element');
    await assertRevert(callGetThread(2), 'Expected get(2) to throw');
    await assertRevert(callGetThread(3), 'Expected get(3) to throw');
  });

  let threadD;

  it('adding a new one and removing the last one', async () => {
    threadD = await OwnedThread.new('More', 'more', {from: accounts[0]});
    await ownedBoard.registerThread(threadD.address, {from: accounts[0]});

    let size = await ownedBoard.getSize.call({from: accounts[0]});
    assert.equal(size.toNumber(), 3, 'Size should be 3');

    let element0 = await callGetThread(0);
    assert.equal(element0, threadD.address, 'Non desired first element');
    let element1 = await callGetThread(1);
    assert.equal(element1, threadC.address, 'Non desired second element');
    let element2 = await callGetThread(2);
    assert.equal(element2, threadA.address, 'Non desired third element');
    await assertRevert(callGetThread(3), 'Expected get(3) to throw');
    await assertRevert(callGetThread(4), 'Expected get(4) to throw');

    // Remove last one

    await ownedBoard.remove(2, {from: accounts[0]});

    size = await ownedBoard.getSize.call({from: accounts[0]});
    assert.equal(size.toNumber(), 2, 'Size should be 2');

    element0 = await callGetThread(0);
    assert.equal(element0, threadD.address, 'Non desired first element');
    element1 = await callGetThread(1);
    assert.equal(element1, threadC.address, 'Non desired second element');
    await assertRevert(callGetThread(2), 'Expected get(2) to throw');
    await assertRevert(callGetThread(3), 'Expected get(3) to throw');
    await assertRevert(callGetThread(4), 'Expected get(4) to throw');
  });

  let threadE;

  it('adding a new one and removing the first one', async () => {
    threadE = await OwnedThread.new('Lastone', 'last', {from: accounts[0]});
    await ownedBoard.registerThread(threadE.address, {from: accounts[0]});

    let size = await ownedBoard.getSize.call({from: accounts[0]});
    assert.equal(size.toNumber(), 3, 'Size should be 3');

    let element0 = await callGetThread(0);
    assert.equal(element0, threadE.address, 'Non desired first element');
    let element1 = await callGetThread(1);
    assert.equal(element1, threadD.address, 'Non desired second element');
    let element2 = await callGetThread(2);
    assert.equal(element2, threadC.address, 'Non desired second element');
    await assertRevert(callGetThread(3), 'Expected get(3) to throw');
    await assertRevert(callGetThread(4), 'Expected get(4) to throw');
    await assertRevert(callGetThread(5), 'Expected get(5) to throw');

    // Remove first one

    await ownedBoard.remove(0, {from: accounts[0]});

    size = await ownedBoard.getSize.call({from: accounts[0]});
    assert.equal(size.toNumber(), 2, 'Size should be 2');

    element0 = await callGetThread(0);
    assert.equal(element0, threadD.address, 'Non desired first element');
    element1 = await callGetThread(1);
    assert.equal(element1, threadC.address, 'Non desired second element');
    await assertRevert(callGetThread(2), 'Expected get(2) to throw');
    await assertRevert(callGetThread(3), 'Expected get(3) to throw');
    await assertRevert(callGetThread(4), 'Expected get(4) to throw');
    await assertRevert(callGetThread(5), 'Expected get(5) to throw');
  });

  it('reject registering non Thread contract', async () => {
      let decoy = await OwnedBoard.new({from: accounts[1]});

      await expectThrow(ownedBoard.registerThread(decoy.address, {from: accounts[0]}));
  });

  let ownedThread1;

  it('register Thread contract', async () => {
      ownedThread1 = await OwnedThread.new('t', 't', {from: accounts[0]});

      await ownedBoard.registerThread(ownedThread1.address, {from: accounts[0]});

      let stored0 = await callGetThread(0);
      assert.equal(ownedThread1.address, stored0, 'Non desired thread address');
  });

  let ownedThread2;

  it('register another Thread contract', async () => {
      ownedThread2 = await OwnedThread.new('q', 'q', {from: accounts[1]});

      await ownedBoard.registerThread(ownedThread2.address, {from: accounts[0]});

      let stored0 = await callGetThread(0);
      assert.equal(ownedThread2.address, stored0, 'Non desired thread address for index 0');
      let stored1 = await callGetThread(1);
      assert.equal(ownedThread1.address, stored1, 'Non desired thread address for index 1');
  });

  it('call destructBoard() from non owner account to see if it reverts', async () => {
      await expectThrow(ownedBoard.destructBoard({from: accounts[1]}));
  });

  it('call destructBoard() from owner account', async() => {
      await ownedBoard.destructBoard({from: accounts[0]});

      let removeThread = await callGetThread(0);
      assert.equal(removeThread, '0x0', 'Not wiped from blockchain');
  });
});