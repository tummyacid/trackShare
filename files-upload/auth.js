var secrets = require('./secrets.json');
const express = require('express');
const http = require("http");

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool, Client } = require('pg')

const app = express();
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: false, limit: '20mb' }))

const authDB = new Pool({
    user: secrets.DBuser,
    host: secrets.DBhost,
    database: secrets.DBdatabase,
    password: secrets.DBpassword,
    port: secrets.DBport,
});

app.post("/register", async (req, res) => {
    try {
        email = req.body.email;
        password = req.body.password;
        moniker = req.body.moniker;

        if (!(email && password)) {
            res.status(400).send("email and password required");
        }

        userExists = await LookupByEmailAddress(email);

        if (userExists) {
            return res.status(409).send("User Already Exist.");
        }

        const cypher = await bcrypt.hash(password, 0x03);

        var userNew = await CreateLogin(email.toLowerCase(), cypher, moniker);

        const token = jwt.sign(
            { user_id: userNew, email },
            secrets.TokenKey,
            {
                expiresIn: "2h",
            }

        );

        await UpdateLogin(email, token);
        res.status(201).json(token);

    } catch (err) {
        console.log(err);
    }

});

// Login
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!(email && password)) {
            res.status(400).send("email and password required");
        }

        userExists = await LookupByEmailAddress(email);
        console.log(userExists);
        var authed = await bcrypt.compare(password, userExists.password);

        console.log("user authed: " + authed);
        if (authed === true) {
            const token = jwt.sign(
                { user_id: userExists.id, email },
                secrets.TokenKey,
                {
                    expiresIn: "2h",
                }
            );
            await UpdateLogin(email, token);
            res.status(200).json(token);
        }
        else {
            res.status(409);
        }
    } catch (err) {
        console.log(err);
    }
});

const verifyToken = (req, res, next) => {
    const token =
        req.body.token || req.query.token || req.headers["x-access-token"];

    if (!token) {
        return res.status(403).send("A token is required for authentication");
    }
    try {
        const decoded = jwt.verify(token, secrets.TokenKey);
        console.log(decoded);
        req.user = decoded;
    } catch (err) {
        return res.status(401).send("Invalid Token");
    }
    return next();
};

async function LookupByEmailAddress(emailAddress) {
    const text = 'SELECT * FROM login WHERE email = $1'
    const values = [emailAddress]
    return new Promise(function (resolve, reject) {

        authDB.connect(async function (err, client, done) {
            if (err) {
                console.log("Can not connect to the DB" + err);
                reject(err);
            }
            authDB.query(text, values)
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
    const text = 'INSERT INTO login(email, created, password, moniker) VALUES($1, NOW(), $2, $3) RETURNING id'
    const values = [emailAddress, password, moniker]
    return new Promise(function (resolve, reject) {

        authDB.connect(async function (err, client, done) {
            if (err) {
                console.log("Can not connect to the DB" + err);
                reject(err);
            }
            authDB.query(text, values)
                .then(resPersist => {
                    done();
                    resolve(resPersist.rows[0].id); //TODO: check result
                })
                .catch(errPersist => {
                    console.error(errPersist.stack);
                    reject(err);
                })
        })
    })
}


async function UpdateLogin(emailAddress, token) {
    const text = 'UPDATE login SET token = $1 WHERE email = $2'
    const values = [token, emailAddress]
    return new Promise(function (resolve, reject) {

        authDB.connect(async function (err, client, done) {
            if (err) {
                console.log("Can not connect to the DB" + err);
                reject(err);
            }
            authDB.query(text, values)
                .then(resPersist => {
                    done();
                    resolve(); //TODO: check result
                })
                .catch(errPersist => {
                    console.error(errPersist.stack);
                    reject(err);
                })
        })
    })
}


module.exports = verifyToken;
