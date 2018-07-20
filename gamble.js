//gamble.js
// Using NeDB b/c lazy
var Datastore = require('nedb');

var users = new Datastore({ filename: 'db/users.db', autoload: true });
var prevcmd = new Datastore();

var User = (function(){
    return function item(id){
        this._id = id;
        this.bal = 10000;
    };
}());

module.exports = {
    currentTime: function() {
        return new Date().getTime();
        //this.currentTime(); to use
    },

    createUser: function(userId) {
        return new Promise(function(resolve, reject) {
            let newUser = new User(userId);
            users.insert(newUser, function (err, newUsr){
                if (err) {
                    reject(err);
                }
                else {
                    resolve(newUsr.bal);
                }
            });
        });

    },

    userExists: function(userId) {
        return new Promise(function(resolve, reject){
            users.count({_id: userId}, function (err, user) {
                if (err) {
                    reject(err);
                } else {
                    resolve(user === 1);
                }
            })
        });
    },

    getBal: function(userId) {
        return new Promise(function(resolve, reject){
            users.findOne({ _id: userId }, function (err, user) {
                if (err) {
                    reject(err);
                } else {
                    resolve(user.bal);
                }
            });
        })
    },

    addBal: function(userId, amt) {
        return new Promise(function(resolve, reject){
            users.findOne({ _id: userId }, function (err, user) {
                if (err) {
                    reject(err);
                } else {
                    let newAmt = user.bal + amt;
                    users.update({ _id: userId }, { $set: { bal: newAmt } }, function (err, rep) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                }
            });

        })
    },

    takeBal: function(userId, amt) {
        return new Promise(function(resolve, reject){
            users.findOne({ _id: userId }, function (err, user) {
                if (err) {
                    reject(err);
                } else {
                    let newAmt = Math.max(user.bal - amt, 0);
                    users.update({ _id: userId }, { $set: { bal: newAmt } }, function (err, rep) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                }
            });

        })
    }
};