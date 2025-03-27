require('dotenv').config();
const ldap = require('ldapjs');
const { Change, Attribute } = ldap;

function getEnvVar(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

const LDAP_CONFIG = {
    URL: getEnvVar('LDAP_URL'),
    ADMIN_DN: getEnvVar('LDAP_ADMIN_DN'),
    ADMIN_PASSWORD: getEnvVar('LDAP_ADMIN_PASSWORD'),
    TEST_USER_DN: getEnvVar('LDAP_TEST_USER_DN'),
    TEST_USER_PASSWORD: getEnvVar('LDAP_TEST_USER_PASSWORD')
};

const client = ldap.createClient({
    url: LDAP_CONFIG.URL,
    tlsOptions: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
});

client.bind(LDAP_CONFIG.ADMIN_DN, LDAP_CONFIG.ADMIN_PASSWORD, (err) => {
    if (err) {
        console.error('Admin bind error:', err);
        process.exit(1);
    }
    console.log('Admin bound successfully');

    executeOperationsSequence()
        .catch(console.error)
        .finally(() => client.unbind());
});

async function executeOperationsSequence() {
    try {
        await performOperation(addUser);
        await performOperation(checkLogin);
        await performOperation((cb) => searchEntries('After add', cb)); // Fixed
        await performOperation(modifyUser);
        await performOperation((cb) => searchEntries('After modify', cb));
        await performOperation(deleteUser);
        await performOperation((cb) => searchEntries('After delete', cb));
    } catch (error) {
        console.error('Operation failed:', error);
    }
}

function performOperation(operation) {
    return new Promise((resolve, reject) => {
        operation((error) => {
            if (error) reject(error);
            else resolve();
        });
    });
}

function addUser(callback) {
    const entry = {
        cn: 'Test User',
        sn: 'User',
        uid: LDAP_CONFIG.TEST_USER_DN.split(',')[0].split('=')[1],
        mail: 'testuser@ibm.com',
        userPassword: LDAP_CONFIG.TEST_USER_PASSWORD,
        objectClass: ['inetOrgPerson', 'organizationalPerson', 'person', 'top']
    };

    client.add(LDAP_CONFIG.TEST_USER_DN, entry, (err) => {
        handleOperationResult(err, 'User added', 'Add user error', callback);
    });
}

function checkLogin(callback) {
    const userClient = ldap.createClient({
        url: LDAP_CONFIG.URL,
        tlsOptions: { rejectUnauthorized: process.env.NODE_ENV === 'production' }
    });

    userClient.bind(LDAP_CONFIG.TEST_USER_DN, LDAP_CONFIG.TEST_USER_PASSWORD, (err) => {
        handleOperationResult(err, 'User login successful', 'User login failed', () => {
            userClient.unbind(() => callback());
        });
    });
}

function modifyUser(callback) {
    const mailChange = new Change({
        operation: 'replace',
        modification: new Attribute({
            type: 'mail',
            values: ['testuser_new@ibm.com']
        })
    });

    client.modify(LDAP_CONFIG.TEST_USER_DN, mailChange, (err) => {
        handleOperationResult(err, 'User modified', 'Modify user error', callback);
    });
}

function deleteUser(callback) {
    client.del(LDAP_CONFIG.TEST_USER_DN, (err) => {
        handleOperationResult(err, 'User deleted', 'Delete user error', callback);
    });
}

function searchEntries(label, callback) {
    console.log(`\n=== ${label} ===`);
    const baseDN = LDAP_CONFIG.ADMIN_DN.split(',')
        .filter(part => part.startsWith('dc='))
        .join(',');

    client.search(baseDN, {
        scope: 'sub',
        filter: '(objectClass=inetOrgPerson)'
    }, (err, res) => {
        if (err) return callback(err);

        res.on('searchEntry', (entry) => {
            const plainObj = entry.attributes.reduce((acc, attr) => {
                acc[attr.type] = attr.values;
                return acc;
            }, {});
            console.log('Entry:', plainObj);
        });

        res.on('error', err => {
            console.error('Search error:', err);
            callback(err);
        });

        res.on('end', (result) => {
            console.log('Search completed with status:', result.status);
            callback();
        });
    });
}


function handleOperationResult(error, successMessage, errorMessage, callback) {
    if (error) {
        if (error.name === 'EntryAlreadyExistsError') {
            console.warn('Entry already exists, skipping operation');
            return callback();
        }
        console.error(errorMessage + ':', error);
        return callback(error);
    }
    console.log(successMessage + '!');
    callback();
}