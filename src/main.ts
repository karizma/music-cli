#!/usr/bin/env node

import { statSync, readdirSync } from 'fs';
import { exec as realExec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import yargs from 'yargs';
import chalk from 'chalk';
import os from 'os';

const songsPath = path.join(os.homedir(), 'Music');

function logErrors(reason: any) {
    console.error('Error: ' + (reason?.message || `\n\n${reason}`));
}

const isDryRun =
    process.argv.includes('--dry-run') || process.argv.includes('-d');

const promiseBasedExec = promisify(realExec);

const exec = isDryRun
    ? () => {
          // @ts-expect-error
          const promise: ReturnType<typeof promiseBasedExec> = Object.assign(
              new Promise((res) => res),
              {
                  child: {
                      stdout: () => {},
                      stderr: () => {},
                  },
              }
          );

          return promise;
      }
    : promiseBasedExec;

const timeoutTillExit = isDryRun ? 0 : 1200;

function doesSongPass(terms: string[], songPath: string): boolean {
    if (terms.length === 0) {
        return true;
    }

    let passedOneTerm = false;

    for (let term of terms) {
        const isExclusion = term.startsWith('!');

        if (isExclusion) {
            term = term.slice(1);
        }

        const requiredSections = term.split(/#\s*/);

        if (
            requiredSections.every((s) =>
                s.split(/,\s*/).some((w) => songPath.includes(w))
            )
        ) {
            if (isExclusion) {
                return false;
            }

            passedOneTerm = true;
        }
    }

    return passedOneTerm;
}

function getSongsByTerms(terms: string[]) {
    const chosenSongs: string[] = [];

    function walk(dir: string) {
        const files = readdirSync(dir);

        for (const file of files) {
            const nextPath = path.join(dir, file);

            if (file.includes('.')) {
                if (
                    doesSongPass(
                        terms,
                        nextPath.toLowerCase().replace(songsPath, '')
                    )
                ) {
                    chosenSongs.push(nextPath.replace(songsPath + '/', ''));
                }
            } else {
                walk(nextPath);
            }
        }
    }

    walk(songsPath);
    return chosenSongs;
}

function sortByNew(a: string, b: string) {
    const songAStats = statSync(path.join(songsPath, a));
    const songBStats = statSync(path.join(songsPath, b));

    return songBStats.mtimeMs - songAStats.mtimeMs;
}

// const line = '─'.repeat(60);

async function defaultCommandHandler(args: {
    terms?: string[];
    limit: number;
    new: boolean;
    'dry-run': boolean;
}) {
    if ((!args.terms || args.terms.length === 0) && !args.limit) {
        console.log('Playing all songs');
        exec(`vlc --recursive=expand "${songsPath}"`);
        return setTimeout(() => process.exit(0), timeoutTillExit);
    }

    let songs = getSongsByTerms(args.terms || []);

    if (songs.length === 0) {
        return console.error("Didn't match anything");
    }

    if (args.new) {
        songs.sort(sortByNew);
    }

    if (args.limit && songs.length > args.limit) {
        songs.length = args.limit;
    }

    const playingMessage = `Playing: [${songs.length}]`;
    console.log(
        `${playingMessage}\n` +
            songs.map((e) => chalk.redBright('- ' + e)).join('\n')
    );

    exec(
        `vlc ${songs
            .map((s) => `"${songsPath}/${s}" ${args.new ? '--no-random' : ''}`)
            .join(' ')}`
    ).catch(logErrors);
    setTimeout(() => process.exit(0), timeoutTillExit);
}
yargs(process.argv.slice(2))
    .command({
        command: '$0 [terms..]',
        builder: (y) =>
            y
                .option('dry-run', {
                    alias: 'd',
                    type: 'boolean',
                })
                .option('limit', {
                    alias: 'l',
                    type: 'number',
                })
                .option('new', {
                    alias: 'n',
                    type: 'boolean',
                })
                .positional('terms', {
                    type: 'string',
                    array: true,
                }),
        // @ts-ignore
        handler: defaultCommandHandler,
    })
    .command({
        command: ['install <id> <folder>', 'i', 'download', 'd'],
        describe: 'install music from youtube id or url',
        handler: ({ folder, id }: { folder: string; id: string }) => {
            const possibleFolders = readdirSync(songsPath);
            const adjustedFolder = folder.toLowerCase().replace(/\s+/g, '-');
            let selectedFolder = '';

            for (const possibleFolder of possibleFolders) {
                if (
                    possibleFolder.toLowerCase().replace(/\s+g/, '-') ===
                    adjustedFolder
                ) {
                    selectedFolder = possibleFolder;
                    break;
                }
            }

            if (!selectedFolder) {
                return console.error(`Invalid folder: ${folder}`);
            }

            const youtubeURL = id.startsWith('https://')
                ? id
                : `https://www.youtube.com/watch?v=${id}`;

            const child = exec(
                `youtube-dl -f m4a -o "${path.join(
                    songsPath,
                    selectedFolder,
                    '%(title)s.%(ext)s'
                )}" -- "${youtubeURL}"`
            ).child;

            if (child.stdout) {
                child.stdout.on('data', (data) => console.log('' + data));
            }

            if (child.stderr) {
                child.stderr.on('data', (data) => console.log('' + data));
            }
        },
    })
    .alias('h', 'help')
    .strict().argv;
