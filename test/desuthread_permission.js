import assertRevert from 'zeppelin-solidity/test/helpers/assertRevert';

const DesuBoard = artifacts.require('DesuBoard');
const DesuThread = artifacts.require('DesuThread');

contract('DesuThread permission test', async (accounts) => {
  let desuBoard;
  let desuThread;

  describe('Deploy', async () => {
    it('deploy DesuBoard', async () => {
      desuBoard = await DesuBoard.new({from: accounts[0]});
    });
    it('make new thread', async () => {
      await desuBoard.makeNewThread('t', 't', {from: accounts[1]});
      const threadAddress = await desuBoard.getThreadAt.call(0, {from: accounts[1]});
      desuThread = DesuThread.at(threadAddress);
    });
  });

  describe('functions everyone can call', async () => {
    // On Thread.sol
    it('getTitle()', async () => await desuThread.getTitle.call({from: accounts[2]}));
    it('post(string)', async () => await desuThread.post('Post#1', {from: accounts[2]}));
    it('getPoster(unit)', async () => await desuThread.getPoster.call(0, {from: accounts[2]}));
    it('getPostTimestamp(uint)', async () => await desuThread.getPostTimestamp.call(0, {from: accounts[2]}));
    it('getPostText(uint)', async () => await desuThread.getPostText.call(0, {from: accounts[2]}));
    it('getPostAt(uint)', async () => await desuThread.getPostAt.call(0, {from: accounts[2]}));
    it('getPosterArray(uint, uint)', async () => await desuThread.getPosterArray.call(0, 50, {from: accounts[2]}));
    it('getPostTimestampArray(uint, uint)', async () => await desuThread.getPostTimestampArray.call(0, 50, {from: accounts[2]}));
    it('getPostTextArray(uint, uint)', async () => await desuThread.getPostTextArray.call(0, 50, {from: accounts[2]}));
    it('getNumberOfPosts()', async () => await desuThread.getNumberOfPosts.call({from: accounts[2]}));
    it('getParentBoard()', async () => await desuThread.getParentBoard.call({from: accounts[2]}));
  });

  describe('functions only board owner can call from non owner', async () => {
    // On ManageableThread.sol
    it('removePost(uint)', async () => await assertRevert(desuThread.removePost.call(1, {from: accounts[2]})));
    it('destructThread()', async () => await assertRevert(desuThread.destructThread({from: accounts[2]})));
  });

  describe('functions only board owner can call from owner', async () => {
    // On ManageableThread.sol
    it('removePost(uint)', async () => desuThread.removePost.call(1, {from: accounts[0]}));
    // await desuThread.destructThread.call not NOW!
  });

  describe('Destruction', async () => {
    it('Call destructThread() from owner account', async() => {
      await desuThread.destructThread({from: accounts[0]});
    });
  });
});