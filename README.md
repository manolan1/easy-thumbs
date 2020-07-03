# easy-thumbs

A simple thumbnail generator for MPEG2 Transport Stream files (m2ts), should also work for other file types supported by ffmpeg.


## Installing

Install in the normal way (`npm install`, `yarn install`). There are peer dependencies on `@ffmpeg-installer/ffmpeg` and `ffprobe-installer/ffprobe`, which are only needed if you plan to use the CLI without an installed version of ffmpeg. (I know that's not what peer dependencies are really for, but it seemed like the easiest way to model it!)


## Command Line Interface

There is a command line interface installed. To run it, execute `./node_modules/.bin/easy-thumbs` by whatever mechanism you normally execute node binaries (directly, from your path, or using `npx`).

Usage is:
```
easy-thumbs -options <sourceFile> <thumbFile>
```

Where:
- `sourceFile` is the media file to be thumbnailed (mandatory)
- `thumbFile` is the output file for the thumbnails, or a template (as described below for `outputFilename`) (mandatory)
- `options` are:
    - `-c`, `--config`, `-cfg` followed by the name of a JSON file with full options, as shown below (note that you cannot set the options on the command line)
    - `-s`, `--system` means use the system version of ffmpeg (a version on the path or indicated by environment variables). This is the default, so you are more likely to use `--no-system` if you do not have a version of ffmpeg installed like that.
    - `-v`, `--version` show version
    - `-h`, `--help` show usage

Without an options file, the library will use all defaults, which, for 16x9 content, means a single output file 1280x1080 containing 7 rows of 8 thumbnails each 240px wide.

If you plan to use `--no-system`, you must have the peer dependencies of `@ffmpeg-installer/ffmpeg` and `ffprobe-installer/ffprobe` installed and `require`able.


## Require

Note that the require statement is slightly different from that used normally (and cannot be an import):

```js
const ThumbnailGenerator = require('easy-thumbs')();
```

The (optional) parameter specifies a pre-configured instance of `fluent-ffmpeg`, which allows you to override the location of ffmpeg and ffprobe:

```js
const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const ffprobe = require('@ffprobe-installer/ffprobe');
const FfmpegCommand = require('fluent-ffmpeg');
FfmpegCommand.setFfmpegPath(ffmpeg.path);
FfmpegCommand.setFfprobePath(ffprobe.path);
const ThumbnailGenerator = require('easy-thumbs')(FfmpegCommand);
```

If not supplied, it assumes ffmpeg & ffprobe can be found using the normal mechanisms provided in `fluent-ffmpeg`. Any instances created from this import will look for ffmpeg in the same way.


## Programmatic Usage

```js
const tg = new ThumbnailGenerator('input.m2ts');
await tg.generate('thumbfile.png', {});
```

This will generate a single page of thumbnails (7 rows x 8 columns), each 240px wide in an output image 1920x1080 (assuming the source is 16:9).

Or, more generally,
```js
const tg = new ThumbnailGenerator(inputFileName);
const outputList = await tg.generate(outputFileName, options);
```

Where:
- `inputFileName` is of any file type that ffmpeg can produce screenshots for.
- `outputFileName` is the name of the output file, a base name for multiple files, or a template string (see below).
- `options` is an object containing options described below.
- `outputList` is an array of filenames of the pages created (will just contain one item, `outputFileName`, if there is only 1 page).

## Options

- `backgroundColour: '#ffffff',` Background colour of thumbnail page (default = `'#ffffff'`, white)
- `backgroundColor: '#ffffff',`  Same
- `headerHeight: 135,`           Height of header text (default is calculated from the header rows)
- `headerRows: [],`              Array of header text items, see below
- `imageHeight: 1080,`           Output thumbnail page height 
- `imageWidth: 1920,`            Preferred width of the output page of thumbnails (default = calculated from thumbnail size and cols, if possible)
- `margin: 1,`                   Distance of text from edge of image (in px) (default = `1`)
- `preferKnownSizes: true,`      If true (default), `imageHeight` is not specified and `imageWidth` matches a known width, use the appropriate height unless it is too small (see below)
- `thumbsCols: 8,`               The number of columns of thumbs in the output (default = `8`)
- `thumbsCount: 56,`             The number of thumbnails, if specified (cannot also specify `thumbsInterval`)
- `thumbsHeight: 120,`           The height of the thumbnail images (in px)
- `thumbsInterval: 1,`           The interval between thumbnails, if specified (cannot also specify `thumbsCount`)
- `thumbsRows: 7,`               The number of rows of thumbs in the output (soft default = `7`)
- `thumbsSamples: [],`           Array of time marks (overrides `thumbsCount` and `thumbsInterval`)
- `thumbsWidth: 240,`            The width of the thumbnail images (in px) (default = see below)
- `timeFont: ''`                 Filename(s) of font for time values (default = `[Jimp.FONT_SANS_16_WHITE, Jimp.FONT_SANS_16_BLACK]`)
- `titleFont: ''`                Filename(s) of font for header items (default = `Jimp.FONT_SANS_32_BLACK`)

### Thumbnail Page Defaults

The `ThumbnailGenerator` tries to make sensible guesses about what you mean. If you specify no options at all, it will generate 56 thumbnails of 240px wide and attempt to arrange them on a single page 1920x1080 with 7 rows of 8 columns. However, if the source material is not 16:9 aspect ratio, you may not end up with exactly this output.

#### Thumbnail Size

If `thumbsWidth` and/or `thumbsHeight` are specified, they will be used. Typically, only one will be specified and the other determined automatically by the aspect ratio of the source material. If both are specified, the thumbnails will be constrained to that size, even if it means they are stretched. If neither dimension is specified, but `imageWidth` _is_ specified, then it will be calculated as `imageWidth / thumbsCols` (even if `thumbsCols` has to be defaulted). Failing all that, it will be set to 240px.

If no options are specified, but the source material is in 16:9 format, the result will be:
- thumbnails of width 240px
- thumbnail height automatically determined by scaling without distortion (nominally 135px, but that may vary by 1 or 2 pixels due to variations in the source)

#### Thumbnail Sample Timestamps

If supplied, `thumbsSamples` is an array of numbers that represent the time positions in the file (in seconds) to take thumbnails.

All other options cause the timestamps to be calculated such that the first sample is at 1 second and the last sample is within 1 second of the end of the file, but not exactly _at_ the end of the file. This safe margin of 1 second is to take account of material that changes size or aspect ratio (usually streamed material) and so that no sample is just blank. It cannot currently be overridden.

`thumbsInterval` is a number of seconds between samples and `thumbsCount` is the total number of samples to take (arranged evenly along the timeline). Specifying both will cause an `Error` to be thrown. The minimum granularity of samples is 1 second, again this cannot be overridden. If the source material is short, there may be fewer samples taken than requested.

If nothing is specified, `thumbsCount` will be assumed to be `thumbsCols x thumbsRows`, even if one or both must be defaulted (default would be 56).

#### Rows and Columns

If supplied, `thumbsCols` and `thumbsRows` will be used to lay out thumbnails on the output page.

If not specified, `thumbsCols` may be determined as `imageWidth / thumbsWidth` if both are specified (not using defaults). If it is determined this way for the purpose of generating thumbnails, it will be re-calculated based on the dimensions of the first thumbnail before the output pages are generated (to allow for slight variations in thumbnail size). If all else fails, it defaults to 8.

If not specified, `thumbsRows` may be determined as `(imageHeight - headerHeight) / thumbsHeight`, if `imageHeight` is specified and based on the actual height of the first thumbnail (again, not using defaults). If that is not possible, it will default to 7. If a default value is needed during thumbnail generation, it will be set to 7, but later re-calculated based on the actual thumbnail size.

#### Output Page Size and Name

If specified, `imageHeight` and `imageWidth` will be used. Thumbnails will _not_ be centred on the page.

If not specified, `imageWidth` will be calculated as `thumbsWidth x thumbsCols` (where `thumbsWidth` will be the actual width of the first thumbnail and `thumbsCols` may be defaulted). If for any reason the width cannot be determined this way, it will throw an `Error`.

If not specified, `imageHeight` will be calculated as `(thumbsHeight x thumbsRows) + headerHeight` (where `thumbsHeight` will be the actual height of the first thumbnail and `thumbsRows` may be the default). If `preferKnownSizes` is not set to `false` (the default is `true`), and if the `imageWidth` _exactly matches_ one of the preferred sizes, the `imageHeight` will be set to that preferred size _unless_ that would make it smaller than calculated. The preferred sizes are: 2560x1440, 1920x1080, 1600x900, 1280x720 & 640x360. Note that `imageWidth` will never be adjusted to match a preferred size.

The `outputFileName` is treated in one of three ways:
- If it is a template with value placeholders (e.g., `page_${page}_of_${numberOfPages}.png`, see the description of the header rows, below), then it is always interpolated.
- If it is a simple filename (e.g., `a.png`) and there is only one file being produced, then it is used as is.
- If it is a simple filename and there will be multiple files produced, insert `_n` before the extension (e.g., `a.png` might become `a_1.png`, `a_2.png`).

#### Fonts

The font settings are formally an array of objects, but may be specified in one of three ways:

1. A single font.
```js
    titleFont: Jimp.FONT_SANS_32_BLACK
```

2. Two fonts in an array. The first is at offset 1,1. This may give an embossed effect, which is useful if the font is to be used against an unknown background colour.
```
    timeFont: [Jimp.FONT_SANS_16_WHITE, Jimp.FONT_SANS_16_BLACK]
```

3. As many fonts as wanted with explicit offsets. This setting is equivalent to the one above.
```
    timeFont: [{
            fontName: Jimp.FONT_SANS_16_WHITE,
            offsetX: 1,
            offsetY: 1
        }, {
            fontName: Jimp.FONT_SANS_16_BLACK,
            offsetX: 0,
            offsetY: 0
        }]
```

The fonts are BMFonts represented by a filename (whether relative or fully qualified), such that the file can be opened directly. This is what `Jimp` supplies with the symbols shown above.

When used, text will be printed in the fonts in the order given using the offsets (in px) from the normal position. In general, `ThumbnailGenerator` expects that all the fonts are the same size and the results are unspecified if they are not.

`titleFont` is used in the headers and `timeFont` is used to put the timestamp over the thumbnail images. The defaults are the values shown here.

#### Page Header

The page header for each thumbnail output page is specified as an array of arrays, but may actually be specified with some latitude:

1. The full definition is:
```js
    headerRows: [               // An array with one entry per header row (line of text)
        [                       // Each entry is an array of items to be displayed on that row
            {                   // Each item consist of up to three keys
                text: ...,      // A template item to be interpolated, see below
                align: ...,     // An alignment option, defaults to left alignment, see below
                condition: ...  // A template string with a simple condition, defaults to always, see below
            }, { }
        ],
        [                       // Items for the second row
            { }, { }
        ]
    ]
```

2. A row containing a single item may be specified as a simple object rather than an array:
```js
    headerRows: [               // An array with one entry per header row (line of text)
            {                   // There is only one item on the first row, no need for an array
                text: ...,       
                align: ...,      
                condition: ...   
            },
        [                       // Items for the second row
            { }, { }
        ]
    ]
```

3. A single item on one row:
```js
    headerRows: {               // There is only one item on one row, no need for an array at all
                text: ...,
                align: ...,
                condition: ...
            }
```

4. A single item with default alignment and no condition, may be specified as a simple string:
```js
    headerRows: '...'           // There is only one text item, no need for an object or an array
```
or
```js
    headerRows: [
        '...',                 // Multiple rows, but each is a simple text item
        '...'
    ]
```

In all cases, the text item is a template that contains placeholders to be interpolated. Placeholders are specified as `${name}`. Expressions are not allowed. To escape a placeholder precede it with a backslash `\\${name}` (typically two backslashes are required because the first is interpreted by Javascript). The available placeholders are listed below under Interpolation Values.

`align` is one of the values: `ThumbnailGenerator.LEFT`, `ThumbnailGenerator.CENTRE` (or `CENTER`), `ThumbnailGenerator.RIGHT`. Defaults to left alignment.

`condition` is a template similar to the text item, but may include simple comparisons. The template should fit the format `operand1 operator operand2` where `operator` is one of ==, >, <, >=, <=, !=. Whitespace is ignored around the operator, but not in the operands. If the operands are both numeric, then comparisons will treat them as numbers, if one is textual, then they will both be treated as text. No quotation marks are required for text.

The default header is:
```js
    headerRows: [[{
        align: ThumbnailGenerator.LEFT,        // Not required, just for demonstration
        text: 'Name: ${name}'
    }, {
        align: ThumbnailGenerator.RIGHT,
        text: 'Page: ${page} of ${numberOfPages}',
        condition: '${numberOfPages} > 1'
    }], {
        text: 'Start time: ${startTimeFractional}',
        condition: '${formatName} == mpegts'
    }, {
        text: 'Duration: ${durationFractional}'
    }];
```
This will cause the following:
- First Row:
    - The source filename on the left (no path).
    - If there is more than one page being produced, then 'Page n of N' on the right
- Second Row:
    - If the format is mpegts (i.e., m2ts file), then put the start time on the left (to 3 decimal places of seconds). Transport streams may have a start time indicating how far into this stream the current file started.
    - If the format is something else, this line will be left out (not left blank, it will be omitted completely)
- Third Row (or Second Row if the source is not a transport stream):
    - The duration of the source file (to 3 decimal places of seconds)

When calculating the `headerHeight`, all `headerRows` are always included, regardless of conditions, so the default height will be 110px (3 rows of default font plus margins).

#### Interpolation Values

The following placeholders are supported:

- `duration` length of the source file in seconds
- `durationFractional` length of the source file in seconds (to 3 decimal places)
- `filename` the fully qualified source filename (including path)
- `formatName` the ffprobe video format (e.g. mpegts or 'mov,mp4,m4a,3gp,3g2,mj2', the quotes are not required, just to show that is a single value!)
- `name` the source filename (short filename, no path, but including extension)
- `numberOfPages` total number of output pages being produced
- `page` the current page number
- `startTime` the start time of this file in the stream, if appropriate
- `startTimeFractional` the start time of this file in the stream, if appropriate, (to 3 decimal places)


## Development Scripts

- `npm test` - run unit tests with coverage
- `npm run test:unit` - run unit tests without coverage (better for finding error lines)
- `npm run test:it` - run integration tests (some unit tests do test units together, but the integration tests run longer and test more interactions)
- `npm run test:all` - run unit and integration tests
- `npm run test:allcov` - run unit and integration tests with coverage
- `npm run test:local` - run tests expecting ffmpeg and ffprobe to be available on the path or through environment variables (not normally run)
- `npm run test:generate` - generate new expected result images in project root

