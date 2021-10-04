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

//add other middleware

app.post("/register", async (req, res) => {
    try {
        email = req.body.email;
        password = req.body.password;
        moniker = req.body.moniker;

        if (!(email && password)) {
            res.status(400).send("All input is required");
        }

        userExists = await LookupByEmailAddress(email);

        if (userExists) {
            return res.status(409).send("User Already Exist.");
        }

        const cypher = await bcrypt.hash(password, 0x03);

            await CreateLogin(email.toLowerCase(), cypher, moniker).then(async function (err, userNew) {
                const token = jwt.sign(
                    { user_id: userNew, email },
                    secrets.TokenKey,
                    {
                        expiresIn: "2h",
                    }
                );
                res.status(201).json(token);
            });
       
    } catch (err) {
        console.log(err);
    }

});

// Login
app.post("/login", async (req, res) => {
    try {
        // Get user input
        const { email, password } = req.body;
        if (!(email && password)) {
            res.status(400).send("All input is required");
        }

        userExists = await LookupByEmailAddress(email);
        console.log(userExists);
        await bcrypt.compare(password, userExists.password).then((authed) => {
		console.log("user authed: " + authed);
            if (authed === true) {
                const token = jwt.sign(
                    { user_id: userExists.id, email },
			secrets.TokenKey,
                    {
                        expiresIn: "2h",
                    }
                );
                res.status(200).json(token);
            }
            else
            {
                res.status(409);
            }
        });
    } catch (err) {
        console.log(err);
    }
});

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

const server = http.createServer(app);

const { API_PORT } = process.env;
const port = process.env.PORT || API_PORT;

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
