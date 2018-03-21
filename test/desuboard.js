import expectThrow from 'zeppelin-solidity/test/helpers/expectThrow';
import assertRevert from 'zeppelin-solidity/test/helpers/assertRevert';

const DesuBoard = artifacts.require('DesuBoard');
const DesuThread = artifacts.require('DesuThread');

contract('DesuBoard', async (accounts) => {
  describe('Basic tests', async () => {
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

  describe('List', async () => {
    let desuBoard;

    let removedThreads = 0;
    let expectedList = [];

    const callAddThread = async (title, text, accountAs) => {
      await desuBoard.makeNewThread(title, text, {from: accountAs});
      expectedList.unshift([title, text]);
    };

    const callDetachThread = async (index, accountAs) => {
      const id = await desuBoard.getInternalIdOfIndex.call(index, {from: accountAs});
      await desuBoard.detachThreadByInternalId(id, {from: accountAs});
      expectedList.splice(index, 1);
      removedThreads++;
    };

    const callGetThread = async (index) => await desuBoard.getThreadAt.call(index, {from: accounts[1]});

    const callGetSize = async () => {
      const size = await desuBoard.getNumberOfThreads.call({from: accounts[1]});
      return size.toNumber();
    };

    const assertThreadArray = async () => {
      const size = await callGetSize();
      assert.equal(size, expectedList.length, 'Wrong size');

      if (size === 0) {
        // Size is zero, there is no data, it should revert
        await assertRevert(desuBoard.getThreadArray.call(0, expectedList.length, {from: accounts[1]}));
      } else {
        const result = await desuBoard.getThreadArray.call(0, expectedList.length, {from: accounts[1]});

        // result[1] is actual size of array contains thread address
        assert.equal(result[1].toNumber(), expectedList.length, 'getThreadArray returned size wrong');

        const threads = result[0].slice(0, result[1]);

        for (let i = 0; i < threads.length; i++) {
          const elemThread = DesuThread.at(threads[i]);
          const title = await elemThread.getTitle.call({from: accounts[0]});
          const text = await elemThread.getPostText.call(0, {from: accounts[0]});

          assert.equal(title, expectedList[i][0], `Non desired thread title for index ${i}`);
          assert.equal(text, expectedList[i][1], `Non desired thread text for index ${i}`);
        }
      }

      for (let i = 0; i < removedThreads + 1; i++) {
        await assertRevert(desuBoard.getThreadAt.call(expectedList.length + i, {from: accounts[0]}), `Expected get(${i}) to revert`);
      }
    };


    it('should not have elements', async () => {
      desuBoard = await DesuBoard.new({from: accounts[0]});
      // This will assert if current state in the blockchain is the same as expected one
      await assertThreadArray();
    });

    it('make new thread and check current state on the blockchain using getThreadArray(uint,uint)', async () => {
      await callAddThread('is there could be nuko themed meme', 'nukonuko', accounts[0]);
      await assertThreadArray();
    });

    it('check registered thread using getThreadAt(uint)', async () => {
      const element0 = await callGetThread(0);
      // FIXME web3.isAddress is moved to web3.utils.isAddress in web3 1.0.0
      assert.isTrue(web3.isAddress(element0), 'Returned value not address');

      const thr = DesuThread.at(element0);
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
      // await desuBoard.registerThread(newThread.address, {from: accounts[0]}); here for checking checking method lol
      await assertThreadArray();
    });

    it('detaching an middle one', async () => {
      await callDetachThread(1, accounts[0]);
      await assertThreadArray();
    });

    it('adding a new one and removing the last one', async () => {
      await callAddThread('More', 'more', accounts[0]);
      await assertThreadArray();

      // Remove last one

      await callDetachThread(2, accounts[0]);
      await assertThreadArray();
    });

    it('adding a new one and removing the first one', async () => {
      await callAddThread('Lastone', 'last', accounts[0]);
      await assertThreadArray();

      // Remove first one

      await callDetachThread(0, accounts[0]);
      await assertThreadArray();
    });

    it('detach to remain 1 more', async () => {
      await callDetachThread(0, accounts[0]);
      await assertThreadArray();
    });

    it('detach all', async () => {
      await callDetachThread(0, accounts[0]);
      await assertThreadArray();
      assert.equal(await callGetSize(), 0, 'All thread had to be removed');
    });

    it('add one again', async () => {
      await callAddThread('Revive', 'Noice', accounts[1]);
      await assertThreadArray();
    });
  });
});