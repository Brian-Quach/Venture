// discord.js library
const Discord = require("discord.js");
const Gamble = require("./gamble");

const client = new Discord.Client();

const config = require("./config.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.
// config.status contains bot's status message

function dollarValue(amt){
    return (Math.floor(amt*100) / 100).toString();
}

client.on("ready", () => {
    // Log something when bot starts
    console.log(`rdy2go!!!`);

    client.user.setActivity(`wekwek`);
});

client.on("message", async message => {

    let userId = "";

    // Ignore bot messages
    if(message.author.bot) return;

    // Checks for prefix
    if(message.content.indexOf(config.prefix) !== 0) {
        return;
    } else {
        userId = message.author.id;
    }

    // Separate commands and args
    // args -> ["List", "of", "args"]
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (["help", "h"].indexOf(command) > -1){
        message.channel.send({embed: {
                color: 3447003,
                title: "Commands",
                fields: [
                    {
                        name: "bal",
                        value: "Display user balance."
                    },
                    {
                        name: "income",
                        value: "Use to redeem your income!"
                    },
                    {
                        name: "transfer",
                        value: "Give money to someone"
                    },
                    {
                        name: "flip",
                        value: "Flip a 2-sided coin!"
                    },
                    {
                        name: "help, h",
                        value: "Display all commands"
                    }
                ]
            }
        });
    } else if (command === "wek") {
        // Test if bot is connected, reply w/ "wekwek"
        message.channel.send('wekwek :penguin:');
    } else if (command === "bal") {
        if (message.mentions.members.array().length === 1){
            userId = message.mentions.members.first().id;
        }
        let userBal;
        if (!(await Gamble.userExists(userId))){
            userBal = await Gamble.createUser(userId);
        } else {
            userBal = await Gamble.getBal(userId);
        }
        message.channel.send("$" + dollarValue(userBal));
    } else if (command === "income"){
        let userBal;
        if (!(await Gamble.userExists(userId))){
            userBal = await Gamble.createUser(userId);
        } else {
            userBal = await Gamble.getBal(userId);
        }
        let gained = await Gamble.collectIncome(userId);

        if (gained === -1){
            message.channel.send("Can only collect income once every 5 minutes, try again later");
        } else {
            userBal += gained;
            message.channel.send("Collected $"+ dollarValue(gained) + ", new balance is $" + dollarValue(userBal));
        }
    } else if (command === "transfer"){
        let amt = parseFloat(args.shift());
        let user = message.mentions.members.first();

        if (isNaN(amt) || (message.mentions.members.array().length !== 1)) {
            message.channel.send("FormatErr - Use !transfer [amt] [user]");
            return;
        }

        let otherId = user.id;
        if (!(await Gamble.userExists(otherId))){
            await Gamble.createUser(otherId);
        }

        if ((await Gamble.getBal(userId)) > amt){
            await Gamble.takeBal(userId, amt);
            await Gamble.addBal(otherId, amt);
            message.channel.send("Gave $" + dollarValue(amt) + " to <@" + otherId + ">");
        } else {
            message.channel.send("You do not have $" + dollarValue(amt) + " :angry:");
        }
    } else if (command === "flip"){
        let bet = args.shift().toLowerCase();
        let amt = parseFloat(args.shift());

        if (isNaN(amt) || !(['h','t','heads','tails'].indexOf(bet) > -1)) {
            message.channel.send("FormatErr - Use !flip [heads/tails] [amt]");
            return;
        }

        bet =  bet.charAt(0);
        let result = await Gamble.flipCoin(userId, amt, bet);

        if (result.win) {
            message.channel.send("Congrats! you bet " + result.bet + " and won $" + dollarValue(result.amt) + "! New bal: $" + dollarValue(result.newBal));
        } else {
            message.channel.send("Sorryy! you bet " + result.bet + " and lost $" + dollarValue(result.amt) + "! New bal: $" + dollarValue(result.newBal));
        }

    } else if (command === "give"){
        if (await Gamble.isAdmin(userId)) {
            let amt = parseFloat(args.shift());
            let user = message.mentions.members.first();

            if (isNaN(amt) || (message.mentions.members.array().length !== 1)) {
                message.channel.send("FormatErr - Use !give [amt] [user]");
                return;
            }

            userId = user.id;
            if (!(await Gamble.userExists(userId))){
                await Gamble.createUser(userId);
            }

            await Gamble.addBal(userId, amt);

            message.channel.send("Gave $" + dollarValue(amt) + " to <@" + userId + ">");
        }
    } else if (command === "take"){
        if (await Gamble.isAdmin(userId)) {
            let userBal;
            let amt = parseFloat(args.shift());
            let user = message.mentions.members.first();

            if (isNaN(amt) || (message.mentions.members.array().length !== 1)) {
                message.channel.send("FormatErr - Use !take [amt] [user]");
                return;
            }

            userId = user.id;
            if (!(await Gamble.userExists(userId))){
                userBal = await Gamble.createUser(userId);
            } else {
                userBal = await Gamble.getBal(userId);
            }

            if (userBal < amt){
                message.channel.send("<@" + userId + "> does not have $" + amt + "!");
            } else {
                await Gamble.takeBal(userId, amt);
                message.channel.send("Took $" + dollarValue(amt) + " from <@" + userId + ">");
            }
        }
    } else {
        // Command not found, return error message
        var errMsg = {embed: {color: 3447003, description: "Command not found, use !help to see commands"}};
        message.channel.send(errMsg);
    }
});

client.login(config.token);