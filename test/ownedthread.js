import assertRevert from 'zeppelin-solidity/test/helpers/assertRevert';
import expectThrow from 'zeppelin-solidity/test/helpers/expectThrow';

const OwnedThread = artifacts.require('OwnedThread');

contract('OwnedThread', async (accounts) => {

    let ownedThread;

    it('Deploy and check kanji and hiragana charactors are not corrupted', async () => {
        const title = 'Title abcdefghiあいうえ亜衣兎絵😺😻';
        const text = 'TEXT body body ABCD1234😻';

        ownedThread = await OwnedThread.new(title, text, {from: accounts[0]});

        const storedTitle = await ownedThread.getTitle.call({from: accounts[0]});
        assert.equal(storedTitle, title, 'Title string corrupted');

        const storedText = await ownedThread.getPostText.call(0, {from: accounts[0]});
        assert.equal(storedText, text, 'Text string corrupted');
    });

    it('Make a new post from the owner account', async () => {
        const postText = 'Post #1';

        await ownedThread.post(postText, {from: accounts[0]});

        await ownedThread.getPostTimestamp.call(1, {from: accounts[0]});
        // There is no way to test whether it is right timestamp
        const storedPostText = await ownedThread.getPostText.call(1, {from: accounts[0]});
        assert.equal(storedPostText, postText, 'Copy of post text differs from one on blockchain');
    });

    it('Make a another post from the another account A', async () => {
        const postText = 'Post #2 222';

        await ownedThread.post(postText, {from: accounts[1]});

        await ownedThread.getPostTimestamp.call(2, {from: accounts[0]});
        const storedPostText = await ownedThread.getPostText.call(2, {from: accounts[0]});
        assert.equal(storedPostText, postText, 'Copy of post text differs from one on blockchain');
    });

    it('Make a empty text post which should not be accepted', async () => {
        await assertRevert(ownedThread.post('', {from: accounts[2]}), 'Empty post should not be accepted');
    });

    it('Try to remove post #0 from owner account which cannot', async () => {
        await assertRevert(ownedThread.removePost(0, {from: accounts[0]}), 'Should not be able to remove post #0');
    });

    it('Remove post #1 from owner account', async () => {
        await ownedThread.removePost(1, {from: accounts[0]});

        const poster = await ownedThread.getPoster.call(1, {from: accounts[0]});
        assert.equal(poster, '0x2222222222222222222222222222222222222222', "Removed post's poster address should be changed");

        const timestamp = await ownedThread.getPostTimestamp.call(1, {from: accounts[0]});
        assert.equal(timestamp, 0, "Removed post's timestamp should be 0");

        const postText = await ownedThread.getPostText.call(1, {from: accounts[0]});
        assert.equal(postText, 'にゃーん', "Removed post's text should be changed");
    });

    it('Remove post #2 from account A which should not be accepted', async () => {
        await assertRevert(ownedThread.removePost(2, {from: accounts[1]}), 'Non owner account should not be able to remove a post');

        const poster = await ownedThread.getPoster.call(2, {from: accounts[0]});
        assert.notEqual(poster, '0x2222222222222222222222222222222222222222', "Post should not be deleted");
    });

    it('Call destructThread() from non owner account A to see if it reverts', async () => {
        await assertRevert(ownedThread.destructThread({from: accounts[1]}));
    });

    it('Call destructThread() from owner account', async() => {
        await ownedThread.destructThread({from: accounts[0]});

        let titleRemoved = await ownedThread.getTitle.call({from: accounts[1]});
        assert.equal(titleRemoved, '', 'Title should be removed at the current state');
    });
});