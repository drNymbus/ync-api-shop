// const uuid = require('cassandra-driver').types.Uuid;
const crypto = require('crypto');
const nodemailer = require("nodemailer");

// Cassandra DB legacy; could be useful if we ever change to an SQL database (or reverse back to Cassandra)
// const session = {
    // select: "SELECT * FROM store.session WHERE cookie = ?",
    // insert: "INSERT INTO store.session (cookie,unperishable,last_update) VALUES (?, False, ?)",
    // update: "UPDATE store.session SET last_update = ? WHERE cookie = ?",
    // unperishable: "UPDATE store.session SET unperishable = true WHERE cookie = ?"
// }; exports.session = session;
const session = (client) => client.db('store').collection('session'); exports.session = session;

// const basket = {
//     select: "SELECT items FROM store.basket WHERE cookie = ?",
//     insert: "INSERT INTO store.basket (items, cookie) VALUES (?, ?)",
//     set: "UPDATE store.basket SET items = ? WHERE cookie = ?"
// }; exports.basket = basket;
const basket = (client) => client.db('store').collection('basket'); exports.basket = basket;

// const item = {
//     select_all: "SELECT id FROM store.item;",
//     select: "SELECT * FROM store.item WHERE id IN ?",
//     insert: "INSERT INTO store.item (id, image, display_name, description, price) VALUES (:id, textAsBlob(:image), :display_name, :description, :price)",
//     delete: "DELETE FROM store.item WHERE id IN ?",
//     image: "SELECT image FROM store.item WHERE id IN ?"
// }; exports.item = item;
const item = (client) => client.db('store').collection('item'); exports.item = item;

// const order = {
//     select: "SELECT id, items, address, postal_code, country, name, first_name, mail, phone, processed FROM store.user_order WHERE cookie = ? AND id = ?;",
//     insert: "INSERT INTO store.user_order (cookie, id, items, price, address, postal_code, country, name, first_name, mail, phone, paid, processed) VALUES (:cookie, :id, :items, :price, :address, :postal_code, :country, :name, :first_name, :mail, :phone, false, false)",
//     delete: "DELETE FROM store.user_order WHERE id = ?",
//     paid: "UPDATE store.user_order SET paid = true WHERE cookie = ? AND id = ?"
// }; exports.order = order;
const order = (client) => client.db('store').collection('order'); exports.session = order;

/* @desc: Return the token to be stored in the cookie
 * @return {bytes}: The encrypted random string
 */
const generate_cookie = () => {
    // return uuid.random();
    return crypto.randomUUID();
}; exports.generate_cookie = generate_cookie;

/* @desc: Verify if a cookie is valid, and return the response status code.
 * @param {Object} cookie: The cookie object to be asserted.
 * @return {Integer}: The response status code.
 */
const assert_cookie = async (client, cookie) => {
    let asserted = undefined;

    try {
        let sess = client.db('store').collection('session');
        let result = await sess.findOne({token: cookie});
        asserted = (result.token === cookie);
    } catch (err) {
        asserted = false;
    }

    console.log("[Cookie] ASSERTION: ", asserted, cookie);
    return asserted;
}; exports.assert_cookie = assert_cookie;

const assert_basket = async (client, basket) => {
    let asserted = true;

    try {
        const items = await client.db('store').collection('quantity')
            .find({id: {$in:Object.keys(basket.items)}}).toArray();
        let quantities = {};
        for (const row of items) { quantities[row.id] = row.sizes; }

        for (const item in basket.items) {
            for (const size in basket.items[item]) {
                const qtty_asked = basket.items[item][size];
                const qtty_store = quantities[item][size];
                if (qtty_asked > qtty_store) { asserted = false; }
            }
        }
    } catch (err) {
        asserted = false;
        console.error(`assert_basket: ${err}`);
    }

    console.log("[Basket] ASSERTION: ", asserted, basket);
    return asserted;
}; exports.assert_basket = assert_basket;

const release_basket = async (client, items) => {
    const quantity = client.db('store').collection('quantity');

    for (const id in items) {
        let db_item = await quantity.findOne({id: {$eq: id}})
            .catch(e => console.error(`[utils;release_basket] ${e}`));

        for (const size in items[id]) {
            const db_quantity = db_item.sizes[size];
            const basket_quantity = items[id][size];
            db_item.sizes[size] = db_quantity + basket_quantity;
        }

        quantity.replaceOne({id: item}, db_item)
            .catch(e => console.error(`[utils;release_basket] ${e}`));
    }
}; exports.release_basket = release_basket;

const hold_basket = async (client, items) => {
    const quantity = client.db('store').collection('quantity');

    for (const id in items) {
        let db_item = await quantity.findOne({id: {$eq: id}})
            .catch(e => console.error(`[utils;hold_basket] ${e}`));

        for (const size in items[id]) {
            const db_quantity = db_item.sizes[size];
            const basket_quantity = items[id][size];
            db_item.sizes[size] = db_quantity - basket_quantity;
        }

        quantity.replaceOne({id: item}, db_item)
            .catch(e => console.error(`[utils;hold_basket] ${e}`));
    }
}; exports.hold_basket = hold_basket;

const compute_price_order = async (client, order) => {
    // Gather every item price, updating quantity at the same time;
    const items = await client.db('store').collection('item')
        .find({id: {$in:Object.keys(order.items)}},{projection: {id:true, price:true}}).toArray();
    let prices = {};
    for (const row of items) { prices[row.id] = row.price; }

    // Compute order price
    const fee = 0.01;
    let price = 0;
    for (const id in order.items) {
        for (const size in order.items[id]) {
            const quantity = order.items[id][size];
            price += (prices[id] + fee) * quantity;
        }
    }

    return price;
}; exports.compute_price_order = compute_price_order;

/* @desc: Send a bad request error message to the client with the appropriate status code.
 * @param {Object} response: The response object handled by express.
 * @param {Integer} status: The status to be sent to the client.
 * @param {Object} error: The error object to be sent to the client.
 * @return {undefined}: Nothing is returned.
 */
const failed_request = (response, status, error) => { return response.status(status).json(error); };
exports.failed_request = failed_request;

const log_query = (m, req) => { console.log({method: m, cookie: req.signedCookies, url: req.url, query: req.query, body: req.body}); };
exports.log_query = log_query;

const send_mail = async (order) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.zoho.eu", port: 465,
        secure: true, // Use `true` for port 465, `false` for all other ports
        auth: {
            user: process.env.ZOHO_MAIL,
            pass: process.env.ZOHO_PASSWORD
        }
    });

    // send mail with defined transport object
    const info = await transporter.sendMail({
        from: '"Young New Corporation" <yng.corporation@zohomail.eu>',
        to: order.mail,
        subject: "Yooo! Wooooo!",
        text: `Bonjour ${order.first_name} ${order.name}, merci d'avoir commandé ! ID: ${order.id}`,
        html: `<p>Bonjour ${order.first_name} ${order.name}</p><p>, merci d'avoir commandé !</p><p> ID: <b>${order.id}</b></p>`
    });

    return info;
}; exports.send_mail = send_mail;
