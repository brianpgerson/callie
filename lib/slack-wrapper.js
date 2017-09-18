'use strict';

var _ = require('lodash');
var request = require('request');
var vow = require('vow');
var extend = require('extend');

class SlackWrapper {
    /**
     * @param {object} params
     * @constructor
     */

     constructor() {}

    /**
     * Posts a message to a channel by ID
     * @param {string} id - channel ID
     * @param {string} text
     * @param {object} params
     * @returns {vow.Promise}
     */
    postMessage(id, text, params) {
        params = extend({
            text: text,
            channel: id,
            username: 'callie'
        }, params);

        return this._api('chat.postMessage', params);
    }

    /**
     * Posts a message to user by name
     * @param {string} name
     * @param {string} text
     * @param {object} params
     * @param {function} cb
     * @returns {vow.Promise}
     */
    postMessageToUser(name, text, params, cb) {
        return this._post((params || {}).slackbot ? 'slackbot' : 'user', name, text, params, cb);
    }

    /**
     * Posts a message to group by name
     * @param {string} name
     * @param {string} text
     * @param {object} params
     * @param {function} cb
     * @returns {vow.Promise}
     */
    postMessageToGroup(name, text, params, cb) {
        return this._post('group', name, text, params, cb);
    }

    /**
     * Common method for posting messages
     * @param {string} type
     * @param {string} name
     * @param {string} text
     * @param {object} params
     * @param {function} cb
     * @returns {vow.Promise}
     * @private
     */
    _post(type, name, text, params, cb) {
        var method = ({
            'group': 'getGroupId',
            'channel': 'getChannelId',
            'user': 'getChatId',
            'slackbot': 'getUserId'
        })[type];

        if (typeof params === 'function') {
            cb = params;
            params = null;
        }

        return this[method](name).then(function(itemId) {
            return this.postMessage(itemId, text, params);
        }.bind(this)).always(function(data) {
            if (cb) {
                cb(data._value);
            }
        });
    }

    /**
     * Preprocessing of params
     * @param params
     * @returns {object}
     * @private
     */
    _preprocessParams(params) {
        Object.keys(params).forEach(function(name) {
            var param = params[name];

            if (param && typeof param === 'object') {
                params[name] = JSON.stringify(param);
            }
        });

        params.as_user = 'callie';
        return params;
    }

    /**
     * Send request to API method
     * @param {string} methodName
     * @param {object} params
     * @returns {vow.Promise}
     * @private
     */
    _api(methodName, params) {
        var data = {
            url: 'https://slack.com/api/' + methodName,
            form: this._preprocessParams(params)
        };

        console.log(params)

        return new vow.Promise(function(resolve, reject) {

            request.post(data, function(err, request, body) {
                if (err) {
                    reject(err);
                    console.log('err', err);
                    return false;
                }

                try {
                    body = JSON.parse(body);

                    // Response always contain a top-level boolean property ok,
                    // indicating success or failure
                    if (body.ok) {
                        resolve(body);
                        console.log('body', body);
                    } else {
                        reject(body);
                        console.log('reject', body);
                    }

                } catch (e) {
                    reject(e);
                }
            });
        });
    }
}

module.exports = SlackWrapper;
