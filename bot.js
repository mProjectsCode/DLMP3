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
// const bot = new Discord.Client();
const config = require('./config.json');
const audioPlayer = require('./audioPlayer.js');
const commands = require('./commands.js');

let dispatcher;
let currentSong;
let voiceChannel;
let fileData;
let randomAudio;
let currentArgs;
let volumeOverride = -1;

// bot.login(config.token);

class LemonMusicBot {
    constructor() {
        this.bot;
        this.audioPlayer;
        this.commands;
        this.channelConnection;
        this.currentCommandObj;
        this.volumeOverride;
    }

    statup() {
        this.bot = new Discord.Client();
        this.audioPlayer = new audioPlayer(this);
        this.commands = new commands(this);

        this.volumeOverride = -1;

        this.bot.login(config.token);
        this.bot.on('ready', () => { this.onReady(); });
        this.bot.on('message', async msg => { this.onMessage(msg); });
    }

    onReady() {
        console.log('Bot is ready!');
        console.log(`Logged in as ${this.bot.user.tag}!`);
        console.log(`Prefix: ${config.prefix}`);
        console.log(`Owner ID: ${config.botOwner}`);
        console.log(`Voice Channel: ${config.voiceChannel}`);
        console.log(`Status Channel: ${config.statusChannel}\n`);

        this.bot.user.setPresence({
            activity: {
                name: `Music | ${config.prefix}help`
            },
            status: 'online',
        }).then(presence => console.log(`Activity set to "${presence.activities[0].name}"`)).catch(console.error);

        const readyEmbed = new Discord.MessageEmbed()
            .setAuthor(`${this.bot.user.username}`, this.bot.user.avatarURL())
            .setDescription('Starting bot...')
            .setColor('#0066ff');

        let statusChannel = this.bot.channels.cache.get(config.statusChannel);
        if (!statusChannel) {
            return console.error('The status channel does not exist! Skipping.');
        }
        statusChannel.send(readyEmbed);

        this.joinVoiceByUser({ 'id': config.botOwner });
    }

    async onMessage(msg) {
        this.commands.processCommand(msg);
    }

    async joinVoiceByUser(user) {
        this.bot.guilds.cache.forEach(guild => {
            // console.log(guild.name);
            guild.channels.cache.forEach(channel => {
                //console.log(channel.name);
                if (channel.type == 'voice') {
                    // console.log(channel.name);
                    channel.members.forEach(member => {
                        if (member.id == user.id) {
                            // console.log(channel);
                            channel.join().then(connection => {
                                this.channelConnection = connection;
                                return;
                            }).catch(e => {
                                console.error(e);
                            });;
                        }
                    });
                }
            });
        });
    }
}

const lemonMusicBot = new LemonMusicBot();
lemonMusicBot.statup();