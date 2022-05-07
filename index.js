const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
//----------------- JWT varification function --------------------//
function jwtVerifiction(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'your access is unauthorized-(401)' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'your access is forbidden-(403)' });
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    })
}
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vysxb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const productCollection = client.db('stockData').collection('products');
        //----------------- POST Oparation for token access --------------------//
        app.post('/signin', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
            res.send({ accessToken });

        })
        //----------------- GET Oparation for all products --------------------//
        app.get('/products', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        })
        //----------------- GET Oparation for single products--------------------//
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: ObjectId(id)
            };
            const product = await productCollection.findOne(query);
            res.send(product);
        })
        //----------------- POST Oparation for single products --------------------//
        app.post('/products', async (req, res) => {
            const newProduct = req.body;
            const result = await productCollection.insertOne(newProduct);
            res.send(result);
        })
        //----------------- DELETE oparation for single products --------------------//
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.send(result);
        })
        //----------------- PUT oparation for single product --------------------//
        app.put('/products/:id', async (req, res) => {
            const id = req.params.id;
            const updateProduct = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateQuantity = {
                $set: {
                    quantity: updateProduct.quantity,
                }
            };
            const result = await productCollection.updateOne(filter, updateQuantity, options);
            res.send(result);

        })

        //----------------- GET oparation for user items --------------------//
        app.get('/useritems', jwtVerifiction, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = productCollection.find(query);
                const products = await cursor.toArray();
                res.send(products);
            }
            else {
                res.status(403).send({ message: 'your access is forbidden-(403)' })
            }
        })

    }
    finally {
        //All Operation Done
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('running server');
});
app.listen(port, () => {
    console.log('listening to port')
});

