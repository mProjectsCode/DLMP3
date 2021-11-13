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

        let type = commandObj.args[0];
        let loop = commandObj.args[1] != null && commandObj.args[1] == '-l';
        console.log(loop);

        if (type == '-r') {
            this.randomAudio = true;
            this.playFile(loop);
        }

        if (type == '-s') {
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
            }
            this.playFile(loop, audio);
        });
    }
}

module.exports = AudioPlayer;