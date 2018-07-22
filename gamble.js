//gamble.js
// Using NeDB b/c lazy
const Datastore = require('nedb');

const users = new Datastore({ filename: 'db/users.db', autoload: true });
const prevcmd = new Datastore();

const User = (function(){
    return function item(id){
        this._id = id;
        this.bal = 10000;
        this.isAdmin = false;
        this.income = 1000;
        this.lastClaimed = new Date().getTime();
    };
}());

const BetResult = (function(){
    return function result(win, amt, newBal, bet){
        this.win = win;
        this.amt = amt;
        this.newBal = newBal
        this.bet = bet;
    };
}());

function randomNumber(max) {
    return Math.floor(Math.random()*Math.floor(max));
}

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

    isAdmin: function(userId) {
        return new Promise(function(resolve, reject){
            users.findOne({ _id: userId }, function (err, user) {
                if (err) {
                    reject(err);
                } else {
                    resolve(user.isAdmin);
                }
            });
        })
    },

    collectIncome: function(userId) {
        return new Promise(function(resolve, reject){
            users.findOne({ _id: userId }, function (err, user) {
                if (err) {
                    reject(err);
                } else {
                    let prevTime = user.lastClaimed;
                    let currTime = new Date().getTime();
                    let timeElapsed = currTime - prevTime;

                    if (timeElapsed < 300000){
                        return resolve(-1);
                    }

                    let income = (timeElapsed*user.income)/3600000;
                    let newAmt = user.bal + income;
                    users.update({ _id: userId }, { $set: { bal: newAmt, lastClaimed: currTime } }, function (err, rep) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(income);
                        }
                    });
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
    },

    flipCoin: function(userId, amt, bet) {
        return new Promise(function(resolve, reject){
            if (!(["h", "t"].indexOf(bet) > -1)) {
                reject("Invalid Bet");
            }
            const coin = ['h', 't'];
            let result = coin[randomNumber(2)];

            let map = {'h': 'heads', 't': 'tails'};
            let guess = map[result];

            if (bet === result){
                users.findOne({ _id: userId }, function (err, user) {
                    if (err) {
                        reject(err);
                    } else {
                        let newAmt = user.bal + amt;
                        users.update({ _id: userId }, { $set: { bal: newAmt } }, function (err, rep) {
                            if (err) {
                                reject(err);
                            } else {
                                let res = new BetResult(true, amt, newAmt, guess);
                                resolve(res);
                            }
                        });
                    }
                });
            } else {
                users.findOne({ _id: userId }, function (err, user) {
                    if (err) {
                        reject(err);
                    } else {
                        let newAmt = user.bal - amt;
                        users.update({ _id: userId }, { $set: { bal: newAmt } }, function (err, rep) {
                            if (err) {
                                reject(err);
                            } else {
                                let res = new BetResult(false, amt, newAmt, guess);
                                resolve(res);
                            }
                        });
                    }
                });
            }
        })
    }
};