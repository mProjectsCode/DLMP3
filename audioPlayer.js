/**************************************************************************
* 
*  DLMP3 Bot: A Discord bot that plays local mp3 audio tracks.
*  (C) Copyright 2020
*  Programmed by Andrew Lee 
*
*  (C) Copyright 2021
*  Programmed by Moritz Jung
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
const config = require('./config.json');

class AudioPlayer {
    constructor(bot) {
        this.bot = bot;
        this.dispatcher = null;
        this.randomAudio;
        this.currentSong;
    }


    getRandomSong() {
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

    playAudio(commandObj) {
        if (!this.bot.channelConnection) return console.error('Not in a Voice Channel!');

        // if (commandObj.) {
        //     msg.reply('Not enough Arguments. Wait thats illegal.');
        //     return;
        // }

        let loop = commandObj.args.includes('-l');
        // console.log(loop);

        if (commandObj.args.includes('-r')) {
            this.randomAudio = true;
            this.playFile(loop);
        } else if (commandObj.args.includes('-s')) {
            let files = fs.readdirSync('./music');

            let title = commandObj.other[0];
            let i = 0;
            while (i < commandObj.other.length) {
                if (i > 1) {
                    title += ' ' + commandObj.other[i];
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

            this.randomAudio = false;
            console.log(files);
            this.playFile(loop, files[0]);
        }
    }

    playFile(loop, audio = null) {
        if (this.randomAudio == true) {
            audio = this.getRandomSong();
        }
        this.currentSong = audio;

        this.dispatcher = this.bot.channelConnection.play('./music/' + audio);

        if (this.bot.volumeOverride == -1) {
            this.dispatcher.setVolume(config.defaultVolume / 200);
        } else {
            this.dispatcher.setVolume(this.bot.volumeOverride / 200);
        }

        this.dispatcher.on('start', () => {
            console.log('Now playing ' + audio);
            let fileData = "Now Playing: " + audio;
            fs.writeFile("now-playing.txt", fileData, (err) => {
                if (err)
                    console.log(err);
            });
            const statusEmbed = new Discord.MessageEmbed()
                .addField('Now Playing', `${audio}`)
                .setColor('#0066ff');

            let statusChannel = this.bot.bot.channels.cache.get(config.statusChannel);
            if (!statusChannel) return console.error('The status channel does not exist! Skipping.');
            statusChannel.send(statusEmbed);
        });

        this.dispatcher.on('error', console.error);

        this.dispatcher.on('finish', () => {
            console.log('Music has finished playing.');
            if (loop) {
                console.log('Looping.');
                this.playFile(loop, audio);
            }
        });
    }
}

module.exports = AudioPlayer;