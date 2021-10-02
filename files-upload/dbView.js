const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const { Pool, Client } = require('pg')
const _ = require('lodash');

const app = express();

// pools will use environment variables
// for connection information


// enable files upload
app.use(fileUpload({
    createParentPath: true,
    limits: { 
        fileSize: 20 * 1024 * 1024 * 1024 //20MB max file(s) size
    },
}));

//add other middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));

// retrieve track
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
			res.writeHead(200, {'Content-Type': 'application/xml'});
			res.write(resTrack.rows[0].gpx);
			return res.end();
		})
	})
});
	

// upoad single file
app.post('/api/upload-gpxFile', async (req, res) => {
    try {
        if(!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            let gpxFile = req.files.gpxFile;

		var ip = req.headers['x-forwarded-for'] ||
			     req.socket.remoteAddress ||
			     null;

		persistResult = await persistGpxRequest(gpxFile.data , gpxFile.name, ip);            
            //send response
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
        res.status(500).send(err);
    }
});

// upload multiple files
app.post('/api/upload-gpxFiles', async (req, res) => {
    try {
        if(!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            let data = []; 
    
            //loop all files
            _.forEach(_.keysIn(req.files.gpxFiles), (key) => {
                let gpxFile = req.files.gpxFiles[key];
                
		persistResult = persistGpxRequest(gpxFile , gpxFile.name);

		console.log(persistResult);
                //push file details
                data.push({
                    name: gpxFile.name,
                    mimetype: gpxFile.mimetype,
                    size: gpxFile.size
                });
            });
    
            //return response
            res.send({
                status: true,
		mapId: persistResult,
                message: 'Files are uploaded',
                data: data
            });
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

//make uploads directory static
app.use(express.static('uploads'));

async function persistGpxRequest(gpx, filename, source) {
	const text = 'INSERT INTO track(gpx, created, filename, source) VALUES($1, NOW(), $2, $3) RETURNING id'
	const values = [gpx, filename, source]

	return new Promise(function (resolve, reject) {

	client.connect(async function (err, client, done) {
		if (err) {
			console.log("Can not connect to the DB" + err);
		}
		client.query(text, values)
		.then( resPersist => {
			done();
			resolve(resPersist.rows[0].id); //TODO: check result boefore ref id member
		})
		.catch (errPersist => {
			console.error(errPersist.stack);
			reject(err);
		})
	})
	})
}

//start app 
const port = process.env.PORT || 3000;

app.listen(port, () => 
  console.log(`App is listening on port ${port}.`)
);
