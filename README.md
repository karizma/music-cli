# Music CLI

-   [About](#about)
-   [Requirements](#requirements)
-   [Usage](#usage)
    -   [Playing Music](#playing-music)
    -   [Tags](#tags)
    -   [Installing music](#installing-music)
    -   [Auto Completion](#auto-completion)

## About

This is a simple command line tool to help with music-related tasks.
The primary usage is the querying it provides which allows you to quickly
select the songs you want to play. This is **not** a music player. It does
not provide a TUI or GUI, and it uses VLC internally.

For playlists and grouping of songs, it has a tag system. The tags are stored
in `$MUSIC_PATH/tags.json`.

## Requirements

-   NodeJS
-   VLC
-   youtube-dl (if you plan on installing music)

## Usage

Each command takes in a music-path argument, which defaults to `$HOME/Music`.
I recommend a folder structure of:

```text
~/Music/
    Artist1/
        x.mp3
        y.m4a
    Category/
        z.mp3
```

But this is not a necessary, as any file in your music path will be considered.
Files should follow some basic file naming rules: no new lines, no crazy
characters, etc.

### Playing Music

You can play music with the `play` command which will take in
any amount of positional arguments, these are called terms.

A term can have a "!" prefix, meaning it's a negation term, and anything
that matches that term fails.

If no term is provided, the program will spawn VLC with the directory
and `--recursive=expand`.

Otherwise, a song will have to match at least one of the terms and none
of the negation terms.

A term can have required sections and one-of sections, specified with "#" and
"," respectively.

When querying, the string that's tested is the lowercase full path to the file
minus your music path.

For example, `~/Music/Jaxsoe/Make Time For Me.m4a` would use
`jaxson/make time for me.m4a`.

Example of usage:

```shell
music play tonight kiss#me care,bear,say make#you,me#mine \!loser
```

There are four terms here:

-   `tonight`
-   `kiss#me`
-   `care,bear,say`
-   `make#you,me#mine`
-   `\!loser`

A song will have to match one of those terms and not have the substring "loser".

To match the first term, a song simply needs to have the word "tonight" in the path.

To match the second term, a song needs to have the words "kiss" and "me" in its
path (not necessarily next to each other).

To match the third term, a song needs to have any of the following words: "care",
"bear" or "say" in its path.

To match the fourth term, a song needs to have "make", either "you" or "me", and
"mine" in its path.

To match the fifth term, a song simply needs to not have the word "loser" in its
path. Also note the backlash, it's there because `!` is a special character in bash.

When combining these, the string is split by `#` first, and then `,`.

### Tags

Tags are a way to group music. You can use it for playlists, genres or whatever.
Tags will be stored in `YOUR_MUSIC_PATH/tags.json`

You can view your tags with `music tags`. If you want to see the songs in a tag
use `music tags <tag>`.

If you want to delete a tag use `--delete` or `-d`. Edit a tag or the `tags.json`
with `--edit` or `-e`.

The intended way to add songs to a tag is to query the songs with `music play`
and then using `--add-to-tag | -a <tag>` or `--set-to-tag | -s <tag>`.

### Installing music

`music install "https://www.youtube.com/watch?v=K4DyBUG242c" ncs` => download
from youtube

The first positional argument is the link to download or a youtube video id. The
second is the child folder name of your music path to download to. The folder
name can be pretty loose in comparison to the real name. It's case-insensitive
and replaces spaces with dashes (-).

For example, if you had a folder named "Kite Hughes", you would use "kite-hughes".

Note: this program does not support piracy.

### Auto Completion

This tool uses [cobra](https://github.com/spf13/cobra) which provides a
completion command you can use to generate completions.

Before I used go & cobra I had my own implementation written in bash which can
be found in `./completion.bash`. It's more static (faster but not in-sync) &
less hand-holdy.

Choose whichever one you prefer.

Notes if you plan on using my bash script:

-   there is a MUSIC_PATH variable at the start you may have to change
-   I have `m` as an alias for `music` and `mx` as an alias for `music play`
-   You need `jq` if you want tag completions

### Configuration

There is no configuration file currently. I would suggest setting up an alias
with your desired options.
