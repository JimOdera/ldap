const ldap = require('ldapjs');
const { Change, Attribute } = ldap;
require('dotenv').config();

function getEnvVar(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

const adminDN = getEnvVar('LDAP_ADMIN_DN');
const adminPassword = getEnvVar('LDAP_ADMIN_PASSWORD');
const baseDN = adminDN.split(',').filter(part => part.startsWith('dc=')).join(',');

function createClient() {
    return ldap.createClient({ url: getEnvVar('LDAP_URL') });
}

function bindClient(client, callback) {
    client.bind(adminDN, adminPassword, callback);
}

function addUser(client, callback) {
    const newDN = getEnvVar('LDAP_TEST_USER_DN');
    const userPassword = getEnvVar('LDAP_TEST_USER_PASSWORD');
    const entry = {
        cn: 'Test User',
        sn: 'User',
        uid: newDN.split(',')[0].split('=')[1],
        mail: 'testuser@ibm.com',
        userPassword: userPassword,
        objectClass: ['inetOrgPerson', 'organizationalPerson', 'person', 'top']
    };

    client.add(newDN, entry, (err) => {
        if (err) {
            if (err.name === 'EntryAlreadyExistsError') {
                console.warn('User already exists, skipping add');
            } else {
                console.error('Add user error:', err);
            }
        } else {
            console.log('User added successfully!');
        }
        callback();
    });
}

function checkUserLogin(userDN, userPassword, callback) {
    const userClient = createClient();
    userClient.bind(userDN, userPassword, (err) => {
        let result;
        if (err) {
            result = { success: false, error: err };
        } else {
            result = { success: true };
        }
        userClient.unbind((unbindErr) => {
            if (unbindErr) console.error('Error unbinding user client:', unbindErr);
            callback(null, result);
        });
    });
}

function modifyUser(client, callback) {
    const userDN = getEnvVar('LDAP_TEST_USER_DN');
    const mailChange = new Change({
        operation: 'replace',
        modification: new Attribute({ type: 'mail', values: ['testuser_new@ibm.com'] })
    });

    client.modify(userDN, mailChange, (err) => {
        if (err) console.error('Modify user error:', err);
        else console.log('User modified successfully!');
        callback();
    });
}

function deleteUser(client, callback) {
    const userDN = getEnvVar('LDAP_TEST_USER_DN');
    client.del(userDN, (err) => {
        if (err) console.error('Delete user error:', err);
        else console.log('User deleted successfully!');
        callback();
    });
}

function searchEntries(client, filter, callback) {
    const options = { scope: 'sub', filter, attributes: ['*'] };
    const entries = [];
    client.search(baseDN, options, (err, res) => {
        if (err) return callback(err);
        res.on('searchEntry', (entry) => entries.push(entry.attributes.reduce((acc, attr) => {
            acc[attr.type] = attr.values;
            return acc;
        }, {})));
        res.on('error', err => callback(err));
        res.on('end', () => callback(null, entries));
    });
}

module.exports = { createClient, bindClient, addUser, modifyUser, deleteUser, checkUserLogin, searchEntries, baseDN };