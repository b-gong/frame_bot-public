const { Client, Intents, MessageEmbed } = require('discord.js');
const { prefix, token, karuta } = require('./config.json');
const fs = require('fs');

// global variables
const frameFile = './frames.json';
const bitsFile = './bits.txt';

var frameData;

const nodeEmbedFilter = message => {
	try{
		return message.author.id === karuta && message.embeds[0].title == 'Bits';
	}
	catch(err) {
		return false;
	}
};

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

client.once('ready', () => {
    init();
	console.log(`Logged in as ${client.user.tag}!`);
	/* do this in browser
	client.user.setUsername('Bit Inspector');
	client.user.setAvatar('./avatar2.png')
		.then(user => console.log('Avatar set!'))
		.catch(console.error);
	*/
	client.user.setPresence({ activities: [{ name: '[insert something clever]' }], status: 'online' });

});

client.on('messageCreate', async message => {
	if (message.content.startsWith(prefix) && !message.author.bot) {
        const args = message.content.slice(prefix.length).trim().split(' ');
    	const command = args.shift().toLowerCase();

    	if (command === 'frames' || command === 'ligma' || command === 'frame') {
			let temp = execute(args);

			let output = `for ${message.author}\n\n` + temp[0];
			for(let i = 1; i < temp.length; i++) {
				output += ", " + temp[i];
			}

			// error messages
			if(args.length == 0) output = "Input Error: No arguments";
			else if(temp[0] == undefined) output = "Input Error: Invalid arguments\nNote: Format like 'f!frames bone leaf etc'";

			const outputEmbed = new MessageEmbed()
				.setColor('#89CFF0')
				.setTitle('Craftable Frames')
				.setDescription(output)
				.setFooter('This command finds frames you can craft with the given bits.');

			if(output != "") await message.reply({ embeds: [outputEmbed] });

    	} else if (command === 'invite') {
			message.channel.send('https://discord.com/api/oauth2/authorize?client_id=888719141849165914&permissions=68672&scope=bot');

		} else if (command === 'bits' || command === 'bit') {
			let temp = bit2frame(args[0]);

			let output = `for ${message.author}\n\n` + temp[0];
			for(let i = 1; i < temp.length; i++) {
				output += ", " + temp[i];
			}

			if(args.length == 0) output = "Input Error: No arguments";
			else if(temp[0] == undefined) output = "Input Error: Invalid argument\nNote: Format like 'f!bit bone'";

			const outputEmbed = new MessageEmbed()
				.setColor('#89CFF0')
				.setTitle('Frames that use ' + args[0])
				.setDescription(output)
				.setFooter('This command finds the frames use a certain bit.');
			if(output != "") await message.reply({ embeds: [outputEmbed] });

		}
    }

	if (message.content.toLowerCase().startsWith('kbi') || message.content.toLowerCase().startsWith('kbits') ) {
		let m;
		try {
			let collected = await message.channel.awaitMessages({ filter: nodeEmbedFilter, max: 1, time: 10000, errors: ['time'] });
			m = collected.first();

			const frameFilter = (reaction, user) => {
				return reaction.emoji.name === '🖼️' && user.id === message.author.id;
			};

			const checkFilter = (reaction, user) => {
				return reaction.emoji.name === '✅' && user.id === message.author.id;
			};

			const phoneFilter = (reaction, user) => {
				return reaction.emoji.name === '📱' && user.id === message.author.id;
			};

			await m.react('🖼️');
			await m.awaitReactions({ filter: frameFilter, max: 1, time: 15000 , errors: ['time'] });
			let userBits = clean(m.embeds[0].description);

			const intermediateEmbed = new MessageEmbed()
				.setColor('#FFC0CB')
				.setTitle('Craftable Frames')
				.setDescription('Go to next page of bit inventory (if you have one) and then click the checkmark!\nTimes out in 15 seconds.');

			let r = await message.reply({ embeds: [intermediateEmbed] });

			await m.react('✅');
			await m.awaitReactions({ filter: checkFilter, max: 1, time: 15000, errors: ['time'] });

			userBits = userBits.concat(clean(m.embeds[0].description));

			let availableBits = [];
			for(let i = 0; i < userBits.length; i++) {
				if(Number(userBits[i][0]) >= 2500 && availableBits.indexOf(userBits[i][1]) == -1)
					availableBits.push(userBits[i][1]);
			}
			let availableFrames = execute(availableBits);

			// create output embed
			let output = `for ${message.author}\n\n` + availableFrames[0];
			for(let i = 1; i < availableFrames.length; i++) {
				output += ', ' + availableFrames[i];
			}
			const outputEmbed = new MessageEmbed()
				.setColor('#3EB489')
				.setTitle('Craftable Frames')
				.setDescription(output);

			await r.edit({ embeds: [outputEmbed] });

			await r.react('📱');
			await r.awaitReactions({ filter: phoneFilter, max: 1, time: 15000, errors: ['time'] });

			await message.reply(output);

		} catch (err) {
			console.error("kbi error: ", err);
			m.reactions.removeAll().catch(error => console.error('Failed to clear reactions:', error));
		}

	}
});

client.login(token);

// fill out adjacency list
function init() {
    // read frame json
    try {
        frameData = JSON.parse(fs.readFileSync(frameFile, 'utf8'));
    } catch (err) {
        console.error(err);
    }
}

// find possible frames
function execute(userBits) {
	let possibleFrames = [];
    for(let frame in frameData) {
		// if both bits for frame exist in the user's bit list
		if(userBits.indexOf(frameData[frame][0]) != -1 && userBits.indexOf(frameData[frame][1]) != -1) {
			let temp = frame.split(' ');
			for(let word in temp) {
				temp[word] = temp[word].charAt(0).toUpperCase() + temp[word].slice(1);
			}
			possibleFrames.push(temp.join(' '));
		}
	}
    return possibleFrames;
}

// clean bit inventory text
function clean(raw) {
	arr = raw.split('\n');
    arr.shift();
    arr.shift();
    let temp = [];
	for(let i = 0; i < arr.length; i++) {
        temp.push(arr[i].replace(/([^A-Za-z0-9\s])/g, '').trim().split('  '));
        temp[i].pop();
        temp[i][1] = temp[i][1].slice(0, temp[i][1].indexOf(' bit'));
    }
	return temp;
}

// find frames 1 bit can make
function bit2frame(userBit) {
	let possibleFrames = [];
    for(let frame in frameData) {
		if(userBit == frameData[frame][0] || userBit == frameData[frame][1]) {
			let temp = frame.split(' ');
			for(let word in temp) {
				temp[word] = temp[word].charAt(0).toUpperCase() + temp[word].slice(1);
			}
			possibleFrames.push(temp.join(' '));
		}
	}
    return possibleFrames;
}
