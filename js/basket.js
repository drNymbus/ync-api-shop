const utils = require('./utils.js');

const get = async (req, res, client) => {
    utils.log_query('basket.get', req);

    let cookie = req.signedCookies.ync_shop;
    let assertion = await utils.assert_cookie(client, cookie);
    if (!assertion) return utils.failed_request(res, 401, {'error': 'Invalid cookie'});

    // client.execute(utils.basket.select, [cookie])
    //     .then((result) => res.status(200).json(result.rows[0]))
    //     .catch((error) => {
    //         console.error('basket.get', error);
    //         res.status(500).json({'error': 'Internal server error'})
    //     });
    let basket = client.db('store').collection('basket');
    let count = await basket.countDocuments({token: cookie});
    if (count === 1) {
        let result = await basket.findOne({token: cookie});
        res.status(200).json(result);
    } else {
        console.error('session.retrieveSession: No document found');
        res.status(500).json({'error': 'Internal server error'});
    }
}; exports.get = get;

const post = async (req, res, client) => {
    utils.log_query('basket.post', req);

    const cookie = req.signedCookies.ync_shop;
    let assertion = await utils.assert_cookie(client, cookie);
    if (!assertion) return utils.failed_request(res, 401, {'error': 'Invalid cookie'});

    // let method = utils.basket.insert;
    // await client.execute(utils.basket.select, [cookie]).then((result) => {
    //     if (result.rows.length > 0) {
    //         if (result.rows[0].items === null) method = utils.basket.set;
    //     }
    // });
    // await client.execute(method, [req.body.items, cookie], {prepare: true});
    // client.execute(utils.basket.select, [cookie])
    //     .then((result) => res.status(200).json(result.rows[0]))
    //     .catch((error) => {
    //         console.error('basket.post', error);
    //         res.status(500).json({'error': 'Internal server error'});
    //     });
    try {
        let basket = client.db('store').collection('basket');
        await basket.updateOne({token: cookie}, {
            $set: {items: req.body.items}
        });
        res.status(200).json(req.body.items);
    } catch (error) {
        console.error('basket.post', error);
        res.status(500).json({'error': 'Internal server error'});
    }
}; exports.post = post;