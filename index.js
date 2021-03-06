const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()


const uri = "mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rqh1y.mongodb.net/burjAlArab?retryWrites=true&w=majority";
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

var serviceAccount = require("./Configs/bruj-al-arab-11148-firebase-adminsdk-s6620-75de411005.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIRE_DB
  });



const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
  const bookings = client.db("burjAlArab").collection("booking");
  console.log('connected');
  
  app.post('/addBooking', (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking)
        .then(result => {
            res.send(result.insertedCount > 0);
        })
    
})
app.get('/bookings', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
        const idToken = bearer.split(' ')[1];
        admin.auth().verifyIdToken(idToken)
            .then(function (decodedToken) {
                const tokenEmail = decodedToken.email;
                const queryEmail = req.query.email;
                if (tokenEmail == queryEmail) {
                    bookings.find({ email: queryEmail})
                        .toArray((err, documents) => {
                            res.status(200).send(documents);
                        })
                }
                else{
                    res.status(401).send('un-authorized access')
                }
            }).catch(function (error) {
                res.status(401).send('un-authorized access')
            });
    }
    else{
        res.status(401).send('un-authorized access')
    }
})
});


app.listen(port)