// discord.js library
const Discord = require("discord.js");
const Gamble = require("./gamble");

const client = new Discord.Client();

const config = require("./config.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.
// config.status contains bot's status message

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
        message.channel.send("$"+userBal);
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
            message.channel.send("Collected $"+ gained + ", new balance is $" + userBal);
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

            message.channel.send("Gave $" + amt + " to <@" + userId + ">");
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
                message.channel.send("Took $" + amt + " from <@" + userId + ">");
            }
        }
    } else {
        // Command not found, return error message
        var errMsg = {embed: {color: 3447003, description: "Command not found, use !help to see commands"}};
        message.channel.send(errMsg);
    }
});

client.login(config.token);