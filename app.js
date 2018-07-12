// Load up the discord.js library
const Discord = require("discord.js");

// This is your client. Some people call it `bot`, some people call it `self`,
// some might call it `cootchie`. Either way, when you see `client.something`, or `bot.something`,
// this is what we're refering to. Your client.
const client = new Discord.Client();


const config = require("./config.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.

client.on("ready", () => {
    // This event will run if the bot starts, and logs in, successfully.
    console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);

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
    } else if (["glomp"].indexOf(command) >-1) {
        message.channel.send("glomp",{
            reply: message.guild.members.random()
        });
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