import expectThrow from 'zeppelin-solidity/test/helpers/expectThrow';
import assertRevert from 'zeppelin-solidity/test/helpers/assertRevert';

const DesuBoard = artifacts.require('DesuBoard');
const DesuThread = artifacts.require('DesuThread');

contract('DesuBoard permission tests', async (accounts) => {
  let desuBoard;

  it('deploy', async () => {
    desuBoard = await DesuBoard.new({from: accounts[0]});
  });

  describe('Functions can be called from non owner', async () => {
    // On Board.sol
    it('makeNewThread(string,string)', async () => {
      await desuBoard.makeNewThread('Test', 'Text', {from: accounts[5]});
    });
    it('getThreadAt(uint)', async () => {
      await desuBoard.getThreadAt.call(0, {from: accounts[5]});
    });
    it('getFirstThread()', async () => {
      await desuBoard.getFirstThread.call({from: accounts[5]});
    });
    it('getThreadArray(uint,uint)', async () => {
      await desuBoard.getThreadArray.call(0, 1, {from: accounts[5]});
    });
    it('getNumberOfThreads()', async () => {
      await desuBoard.getNumberOfThreads.call({from: accounts[5]});
    });

    // On ManageableBoard.sol
    it('getInternalIdOfIndex(uint)', async () => {
      await desuBoard.getInternalIdOfIndex.call(0, {from: accounts[5]});
    });
    it('isLocked()', async () => {
      await desuBoard.isLocked.call({from: accounts[5]});
    });
    it('isAlive()', async () => {
      await desuBoard.isAlive.call({from: accounts[5]});
    });

    // On DesuBoard.sol
    it('getLastThread(uint)', async () => {
      await desuBoard.getLastThread.call({from: accounts[5]})
    });
  });

  describe('Functions should not be able to call from non owner', async () => {
    // On Board.sol
    it('bumpThread()', async () => {
      await assertRevert(desuBoard.bumpThread({from: accounts[6]}));
    });
    // On ManageableBoard.sol
    it('detachThreadByIndex(uint)', async () => {
      await assertRevert(desuBoard.detachThreadByIndex(0, {from: accounts[6]}));
    });
    it('detachThreadByInternalId(uint)', async () => {
      await assertRevert(desuBoard.detachThreadByInternalId(0, {from: accounts[6]}));
    });
    it('lock()', async () => {
      await assertRevert(desuBoard.lock({from: accounts[6]}));
    });
    it('unlock()', async () => {
      await assertRevert(desuBoard.unlock({from: accounts[6]}));
    });
    it('destructBoard()', async () => {
      await assertRevert(desuBoard.destructBoard({from: accounts[6]}));
    });
  });

  describe('Functions can be called from owner', async () => {
    // On ManageableBoard.sol
    it('making post #1', async () => {
      await desuBoard.makeNewThread('ABC', 'EFG', {from: accounts[7]}); // This is not the function we want to test ★ is this one
    });
    it('detachThreadByInternalId(uint)', async () => {
      await desuBoard.detachThreadByInternalId(1, {from: accounts[0]}); // Removing id 1 witch is ★
    });
    it('making post #2', async () => {
      await desuBoard.makeNewThread('あいう', 'えおか', {from: accounts[7]}); // This is not the function we want to test
    });
    it('lock()', async () => {
      await desuBoard.lock({from: accounts[0]});  // We have to call this before detachThreadByIndex(uint)
    });
    it('detachThreadByIndex(uint)', async () => {
      await desuBoard.detachThreadByIndex(0, {from: accounts[0]});
    });
    it('unlock()', async () => {
      await desuBoard.unlock({from: accounts[0]});
    });
    // await desuBoard.destructBoard({from: accounts[0]});  Don't call this yet
  });

  describe('Functions can not be called from even owner', async () => {
    // On Board.sol
    it('bumpThread()', async () => {
      await assertRevert(desuBoard.bumpThread({from: accounts[0]}));
    });
  });

  describe('Functions should be called from attached threads', async () => {
    // Preparing for calling post
    let threadAddress;

    it('getThreadAt(0)', async () => {
      threadAddress = await desuBoard.getThreadAt.call(0, {from: accounts[6]});
    });

    // On Board.sol
    it('call post(string) which call bumpThread() inside', async () => {
      await DesuThread.at(threadAddress).post('Hello everyone! bumping feature is now online!', {from: accounts[5]});
    });
  });

  describe('lock() actually locks function should not be executed from non owner', async () => {
    it('lock board as owner', async () => {
      await desuBoard.lock({from: accounts[0]});  // Lock as owner, previously tested, not a target to test
    });
    // On Board.sol
    it('makeNewThread(string,string)', async () => {
      await assertRevert(desuBoard.makeNewThread('Can not be', 'executed', {from: accounts[5]}));
    });
  });

  describe('functions can not be called from threads after lock()', async () => {
    // Preparing for calling post
    let threadAddress;

    it('getThreadAt(0)', async () => {
      threadAddress = await desuBoard.getThreadAt.call(0, {from: accounts[6]});
    });

    // On Board.sol
    it('call post(string) which call bumpThread() inside', async () => {
      await assertRevert(DesuThread.at(threadAddress).post('Can not be executed', {from: accounts[5]}));
    });
  });

  describe('Functions have lockAffectable can be called from owner even if it is locked', async () => {
    it('makeNewThread(string,string)', async () => {
      await desuBoard.makeNewThread('Great power comes with', 'great responsibility', {from: accounts[0]});
    });
    it('detatchThreadByIndex(uint)', async () => {
      await desuBoard.detachThreadByIndex(0, {from: accounts[0]});  // Detach thread just created
    });
    it('detatchThreadByInternalId(uint)', async () => {
      await desuBoard.detachThreadByInternalId(0, {from: accounts[0]}); // Detach thread 0, there is no thread after this
    });
  });

  describe('Finalize', async () => {
    it('call destructBoard() from owner account', async() => {
      await desuBoard.destructBoard({from: accounts[0]});

      let isThreadRemoved = await desuBoard.getThreadAt.call(0, {from: accounts[1]});
      assert.equal(isThreadRemoved, '0x0', 'Not wiped from blockchain');
    });
  });
});