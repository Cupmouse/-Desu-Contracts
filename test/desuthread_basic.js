import assertRevert from 'zeppelin-solidity/test/helpers/assertRevert';

const DesuBoard = artifacts.require('DesuBoard');
const DesuThread = artifacts.require('DesuThread');

contract('DesuThread basic', async (accounts) => {
  let desuBoard;
  let desuThread;

  describe('Deploy', async () => {
    const title = 'Title abcdefghiあいうえ亜衣兎絵😺😻';
    const text = 'TEXT body body ABCD1234😻';

    it('deploy DesuBoard', async () => {
      desuBoard = await DesuBoard.new({from: accounts[0]});
    });
    it('make new thread', async () => {
      await desuBoard.makeNewThread(title, text, {from: accounts[1]});
      const threadAddress = await desuBoard.getFirstThread({from: accounts[5]});
      desuThread = DesuThread.at(threadAddress);

      const storedTitle = await desuThread.getTitle.call({from: accounts[6]});
      assert.equal(storedTitle, title, 'Title string corrupted');

      const storedText = await desuThread.getPostText.call(0, {from: accounts[6]});
      assert.equal(storedText, text, 'Text string corrupted');
    });
  });

  describe('Posts', async () => {
    it('empty text post should not be accepted', async () => {
      await assertRevert(desuThread.post('', {from: accounts[2]}), 'Empty post should not be accepted');
    });

    it('can not remove post #0', async () => {
      await assertRevert(desuThread.removePost(0, {from: accounts[0]}), 'Should not be able to remove post #0');
    });

    it('make a post', async () => {
      await desuThread.post('Look meme everyday', {from: accounts[5]});
    });

    it('remove post #1', async () => {
      await desuThread.removePost(1, {from: accounts[0]});
    });
    it('assert', async () => {
      const poster = await desuThread.getPoster.call(1, {from: accounts[0]});
      assert.equal(poster, '0x2222222222222222222222222222222222222222', 'Removed post\'s poster address should be changed');

      const timestamp = await desuThread.getPostTimestamp.call(1, {from: accounts[0]});
      assert.equal(timestamp, 0, 'Removed post\'s timestamp should be 0');

      const postText = await desuThread.getPostText.call(1, {from: accounts[0]});
      assert.equal(postText, 'にゃーん', 'Removed post\'s text should be changed');
    });
  });

  describe('Destruction', async() => {
    it('destructThread() destroys data', async () => {
      await desuThread.destructThread({from: accounts[0]});
      let titleRemoved = await desuThread.getTitle.call({from: accounts[1]});
      assert.equal(titleRemoved, '', 'Title should be removed at the current state');
    });
  });
});
