const utils = require('./utils');

const createSession = async (req, res, client) => {
    utils.log_query('session.get.create', req);
    // No existing session: generate and sign a new cookie
    let cookie = utils.generate_cookie();

    let sess = client.db('store').collection('session');
    await sess.insertOne({
        token: cookie,
        unperishable: false,
        last_update: Date.now()
    });

    let basket = client.db('store').collection('basket');
    await basket.insertOne({
        token: cookie,
        items: {}
    });

    res.cookie('ync_shop', cookie, {signed: true, sameSite: 'None', secure: true});
    res.status(200).json({});
}; exports.createSession = createSession;

const retrieveSession = async (req, res, client) => {
    utils.log_query('session.get.retrieve', req);

    let cookie = req.signedCookies.ync_shop;
    let assertion = await utils.assert_cookie(client, cookie);
    if (!assertion) return utils.failed_request(res, 401, {'error': 'Invalid cookie'});

    // Update session
    let sess = client.db('store').collection('session');
    await sess.updateOne({token: cookie}, {
        $set: {last_update:Date.now()}
    });

    // Retrieve basket associated with session
    let basket = client.db('store').collection('basket');
    let count = await basket.countDocuments({token: cookie});
    if (count === 1) {
        let result = await basket.findOne({token: cookie});
        res.status(200).json(result);
    } else {
        console.error('session.retrieveSession: No document found');
        res.status(500).json({'error': 'Internal server error'});
    }
}; exports.retrieveSession = retrieveSession;
