/**************************************************************************
* 
*  DLMP3 Bot: A Discord bot that plays local mp3 audio tracks.
*  (C) Copyright 2020
*  Programmed by Andrew Lee 
*  
*  This program is free software: you can redistribute it and/or modify
*  it under the terms of the GNU General Public License as published by
*  the Free Software Foundation, either version 3 of the License, or
*  (at your option) any later version.
*
*  This program is distributed in the hope that it will be useful,
*  but WITHOUT ANY WARRANTY; without even the implied warranty of
*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*  GNU General Public License for more details.
*
*  You should have received a copy of the GNU General Public License
*  along with this program.  If not, see <https://www.gnu.org/licenses/>.
* 
***************************************************************************/
const Discord = require('discord.js');
const fs = require('fs');
const { off } = require('process');
const bot = new Discord.Client();
const config = require('./config.json');
let dispatcher;
let currentSong;
let voiceChannel;
let fileData;
let randomAudio;
let currentArgs;

bot.login(config.token);

function getRandomSong() {
    let files = fs.readdirSync('./music');
    let aud = null;

    let i = 0;
    while (i < 100) {
        i++;
        aud = files[Math.floor(Math.random() * files.length)];
        console.log('Searching .mp3 file...');
        if (aud.endsWith('.mp3')) {
            break;
        }
    }

    if (aud == null) {
        console.log('WARNING: No Song found!');
    }
    return aud;
}

function playAudio(msg, command, args) {
    voiceChannel = bot.channels.cache.get(config.voiceChannel);
    if (!voiceChannel) return console.error('The voice channel does not exist!\n(Have you looked at your configuration?)');

    if (args.length < 1) {
        msg.reply('Not enough Arguments. Wait thats illegal.');
        return;
    }

    voiceChannel.join().then(connection => {
        let type = args[0];
        let loop = args[1] != null && args[1] == 'l';
        console.log(loop);

        if (type == 'r') {
            randomAudio = true;
            playFile(connection, loop);
        }

        if (type == 's') {
            let files = fs.readdirSync('./music');

            let title = args[2];
            let i = 0;
            while (i < args.length) {
                if (i > 2) {
                    title += ' ' + args[i];
                }
                i++;
            }

            console.log(title);

            if (title == null) {
                title = '';
            }

            files = files.filter(f => f.toLowerCase().includes(title.toLowerCase()) && f.endsWith('.mp3'));
            if (files.length == 0) {
                msg.reply('No File found!');
                return;
            }

            randomAudio = false;
            console.log(files);
            playFile(connection, loop, files[0]);
        }
    }).catch(e => {
        console.error(e);
    });
}

function playFile(connection, loop, audio = null) {
    if (randomAudio == true) {
        audio = getRandomSong();
    }
    currentSong = audio;

    dispatcher = connection.play('./music/' + audio);

    dispatcher.on('start', () => {
        dispatcher.setVolume(config.defaultVolume / 100);
        console.log('Now playing ' + audio);
        fileData = "Now Playing: " + audio;
        fs.writeFile("now-playing.txt", fileData, (err) => {
            if (err)
                console.log(err);
        });
        const statusEmbed = new Discord.MessageEmbed()
            .addField('Now Playing', `${audio}`)
            .setColor('#0066ff');

        let statusChannel = bot.channels.cache.get(config.statusChannel);
        if (!statusChannel) return console.error('The status channel does not exist! Skipping.');
        statusChannel.send(statusEmbed);
    });

    dispatcher.on('error', console.error);

    dispatcher.on('finish', () => {
        console.log('Music has finished playing.');
        if (loop) {
            console.log('Looping.');
        }
        playAudio(connection, loop, audio);
    });
}

bot.on('ready', () => {
    console.log('Bot is ready!');
    console.log(`Logged in as ${bot.user.tag}!`);
    console.log(`Prefix: ${config.prefix}`);
    console.log(`Owner ID: ${config.botOwner}`);
    console.log(`Voice Channel: ${config.voiceChannel}`);
    console.log(`Status Channel: ${config.statusChannel}\n`);

    bot.user.setPresence({
        activity: {
            name: `Music | ${config.prefix}help`
        },
        status: 'online',
    }).then(presence => console.log(`Activity set to "${presence.activities[0].name}"`)).catch(console.error);

    const readyEmbed = new Discord.MessageEmbed()
        .setAuthor(`${bot.user.username}`, bot.user.avatarURL())
        .setDescription('Starting bot...')
        .setColor('#0066ff');

    let statusChannel = bot.channels.cache.get(config.statusChannel);
    if (!statusChannel) return console.error('The status channel does not exist! Skipping.');
    statusChannel.send(readyEmbed);
});

