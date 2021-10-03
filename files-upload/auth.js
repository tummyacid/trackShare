var secrets = require('./secrets.json');
const app = require("./app");
const express = require('express');

const bcryptjs = require('bcryptjs');
const jwt = require('jwt');
const { Pool, Client } = require('pg')

const authDB = new Pool({
    user: secrets.DBuser,
    host: secrets.DBhost,
    database: secrets.DBdatabase,
    password: secrets.DBpassword,
    port: secrets.DBport,
});


const app = express();

// Register
app.post("/register", (req, res) => {
    try {
        const { email, moniker, password } = req.body;

        if (!(email && password)) {
            res.status(400).send("All input is required");
        }

        userExists = await LookupByEmailAddress(email);

        if (userExists) {
            return res.status(409).send("User Already Exist.");
        }

        encryptedPassword = await bcrypt.hash(password, 10);

        userNew = await CreateLogin(email.toLowerCase(), encryptedPassword, moniker);

        const token = jwt.sign(
            { user_id: userNew.id, email },
            secrets.TokenKey,
            {
                expiresIn: "2h",
            }
        );

        user.token = token;

        // return new user
        res.status(201).json(user);
    } catch (err) {
        console.log(err);
    }

});

// Login
app.post("/login", (req, res) => {
    // our login logic goes here
});

async function LookupByEmailAddress(emailAddress) {
    const text = 'SELECT * FROM login WHERE email = $1'
    const values = [emailAddress]
    return new Promise(function (resolve, reject) {

        client.connect(async function (err, client, done) {
            if (err) {
                console.log("Can not connect to the DB" + err);
                reject(err);
            }
            client.query(text, values)
                .then(resPersist => {
                    done();
                    resolve(resPersist.rows[0]); //TODO: check result
                })
                .catch(errPersist => {
                    console.error(errPersist.stack);
                    reject(err);
                })
        })
    })
}


async function CreateLogin(emailAddress, password, moniker) {
    const text = 'INSERT INTO login(email, created, moniker, password) VALUES($1, NOW(), $2, $3) RETURNING id'
    const values = [emailAddress, password, moniker]
    return new Promise(function (resolve, reject) {

        client.connect(async function (err, client, done) {
            if (err) {
                console.log("Can not connect to the DB" + err);
                reject(err);
            }
            client.query(text, values)
                .then(resPersist => {
                    done();
                    resolve(resPersist.rows[0]); //TODO: check result
                })
                .catch(errPersist => {
                    console.error(errPersist.stack);
                    reject(err);
                })
        })
    })
}