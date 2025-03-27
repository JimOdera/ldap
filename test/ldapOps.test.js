const { expect } = require('chai');
require('dotenv').config();
const {
    createClient,
    bindClient,
    addUser,
    modifyUser,
    deleteUser,
    searchEntries,
    checkUserLogin
} = require('../ldapOps');

describe('LDAP Operations Integration Tests', function () {
    let client;
    const testUserDN = process.env.LDAP_TEST_USER_DN;
    const testUserPassword = process.env.LDAP_TEST_USER_PASSWORD;
    const uid = testUserDN.split(',')[0].split('=')[1];
    const userFilter = `(uid=${uid})`;

    this.timeout(10000);

    before((done) => {
        client = createClient();
        bindClient(client, done);
    });

    after((done) => client.unbind(() => done()));

    it('should add a user', (done) => {
        addUser(client, () => {
            searchEntries(client, userFilter, (err, entries) => {
                expect(err).to.be.null;
                expect(entries).to.have.length.greaterThan(0);
                done();
            });
        });
    });

    it('should allow user login with correct password', (done) => {
        checkUserLogin(testUserDN, testUserPassword, (err, result) => {
            expect(err).to.be.null;
            expect(result.success).to.be.true;
            done();
        });
    });

    it('should reject login with incorrect password', (done) => {
        checkUserLogin(testUserDN, 'wrongpassword', (err, result) => {
            expect(err).to.be.null;
            expect(result.success).to.be.false;
            expect(result.error).to.have.property('code', 49);
            done();
        });
    });

    it('should modify the user', (done) => {
        modifyUser(client, () => {
            searchEntries(client, userFilter, (err, entries) => {
                expect(err).to.be.null;
                expect(entries[0].mail).to.include('testuser_new@ibm.com');
                done();
            });
        });
    });

    it('should delete the user', (done) => {
        deleteUser(client, () => {
            searchEntries(client, userFilter, (err, entries) => {
                expect(err).to.be.null;
                expect(entries).to.be.empty;
                done();
            });
        });
    });
});