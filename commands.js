const Discord = require('discord.js');
const fs = require('fs');
const config = require('./config.json');

class Commands {
    constructor(bot) {
        this.bot = bot;
    }

    async processCommand(msg) {
        let commandObj = await this.extractInformation(msg);

        if (commandObj == null) return;

        // Public allowed commands

        //TODO: Fix
        if (commandObj.command == 'help') {
            if (!msg.guild.member(bot.user).hasPermission('EMBED_LINKS')) return msg.reply('**ERROR: This bot doesn\'t have the permission to send embed links please enable them to use the full help.**');
            const helpEmbed = new Discord.MessageEmbed()
                .setAuthor(`${bot.user.username} Help`, bot.user.avatarURL())
                .setDescription(`Currently playing \`${this.bot.audioPlayer.currentSong}\`.`)
                .addField('Public Commands', `${config.prefix}help\n${config.prefix}ping\n${config.prefix}git\n${config.prefix}playing\n${config.prefix}about\n`, true)
                .addField('Bot Owner Only', `${config.prefix}join\n${config.prefix}resume\n${config.prefix}pause\n${config.prefix}skip\n${config.prefix}leave\n${config.prefix}stop\n`, true)
                .setFooter('© Copyright 2020 Andrew Lee. Licensed with GPL-3.0.')
                .setColor('#0066ff');

            msg.channel.send(helpEmbed);
        }

        if (commandObj.command == 'ping') {
            msg.reply('Pong!');
        }

        //TODO: Change
        if (commandObj.command == 'git') {
            msg.reply('This is the source code of this project.\nhttps://github.com/Alee14/DLMP3');
        }

        if (commandObj.command == 'playing') {
            msg.channel.send('Currently playing `' + this.bot.audioPlayer.currentSong + '`.');
        }

        //TODO: Change
        if (commandObj.command == 'about') {
            msg.channel.send('The bot code was created by Andrew Lee (Alee#4277). Written in Discord.JS and licensed with GPL-3.0.');
        }

        if (![config.botOwner].includes(msg.author.id)) return;

        // Bot owner exclusive

        if (commandObj.command == 'p' || commandObj.command == 'play') {
            if (this.bot.channelConnection == null) {
                msg.reply('Joining voice channel.');
                console.log('Connected to the voice channel.');
                await this.bot.joinVoiceByUser(msg.author);
            }
            this.bot.currentCommandObj = commandObj;
            this.bot.audioPlayer.playAudio(commandObj);
        }

        if (commandObj.command == 'resume') {
            msg.reply('Resuming music.');
            this.bot.audioPlayer.dispatcher.resume();
        }

        if (commandObj.command == 'pause') {
            msg.reply('Pausing music.');
            dispatcher.pause();
        }

        if (commandObj.command == 'skip') {
            msg.reply('Skipping `' + this.bot.audioPlayer.currentSong + '`...');
            this.bot.audioPlayer.dispatcher.pause();
            this.bot.audioPlayer.dispatcher = null;
            this.bot.audioPlayer.playAudio(this.bot.currentCommandObj);
        }

        if (commandObj.command == 'leave') {
            if (this.bot.channelConnection != null) {
                let voiceChannel = this.bot.channelConnection.channel;
                if (!voiceChannel) return console.error('The voice channel does not exist!\n(Have you looked at your configuration?)');
                msg.reply('Leaving voice channel.');
                console.log('Leaving voice channel.');
                let fileData = "Now Playing: Nothing";
                fs.writeFile("now-playing.txt", fileData, (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
                this.bot.audioPlayer.currentSong = "Not Playing";
                if (this.bot.audioPlayer.dispatcher != null) {
                    this.bot.audioPlayer.dispatcher.destroy();
                }
                this.bot.channelConnection = null;
                voiceChannel.leave();
            }
        }

        if (commandObj.command == 'stop') {
            await msg.reply('Powering off...');
            let fileData = "Now Playing: Nothing";
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
            this.bot.audioPlayer.dispatcher.destroy();
            this.bot.bot.destroy();
            process.exit(0);
        }

        if (commandObj.command == 'volume' || commandObj.command == 'v') {
            let volume = commandObj.other[0];

            if (volume == null) {
                msg.reply('Please specify a volume.');
            }

            volume = parseInt(volume);
            if (volume >= 0 && volume <= 100) {
                this.bot.volumeOverride = volume;
                this.bot.audioPlayer.dispatcher.setVolume(volume / 200);
                msg.reply('Changed volume to ' + volume.toString() + '.');
                console.log('Changed volume to ' + volume.toString() + '.');
            } else {
                msg.reply('Volume not in range.');
            }
        }
    }

    async extractInformation(msg) {
        if (msg.author.bot) return;
        if (!msg.guild) return;
        if (!msg.content.startsWith(config.prefix)) return;

        let parts = msg.content.split(' ');

        let command = parts[0].slice(config.prefix.length);

        let ar = msg.content.split(' ').splice(1);

        let args = ar.filter(a => a.startsWith('-'));

        let other = ar.filter(a => !a.startsWith('-'));

        console.log('');
        console.log('Parsed Command from ' + msg.author.username + ': ' + command + ', ' + args.toString() + ', ' + other.toString() + ' ');

        return {
            'command': command,
            'args': args,
            'other': other
        };
    }
}

module.exports = Commands;