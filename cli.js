#!/usr/bin/env node

const fs = require('fs');

const yargs = require('yargs');

let configObject = {};

const argv = yargs
    .command('* <sourceFile> <outputFile>', false, commandYargs => {
        commandYargs
            .positional('sourceFile', {
                describe: 'Source media to be thumbnailed'
            })
            .positional('outputFile', {
                describe: 'Thumbnail page filename (or template)'
            })
            .check((argv, _options) => {
                if (!fs.existsSync(argv.sourceFile)) {
                    throw new Error('Parameter Error: source media file must exist');
                }
                return true;
            })
    })
    .demandCommand()
    .option('c', {
        alias: ['config', 'cfg'],
        describe: 'JSON file of configuration options (not validated)',
        nargs: 1,
        group: 'Config:'
    })
    .option('s', {
        alias: ['system'],
        describe: 'Use system version of ffmpeg (otherwise it is installed)',
        boolean: true,
        default: true,
        group: 'Config:'
    })
    .check((argv, _options) => {
        if (argv.config) {
            if (!fs.existsSync(argv.config)) {
                throw new Error('Parameter Error: config file must exist, if specified');
            }
            try {
                configObject = JSON.parse(fs.readFileSync(argv.config));
            } catch (err) {
                throw new Error('Parameter Error: cannot load and parse JSON config file');
            }
        }
        return true;
    })
    .strict()
    .help()
    .argv;

let ThumbnailGenerator;
if (!argv.system) {
    try {
        const ffmpeg = require('@ffmpeg-installer/ffmpeg');
        const ffprobe = require('@ffprobe-installer/ffprobe');
        const FfmpegCommand = require('fluent-ffmpeg');
        FfmpegCommand.setFfmpegPath(ffmpeg.path);
        FfmpegCommand.setFfprobePath(ffprobe.path);
        ThumbnailGenerator = require('./src/ThumbnailGenerator')(FfmpegCommand);
    } catch (err) {
        console.error('To use without a "system" version of ffmpeg & ffprobe, you must have @ffmpeg-installer/ffmpeg and @ffprobe-installer/ffprobe installed');
        process.exit(1);
    }
} else {
    ThumbnailGenerator = require('./src/ThumbnailGenerator')();
}

(async () => {
    const tg = new ThumbnailGenerator(argv.sourceFile);
    const outputList = await tg.generate(argv.outputFile, configObject);

    console.log(`Produced thumbnail file(s): ${outputList}`);
})()
    .catch(err => console.error(err));
