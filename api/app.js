var secrets = require('./secrets.json');
var auth = require('./auth');
const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const morgan = require('morgan');
const { Pool, Client } = require('pg')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const _ = require('lodash');


const client = new Pool({
    user: secrets.DBuser,
    host: secrets.DBhost,
    database: secrets.DBdatabase,
    password: secrets.DBpassword,
    port: secrets.DBport,
});
const app = express();
app.use(fileUpload({
    limits: {
        fileSize: 20 * 1024 * 1024 * 1024 //20MB max file(s) size
    },
}));
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: false, limit: '20mb' }))
app.use(cors());
app.use(morgan('dev'));

app.get("/viewTrack", (req, res) => {
    const text = 'SELECT gpx FROM track WHERE id = $1'
    const values = [req.query.id]
    client.connect(function (err, client, done) {
        if (err) {
            console.log("Can not connect to the DB" + err);
            res.status(500).send(err);
        }
        client
            .query(text, values, function (errTrack, resTrack) {
                done();
                if (err) {
                    console.log(errTrack);
                    res.status(400).send(errTrack);
                }
                if (resTrack.rowCount > 0) {
                    res.writeHead(200, { 'Content-Type': 'application/xml' });
                    res.write(resTrack.rows[0].gpx);
                    return res.end();
                }
                else { res.status(403).send(req.query.id + " not found"); }
            })
    })
});

app.post('/upload-gpxFile', async (req, res) => {
    try {
        if (!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            let gpxFile = req.files.gpxFile;

            var ip = req.headers['x-forwarded-for'] ||
                req.socket.remoteAddress ||
                null;

            persistResult = await persistGpxRequest(gpxFile.data, gpxFile.name, ip);
            res.send({
                status: true,
                trackId: persistResult,
                message: "File Uploaded",
                data: {
                    name: gpxFile.name,
                    mimetype: gpxFile.mimetype,
                    size: gpxFile.size
                }
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

// upload multiple files *not yet tested*
app.post('/upload-gpxFiles', async (req, res) => {
    try {
        if (!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            let data = [];

            //loop all files
            _.forEach(_.keysIn(req.files.gpxFiles), (key) => {
                let gpxFile = req.files.gpxFiles[key];

                persistResult = persistGpxRequest(gpxFile, gpxFile.name);

                console.log(persistResult);
                //push file details
                data.push({
                    name: gpxFile.name,
                    mimetype: gpxFile.mimetype,
                    size: gpxFile.size
                });
            });

            res.send({
                status: true,
                mapId: persistResult,
                message: 'Files are uploaded',
                data: data
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
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
            { id: userNew, email },
            secrets.TokenKey,
            {
                expiresIn: "2h",
            }
        );

        await UpdateLogin(email, token);
        res.status(201).json(
            {
                "x-access-token": token
            }
        );

    } catch (err) {
        console.log(err);
        res.status(500).send(err);
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
        var authed = await bcrypt.compare(password, userExists.password);

        if (authed === true) {
            const token = jwt.sign(
                { id: userExists.id, email },
                secrets.TokenKey,
                {
                    expiresIn: "1m",
                }
            );
            await UpdateLogin(email, token);
            res.status(200).json(
                {
                    "x-access-token": token
                }
            );
        }
        else {
            res.status(409);
        }
    } catch (err) {
        console.log(err);
    }
});

app.post('/gpsPosition', auth, async (req, res) => {
    try {
        if (!req.body.geometry) {
            res.send({
                status: false,
                message: 'No geometry uploaded'
            });
        } else {
            persistResult = await UpdatePosition(req.login.id, req.body.geometry, req.body.timestamp);
            res.send({
                status: true,
                positionId: persistResult,
                message: "Position Updated"
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

app.get('/gpsPosition', auth, async (req, res) => {
    try {
        persistResult = await GetLatestPosition(req.login.id);
        console.log(persistResult);
        res.send(persistResult);

    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
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
    const text = 'INSERT INTO login(email, created, password, moniker) VALUES($1, NOW(), $2, $3) RETURNING id'
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

        client.connect(async function (err, client, done) {
            if (err) {
                console.log("Can not connect to the DB" + err);
                reject(err);
            }
            client.query(text, values)
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
async function GetLatestPosition(userId) {
    const text = `SELECT  ST_X(position), ST_Y(position) FROM usrtrack WHERE loginId = $1 ORDER BY created DESC LIMIT 1;`
    const values = [userId]

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
async function UpdatePosition(userId, geometry, createdTime) {
    const text = `INSERT INTO usrTrack(logged, created, loginid, permission, position) VALUES (NOW(), to_timestamp($1, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), $2, 0, ST_GeomFromGeoJSON($3)) RETURNING id;`
    const values = [createdTime, userId, geometry]
    return new Promise(function (resolve, reject) {

        client.connect(async function (err, client, done) {
            if (err) {
                console.log("Can not connect to the DB" + err);
                reject(err);
            }
            client.query(text, values)
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

async function persistGpxRequest(gpx, filename, source) {
    const text = 'INSERT INTO track(gpx, created, filename, source, permission) VALUES($1, NOW(), $2, $3, 0) RETURNING id'
    const values = [gpx, filename, source]

    return new Promise(function (resolve, reject) {

        client.connect(async function (err, client, done) {
            if (err) {
                console.log("Can not connect to the DB" + err);
            }
            client.query(text, values)
                .then(resPersist => {
                    done();
                    resolve(resPersist.rows[0].id); //TODO: check result boefore ref id member
                })
                .catch(errPersist => {
                    console.error(errPersist.stack);
                    reject(err);
                })
        })
    })
}

module.exports = app;
