# LDAP Operations Integration

This project demonstrates a series of LDAP (Lightweight Directory Access Protocol) operations including adding, modifying, and deleting users, as well as checking user login and searching entries. The project is equipped with integration tests and an Express server for handling LDAP operations via HTTP endpoints.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Running Tests](#running-tests)
- [API Endpoints](#api-endpoints)
- [License](#license)

## Prerequisites

Ensure you have the following installed:

- Node.js (>=14.x)
- npm (>=6.x)
- An LDAP server for testing

## Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/yourusername/newldap.git
cd newldap
npm install
```

## Environment Variables

Create a `.env` file in the root directory and set the following environment variables:

```env
LDAP_URL=ldap://your-ldap-url
LDAP_ADMIN_DN=cn=admin,dc=example,dc=com
LDAP_ADMIN_PASSWORD=adminpassword
LDAP_TEST_USER_DN=uid=testuser,ou=users,dc=example,dc=com
LDAP_TEST_USER_PASSWORD=testpassword
NODE_ENV=development
PORT=3000
```

## Usage

Start the application:

```bash
npm start
```

You should see the following output:

```plaintext
Server running on port 3000
```

## Running Tests

Run the integration tests:

```bash
npm test
```

You should see the following output:

```plaintext
  LDAP Operations Integration Tests
    ✔ should add a user
    ✔ should allow user login with correct password
    ✔ should reject login with incorrect password
    ✔ should modify the user
    ✔ should delete the user
```

## API Endpoints

The Express server provides the following endpoints for LDAP operations:

- **POST /add-user**: Adds a new user to the LDAP directory.
- **POST /check-login**: Checks if a user can log in with the provided credentials.
- **PUT /modify-user**: Modifies the user's mail attribute.
- **DELETE /delete-user**: Deletes the user from the LDAP directory.
- **GET /search-users**: Searches for users with the `inetOrgPerson` object class.

### Example Requests

- **Add User**

```bash
curl -X POST http://localhost:3000/add-user
```

- **Check Login**

```bash
curl -X POST http://localhost:3000/check-login -H "Content-Type: application/json" -d '{"userDN":"uid=testuser,ou=users,dc=example,dc=com","password":"testpassword"}'
```

- **Modify User**

```bash
curl -X PUT http://localhost:3000/modify-user
```

- **Delete User**

```bash
curl -X DELETE http://localhost:3000/delete-user
```

- **Search Users**

```bash
curl -X GET http://localhost:3000/search-users
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
