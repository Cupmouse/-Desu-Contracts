import assertRevert from 'zeppelin-solidity/test/helpers/assertRevert';
import expectThrow from 'zeppelin-solidity/test/helpers/expectThrow';

const DesuBoard = artifacts.require('DesuBoard');
const DesuThread = artifacts.require('DesuThread');

contract('DesuThread', async (accounts) => {

    let desuBoard;
    let desuThread;

    it('Deploy and check kanji and hiragana charactors are not corrupted', async () => {
        const title = 'Title abcdefghiあいうえ亜衣兎絵😺😻';
        const text = 'TEXT body body ABCD1234😻';

        desuBoard = await DesuBoard.new({from: accounts[0]});
        desuThread = await DesuThread.new(desuBoard.address, title, text, {from: accounts[0]});

        const storedTitle = await desuThread.getTitle.call({from: accounts[0]});
        assert.equal(storedTitle, title, 'Title string corrupted');

        const storedText = await desuThread.getPostText.call(0, {from: accounts[0]});
        assert.equal(storedText, text, 'Text string corrupted');
    });

    it('Make a new post from the owner account', async () => {
        const postText = 'Post #1';

        await desuThread.post(postText, {from: accounts[0]});

        await desuThread.getPostTimestamp.call(1, {from: accounts[0]});
        // There is no way to test whether it is right timestamp
        const storedPostText = await desuThread.getPostText.call(1, {from: accounts[0]});
        assert.equal(storedPostText, postText, 'Copy of post text differs from one on blockchain');
    });

    it('Make a another post from the another account A', async () => {
        const postText = 'Post #2 222';

        await desuThread.post(postText, {from: accounts[1]});

        await desuThread.getPostTimestamp.call(2, {from: accounts[0]});
        const storedPostText = await desuThread.getPostText.call(2, {from: accounts[0]});
        assert.equal(storedPostText, postText, 'Copy of post text differs from one on blockchain');
    });

    it('Make a empty text post which should not be accepted', async () => {
        await assertRevert(desuThread.post('', {from: accounts[2]}), 'Empty post should not be accepted');
    });

    it('Try to remove post #0 from owner account which cannot', async () => {
        await assertRevert(desuThread.removePost(0, {from: accounts[0]}), 'Should not be able to remove post #0');
    });

    it('Remove post #1 from owner account', async () => {
        await desuThread.removePost(1, {from: accounts[0]});

        const poster = await desuThread.getPoster.call(1, {from: accounts[0]});
        assert.equal(poster, '0x2222222222222222222222222222222222222222', "Removed post's poster address should be changed");

        const timestamp = await desuThread.getPostTimestamp.call(1, {from: accounts[0]});
        assert.equal(timestamp, 0, "Removed post's timestamp should be 0");

        const postText = await desuThread.getPostText.call(1, {from: accounts[0]});
        assert.equal(postText, 'にゃーん', "Removed post's text should be changed");
    });

    it('Remove post #2 from account A which should not be accepted', async () => {
        await assertRevert(desuThread.removePost(2, {from: accounts[1]}), 'Non owner account should not be able to remove a post');

        const poster = await desuThread.getPoster.call(2, {from: accounts[0]});
        assert.notEqual(poster, '0x2222222222222222222222222222222222222222', "Post should not be deleted");
    });

    it('Call destructThread() from non owner account A to see if it reverts', async () => {
        await assertRevert(desuThread.destructThread({from: accounts[1]}));
    });

    it('Call destructThread() from owner account', async() => {
        await desuThread.destructThread({from: accounts[0]});

        let titleRemoved = await desuThread.getTitle.call({from: accounts[1]});
        assert.equal(titleRemoved, '', 'Title should be removed at the current state');
    });
});