bot.on('message', async msg => {
    if (msg.author.bot) return;
    if (!msg.guild) return;
    if (!msg.content.startsWith(config.prefix)) return;
    let command = msg.content.split(' ')[0];
    command = command.slice(config.prefix.length);
    let args = msg.content.split(' ').splice(1);
    console.log(args);
    console.log(command);

    // Public allowed commands

    if (command == 'help') {
        if (!msg.guild.member(bot.user).hasPermission('EMBED_LINKS')) return msg.reply('**ERROR: This bot doesn\'t have the permission to send embed links please enable them to use the full help.**');
        const helpEmbed = new Discord.MessageEmbed()
            .setAuthor(`${bot.user.username} Help`, bot.user.avatarURL())
            .setDescription(`Currently playing \`${currentSong}\`.`)
            .addField('Public Commands', `${config.prefix}help\n${config.prefix}ping\n${config.prefix}git\n${config.prefix}playing\n${config.prefix}about\n`, true)
            .addField('Bot Owner Only', `${config.prefix}join\n${config.prefix}resume\n${config.prefix}pause\n${config.prefix}skip\n${config.prefix}leave\n${config.prefix}stop\n`, true)
            .setFooter('© Copyright 2020 Andrew Lee. Licensed with GPL-3.0.')
            .setColor('#0066ff');

        msg.channel.send(helpEmbed);
    }

    if (command == 'ping') {
        msg.reply('Pong!');
    }

    if (command == 'git') {
        msg.reply('This is the source code of this project.\nhttps://github.com/Alee14/DLMP3');
    }

    if (command == 'playing') {
        msg.channel.send('Currently playing `' + currentSong + '`.');
    }

    if (command == 'about') {
        msg.channel.send('The bot code was created by Andrew Lee (Alee#4277). Written in Discord.JS and licensed with GPL-3.0.');
    }

    if (![config.botOwner].includes(msg.author.id)) return;

    // Bot owner exclusive

    if (command == 'p') {
        msg.reply('Joining voice channel.');
        console.log('Connected to the voice channel.');
        currentArgs = args;
        playAudio(msg, command, args);
    }

    if (command == 'resume') {
        msg.reply('Resuming music.');
        dispatcher.resume();
    }

    if (command == 'pause') {
        msg.reply('Pausing music.');
        dispatcher.pause();
    }

    if (command == 'skip') {
        msg.reply('Skipping `' + currentSong + '`...');
        dispatcher.pause();
        dispatcher = null;
        playAudio(msg, command, currentArgs);
    }

    if (command == 'leave') {
        voiceChannel = bot.channels.cache.get(config.voiceChannel);
        if (!voiceChannel) return console.error('The voice channel does not exist!\n(Have you looked at your configuration?)');
        msg.reply('Leaving voice channel.');
        console.log('Leaving voice channel.');
        fileData = "Now Playing: Nothing";
        fs.writeFile("now-playing.txt", fileData, (err) => {
            if (err)
                console.log(err);
        });
        currentSong = "Not Playing";
        dispatcher.destroy();
        voiceChannel.leave();
    }

    if (command == 'stop') {
        await msg.reply('Powering off...');
        fileData = "Now Playing: Nothing";
        await fs.writeFile("now-playing.txt", fileData, (err) => {
            if (err)
                console.log(err);
        });
        const statusEmbed = new Discord.MessageEmbed()
            .setAuthor(`${bot.user.username}`, bot.user.avatarURL())
            .setDescription(`That\'s all folks! Powering down ${bot.user.username}...`)
            .setColor('#0066ff');
        let statusChannel = bot.channels.cache.get(config.statusChannel);
        if (!statusChannel) return console.error('The status channel does not exist! Skipping.');
        await statusChannel.send(statusEmbed);
        console.log('Powering off...');
        dispatcher.destroy();
        bot.destroy();
        process.exit(0);
    }

    if (command == 'volume') {
        let volume = args[0];

        if (volume == null) {
            msg.reply('Please specify a volume.');
        }

        volume = parseInt(volume);
        if (volume >= 0 && volume <= 100) {
            dispatcher.setVolume(volume / 100);
            msg.reply('Changed volume to ' + volume.toString() + '.');
            console.log('Changed volume to ' + volume.toString() + '.');
        } else {
            msg.reply('Volume not in range.');
        }
    }

});
