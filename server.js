const express = require('express');
const bodyParser = require('body-parser');
const { createClient, bindClient, checkUserLogin, addUser, modifyUser, deleteUser, searchEntries } = require('./ldapOps');

const app = express();
app.use(bodyParser.json());

// Middleware to handle LDAP client creation
app.use(async (req, res, next) => {
    req.ldapClient = createClient();
    await new Promise((resolve, reject) => {
        bindClient(req.ldapClient, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: err.message });
});

// Routes
app.post('/add-user', async (req, res) => {
    await new Promise((resolve) => addUser(req.ldapClient, resolve));
    res.json({ message: 'User added successfully' });
});

app.post('/check-login', async (req, res) => {
    const { userDN, password } = req.body;
    const result = await new Promise((resolve) => {
        checkUserLogin(userDN, password, (err, result) => resolve(result));
    });
    res.json(result);
});

app.put('/modify-user', async (req, res) => {
    await new Promise((resolve) => modifyUser(req.ldapClient, resolve));
    res.json({ message: 'User modified successfully' });
});

app.delete('/delete-user', async (req, res) => {
    await new Promise((resolve) => deleteUser(req.ldapClient, resolve));
    res.json({ message: 'User deleted successfully' });
});

app.get('/search-users', async (req, res) => {
    const entries = await new Promise((resolve) => {
        searchEntries(req.ldapClient, '(objectClass=inetOrgPerson)', (err, entries) => {
            if (err) return resolve([]);
            resolve(entries);
        });
    });
    res.json(entries);
});

// Cleanup LDAP client after each request
app.use((req, res, next) => {
    req.ldapClient.unbind(() => { });
    next();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});