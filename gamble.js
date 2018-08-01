//gamble.js
// Using NeDB b/c lazy
const Datastore = require('nedb');

const users = new Datastore({ filename: 'db/users.db', autoload: true });
//const prevcmd = new Datastore();

const User = (function(){
    return function item(id){
        this._id = id;
        this.bal = 10000;
        this.isAdmin = false;
        this.income = 1000;
        this.level = 1;
        this.xp = 0;
        this.wins = 0;
        this.lifetimeEarnings = 0;
        this.lastClaimed = (new Date().getTime()) - 1800000;
    };
}());

const BetResult = (function(){
    return function result(gameType, win, amt, earned, netGain, newBal, bet){
        this.gameType = gameType;
        this.win = win;
        this.amt = amt;
        this.earned = earned;
        this.netGain = netGain;
        this.newBal = newBal;
        this.bet = bet;
    };
}());

const IncomeCollection = (function(){
    return function income(id, amtGiven, income, newBal, time){
        this.id = id;
        this.amtGiven = amtGiven;
        this.income = income;
        this.newBal = newBal;
        this.time = time;
    };
}());

const AccountStats = (function(){
    return function account(accId, money, income, xp, level){
        this.accId = accId;
        this.money = money;
        this.income = income;
        this.xp = xp;
        this.level = level;
    };
}());

function randomNumber(max) {
    return Math.floor(Math.random()*Math.floor(max));
}

module.exports = {

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

    accountStats: function(userId){
        return new Promise(function(resolve, reject){
            users.findOne({ _id: userId }, function (err, user) {
                if (err) {
                    reject(err);
                } else {
                    let acc = new AccountStats(userId, user.bal, user.income, user.xp, user.level);
                    resolve(acc);
                }
            });
        })
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
                    let lifeTime = user.lifetimeEarnings + income;
                    users.update({ _id: userId }, { $set: { bal: newAmt, lastClaimed: currTime, lifetimeEarnings: lifeTime } }, function (err, rep) {
                        if (err) {
                            reject(err);
                        } else {
                            let inc = new IncomeCollection(userId, income, user.income, newAmt, timeElapsed);
                            resolve(inc);
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

    addXp: function(userId, amt) {
        return new Promise(function(resolve, reject){
            users.findOne({ _id: userId }, function (err, user) {
                if (err) {
                    reject(err);
                } else {
                    let newXp, newLevel, newIncome, levelsGained;
                    newXp = user.xp + amt;
                    levelsGained = Math.floor(newXp/1000);
                    newLevel = user.level + levelsGained;
                    newXp = newXp % 1000;
                    newIncome = user.income + levelsGained*500;
                    users.update({ _id: userId }, { $set: { level: newLevel, xp: newXp, income: newIncome } }, function (err, rep) {
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

            let map = {'h': 'Heads', 't': 'Tails'};
            let guess = map[result];

            if (bet === result){
                users.findOne({ _id: userId }, function (err, user) {
                    if (err) {
                        reject(err);
                    } else {
                        let newAmt = user.bal + amt;
                        let lifeTime = user.lifetimeEarnings + amt;
                        let wins = user.wins + 1;
                        users.update({ _id: userId }, { $set: { bal: newAmt, lifetimeEarnings: lifeTime, wins: wins } }, function (err, rep) {
                            if (err) {
                                reject(err);
                            } else {
                                let res = new BetResult("Coin Flip", true, amt, amt*2, amt, newAmt, guess);
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
                                let res = new BetResult("Coin Flip", false, amt, -(amt), -(amt), newAmt, guess);
                                resolve(res);
                            }
                        });
                    }
                });
            }
        })
    },

    getLeaderboard: function(stat){
        return new Promise(function(resolve, reject) {
            if (stat === "bal"){
                users.find({}).sort({bal: -1}).exec(function (err, top){
                    if (err) {
                        reject(err);
                    } else {
                        resolve(top);
                    }
                })
            } else if (stat === "wins"){
                users.find({}).sort({wins: -1}).exec(function (err, top){
                    if (err) {
                        reject(err);
                    } else {
                        resolve(top);
                    }
                })
            } else if (stat === "lifetime"){
                users.find({}).sort({lifetimeEarnings: -1}).exec(function (err, top){
                    if (err) {
                        reject(err);
                    } else {
                        resolve(top);
                    }
                })
            } else if (stat === "level"){
                users.find({}).sort({level: -1, xp: -1}).exec(function (err, top){
                    if (err) {
                        reject(err);
                    } else {
                        resolve(top);
                    }
                })
            } else {
                reject("Invalid");
            }


        })
    }
};