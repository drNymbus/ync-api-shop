const utils = require('./utils.js');

const get = async (req, res, client) => {
    utils.log_query('item.get', req);

    const cookie = req.signedCookies.ync_shop;
    let assertion = await utils.assert_cookie(client, cookie);
    if (!assertion) return utils.failed_request(res, 401, {'error': 'Invalid cookie'});

    let item = client.db('store').collection('item');
    let result = [];
    if (req.query.id === undefined) { // Retrieve all store items
        result = await item.find({id : {$ne:'dummy'}}).toArray();
    } else { // Retrieve items specified in query id field
        result = await item.find({id: { $in: req.query.id.split(',') }}).toArray();
    }

    res.status(200).json(result);
}; exports.get = get;

/*
const post = async (req, res, client) => {
    utils.log_query('item.post', req);

    const cookie = req.signedCookies.ync_shop;
    let assertion = await utils.assert_cookie(client, cookie);
    if (!assertion) return utils.failed_request(res, 401, {'error': 'Invalid cookie'});

    const valid_ids = [], unvalid_ids = [];
    res.status(200).json({completed: valid_ids, rejected: unvalid_ids}); // send all ids (completed & rejected)
}; exports.post = post;

const remove = async (req, res, client) => {
    utils.log_query('item.remove', req);

    const cookie = req.signedCookies.ync_shop;
    let assertion = await utils.assert_cookie(client, cookie);
    if (!assertion) return utils.failed_request(res, 401, {'error': 'Invalid cookie'});

}; exports.remove = remove;
*/
