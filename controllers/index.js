const router = require('express').Router()
const { forwardAuthenticated, ensureAuthenticated } = require('../config/auth.js')
const Cart = require('../controllers/cart.js')

const { Pool } = require('pg');

/*
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});
*/

// Used to local testing

const pool = new Pool({
    user: 'eqoaufryrlziba',
    host: 'ec2-54-235-104-136.compute-1.amazonaws.com',
    database: 'debldnvrsqnjov',
    password: 'ca96d213b57dca84daf23d6c6e76840266b0aa26f73bbf30bff67f81d84002ff',
    port: 5432,
    ssl: true
});


router.get('/', async (req, res) => {

    //recommended stuff

    let count = await Cart.GetCartCount(req.user);
    res.render('pages/index', { loggedIn: req.isAuthenticated(), cartCount: count});
    
});

router.get('/register', forwardAuthenticated, async(req, res) => {
    let count = await Cart.GetCartCount(req.user);
    res.render('pages/register', { loggedIn: req.isAuthenticated(), cartCount: count })
})

router.get('/login', forwardAuthenticated, async(req, res) => {
    let count = await Cart.GetCartCount(req.user);
    res.render('pages/login', { loggedIn: req.isAuthenticated(), cartCount: count, errorFlash: req.flash('error'), successFlash: req.flash('success') })
})

router.get('/resetpassword/:token', async (req, res) => {
    // check that token is valid
    const client = await pool.connect();
    client.query("Sel")

    //res.render('pages/index');
});

router.get('/forgotpassword', async (req, res) => {
    let count = await Cart.GetCartCount(req.user);
    res.render('pages/forgotpassword', { loggedIn: req.isAuthenticated(), cartCount: count, flashMessages: res.locals});
});

router.get('/search', async (req, res) => {
    let count = await Cart.GetCartCount(req.user);
    let search = req.query.search;

    console.log("searching for " + search);

    const client = await pool.connect();
        client.query("select * from products where upper(name) LIKE upper('%' || $1 || '%') OR upper(description) LIKE upper('%' || $1 || '%') OR upper(category) LIKE upper('%' || $1 || '%')", [search], (error, results) => {
            if (error) {
                console.log(error);
                res.render('pages/search', { loggedIn: req.isAuthenticated(), products: [] });
            } 
            else {
                console.log(results.rows.length + " results");
                res.render('pages/search', { loggedIn: req.isAuthenticated(), cartCount: count, products: results.rows });
            }
        });

        client.release();
});

router.get('/add', async (req, res) => {
    let count = await Cart.GetCartCount(req.user);
    res.render('pages/add', { loggedIn: req.isAuthenticated(), cartCount: count });
});

router.post('/add', async (req, res) => {
    try {
        if (req.body.name == "" || req.body.description == "" || req.body.price == "" || req.body.image_path == "" || req.body.category == "") {
            res.send("Error: not all fields were filled");
        }
        else {
            const client = await pool.connect();
            client.query('INSERT INTO products (name, description, price, image_path, category) values ($1, $2, $3, $4, $5)', [req.body.name, req.body.description, req.body.price, req.body.image_path, req.body.category], (error, results) => {
                if (error) throw error;    
            });
            res.send('<html><head><script>window.close();</script></head></html>');

            client.release();
        }
    } 
    catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
    
});

//router.get('/cart', ensureAuthenticated, async (req, res) => {
//    res.render('pages/cart', { loggedIn: req.isAuthenticated(), currentUser: req.user });
//});

router.post('/cartCount', ensureAuthenticated, async (req, res) => {
    try {
        const client = await pool.connect();

        client.query("SELECT * FROM cart_items WHERE email = $1", [req.user], (error, results) => {
            if (error) {
                if (error) throw error;
            } 
            else {
                console.log(results.rows.length + " cart items");
                res.json({cartItems: results.rows.length});
            }
        });

        client.release();
    } 
    catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
});

router.post('/cartAdd', ensureAuthenticated, async (req, res) => {
    console.log(req.user);
    console.log(req.body.id);
    console.log(req.body.quantity);
    
    //res.render('pages/account', { loggedIn: req.isAuthenticated(), currentUser: req.user });

    try {
        if (req.user == "" || req.body.id == "" || req.body.quantity == "") {
            res.send("Error: not all fields were filled");
        }
        else {
            const client = await pool.connect();
            client.query('INSERT INTO cart_items (email, item_id, quantity) values ($1, $2, $3)', [req.user, req.body.id, req.body.quantity], (error, results) => {
                if (error) throw error;    
            });

            client.release();
        }
    } 
    catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
});

router.get('/account', async (req, res) => {

    // Purchase history and other info
    let count = await Cart.GetCartCount(req.user);
    res.render('pages/account', { loggedIn: req.isAuthenticated(), cartCount: count, currentUser: req.user });
});

router.get('/cart', async (req, res) => {
    
    //res.render('pages/index');
});

module.exports = router;