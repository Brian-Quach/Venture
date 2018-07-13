// discord.js library
const Discord = require("discord.js");
const Gamble = require("./gamble");

// Using NeDB b/c lazy
var Datastore = require('nedb');

// Client, database, etc.
const client = new Discord.Client();
var users = new Datastore({ filename: 'db/users.db', autoload: true });
var prevcmd = new Datastore();


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

    // Ignore bot messages
    if(message.author.bot) return;

    // Checks for prefix
    if(message.content.indexOf(config.prefix) !== 0) return;

    // Separate commands and args
    // args -> ["List", "of", "args"]
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (["help", "h"].indexOf(command) > -1){
        var helpMsg =
            "```css\n" +
            "Commands:\n" +
            "   wek: wekwek\n" +
            "   help, h: Display all commands" +
            "```";
        message.channel.send(helpMsg);
    } else if (command === 'wek') {
        // Test if bot is connected, reply w/ "wekwek"
        message.channel.send('wekwek :penguin:');
    } else {
        // Command not found, return error message
        var errMsg =
            "```css\n" +
            "Command not found, use !help to see commands" +
            "```";
        message.channel.send(errMsg);
    }
});

client.login(config.token);