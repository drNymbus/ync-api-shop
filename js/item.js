const utils = require('./utils.js');

const get = async (req, res, client) => {
    utils.log_query('item.get', req);

    const cookie = req.signedCookies.ync_shop;
    const assertion = await utils.assert_cookie(client, cookie);
    if (!assertion) return utils.failed_request(res, 401, {'error': 'Invalid cookie'});

    const item = client.db('store').collection('item');
    let result = [];
    if (req.query.id === undefined) { // Retrieve all store items
        result = await item.find({id : {$ne:'dummy'}}).toArray();
    } else { // Retrieve items specified in query id field
        result = await item.find({id: { $in: req.query.id.split(',') }}).toArray();
    }

    res.status(200).json(result);
}; exports.get = get;
