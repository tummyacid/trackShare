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

app.get("/api/viewTrack", (req, res) => {
    const text = 'SELECT gpx FROM track WHERE id = $1'
    const values = [req.query.id]
    client.connect(function (err, client, done) {
        if (err) {
            console.log("Can not connect to the DB" + err);
        }
        client
            .query(text, values, function (err, resTrack) {
                done();
                if (err) {
                    console.log(err);
                    res.status(400).send(err);
                }
                res.writeHead(200, { 'Content-Type': 'application/xml' });
                res.write(resTrack.rows[0].gpx);
                return res.end();
            })
    })
});

app.post('/api/upload-gpxFile', async (req, res) => {
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
app.post('/api/upload-gpxFiles', async (req, res) => {
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

app.post("/api/register", async (req, res) => {
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
        res.status(201).json(token);

    } catch (err) {
        console.log(err);        
        res.status(500).send(err);
    }

});

// Login
app.post("/api/login", async (req, res) => {
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

app.post('/api/gpsPosition', auth, async (req, res) => {
    try {
        if (!req.body.geometry) {
            res.send({
                status: false,
                message: 'No geometry uploaded'
            });
        } else {
            persistResult = await UpdatePosition(req.body.login, req.body.geometry);
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

app.get('/api/gpsPosition', auth, async (req, res) => {
    try {
            persistResult = await GetLatestPosition(req.login.id);
            console.log(gpsPosition);
            res.send({
                status: true,
                message: gpsPosition
            });
        
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
async function GetLatestPosition(userId)
{
    const text = `SELECT position FROM usrtrack WHERE loginId = $1 ORDER BY created DESC LIMIT 1;`
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
async function UpdatePosition(userId, geometry) {
    const text = `INSERT INTO usrTrack(created, loginid, permission, position) VALUES (NOW(), $1, 0, ST_GeomFromGeoJSON($2)) RETURNING id;`
    const values = [userId, geometry]
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

async function persistGpxRequest(gpx, filename, source) {
    const text = 'INSERT INTO track(gpx, created, filename, source) VALUES($1, NOW(), $2, $3) RETURNING id'
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
