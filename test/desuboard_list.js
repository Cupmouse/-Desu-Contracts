import assertRevert from 'zeppelin-solidity/test/helpers/assertRevert';

const DesuBoard = artifacts.require('DesuBoard');
const DesuThread = artifacts.require('DesuThread');


contract('DesuBoard list', async (accounts) => {
  let desuBoard;

  let removedThreads = 0;
  let expectedList = [];

  const bumpThreadIndexAt = async (index) => {
    // Simulate first!
    const removed = expectedList.splice(index, 1)[0];
    expectedList.unshift(removed);

    // Request
    const threadAt = await desuBoard.getThreadAt(index, {from: accounts[5]});
    await DesuThread.at(threadAt).post('making a post yay yay bump bump', {from: accounts[6]});
  };

  const callAddThread = async (title, text, accountAs) => {
    expectedList.unshift([title, text]);

    // Request
    await desuBoard.makeNewThread(title, text, {from: accountAs});
  };

  const callDetachThread = async (index, accountAs) => {
    expectedList.splice(index, 1);
    removedThreads++;

    // Request
    const id = await desuBoard.getInternalIdOfIndex.call(index, {from: accountAs});
    await desuBoard.detachThreadByInternalId(id, {from: accountAs});
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

  describe('getThreadArray and getThreadAt', async () => {
    it('make new thread', async () => {
      await callAddThread('is there could be nuko themed meme', 'nukonuko', accounts[0]);
    });

    it('check current state on the blockchain using getThreadArray(uint,uint)', async () => {
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
  });


  describe('secound element should be added to the list and be the first element of it', async () => {
    it('add', async () => {
      await callAddThread('like new new', 'i like android', accounts[0]);
    });
    it('assert', async () => {
      await assertThreadArray();
    });
  });

  describe('third element should be added to the list and the list structure has to be kept', async () => {
    it('add', async () => {
      await callAddThread('its the third one', 'are\'n you board by now', accounts[0]);
    });
    it('assert', async () => {
      await assertThreadArray();
    });
    // await desuBoard.registerThread(newThread.address, {from: accounts[0]}); here for checking checking method lol
  });

  describe('bump #2', async () => {
    it('bump', async () => {
      await bumpThreadIndexAt(2);
    });
    it('assert', async () => {
      await assertThreadArray();
    });
  });

  describe('detaching an middle one', async () => {
    it('detach', async () => {
      await callDetachThread(1, accounts[0]);
    });
    it('assert', async () => {
      await assertThreadArray();
    });
  });

  describe('adding a new one and removing the last one', async () => {
    it('add', async () => {
      await callAddThread('More', 'more', accounts[0]);
    });
    it('assert', async () => {
      await assertThreadArray();
    });

    // Remove last one
    it('detaching', async () => {
      await callDetachThread(2, accounts[0]);
    });
    it('assert', async () => {
      await assertThreadArray();
    })
  });

  describe('bump #1', async () => {
    it('bump', async () => {
      await bumpThreadIndexAt(1);
    });
    it('assert', async () => {
      await assertThreadArray();
    });
  });

  describe('adding a new one and removing the first one', async () => {
    it('add', async () => {
      await callAddThread('Lastone', 'last', accounts[0]);
    });
    it('assert', async () => {
      await assertThreadArray();
    });

    // Remove first one
    it('detach', async () => {
      await callDetachThread(0, accounts[0]);
    });
    it('assert', async () => {
      await assertThreadArray();
    });
  });

  describe('detach to remain 1 more', async () => {
    it('detach', async () => {
      await callDetachThread(0, accounts[0]);
    });
    it('assert', async () => {
      await assertThreadArray();
    });
  });

  describe('bump', async () => {
    it('bump', async () => {
      await bumpThreadIndexAt(0);
    });
    it('assert', async () => {
      await assertThreadArray();
    });
  });

  describe('detach to remain 1 more', async () => {
    it('detach', async () => {
      await callDetachThread(0, accounts[0]);
    });
    it('assert', async () => {
      await assertThreadArray();
      assert.equal(await callGetSize(), 0, 'All thread had to be removed');
    });
  });

  describe('add one again', async () => {
    it('add', async () => {
      await callAddThread('Revive', 'Noice', accounts[1]);
    });
    it('assert', async () => {
      await assertThreadArray();
    });
  });
});