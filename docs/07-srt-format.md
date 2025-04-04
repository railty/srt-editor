# SRT File Format Reference

The SRT (SubRip Text) format is one of the most widely used subtitle formats. This document provides a reference for the SRT format as it is used in the SRT Editor application.

## Basic Structure

An SRT file consists of multiple subtitle entries, each containing:

1. A sequential number (starting from 1)
2. The timeline (start and end times) in the format: `HH:MM:SS,mmm --> HH:MM:SS,mmm`
3. The subtitle text (one or more lines)
4. A blank line to separate entries

Example:

```
1
00:00:20,000 --> 00:00:24,400
Hello, world!

2
00:00:24,600 --> 00:00:27,800
This is an example
of a subtitle.

3
00:00:30,000 --> 00:00:34,000
Subtitles can span
multiple lines.
```

## Time Format

The timeline format in SRT follows this pattern:

```
Hours:Minutes:Seconds,Milliseconds --> Hours:Minutes:Seconds,Milliseconds
```

- Hours: Two-digit format (00-99)
- Minutes: Two-digit format (00-59)
- Seconds: Two-digit format (00-59)
- Milliseconds: Three-digit format (000-999)
- Separator: A comma (,) is used between seconds and milliseconds
- Arrow: The string " --> " (with spaces) separates start and end times

## Speaker Information

While the standard SRT format does not include speaker information, the SRT Editor supports several common patterns for identifying speakers:

### Pattern 1: "Speaker X:" Prefix

```
1
00:00:20,000 --> 00:00:24,400
Speaker 1: Hello, world!

2
00:00:24,600 --> 00:00:27,800
Speaker 2: This is an example
of a subtitle.
```

### Pattern 2: "[Speaker X]" Prefix

```
1
00:00:20,000 --> 00:00:24,400
[Speaker 1] Hello, world!

2
00:00:24,600 --> 00:00:27,800
[Speaker 2] This is an example
of a subtitle.
```

### Pattern 3: Numeric Prefix

```
1
00:00:20,000 --> 00:00:24,400
1: Hello, world!

2
00:00:24,600 --> 00:00:27,800
2: This is an example
of a subtitle.
```

## Text Formatting

SRT files can contain basic text formatting using HTML-like tags:

- **Bold**: `<b>text</b>`
- **Italic**: `<i>text</i>`
- **Underline**: `<u>text</u>`
- **Font color**: `<font color="red">text</font>`

Example:

```
1
00:00:20,000 --> 00:00:24,400
This is <b>bold</b> and this is <i>italic</i>.

2
00:00:24,600 --> 00:00:27,800
<font color="red">This text is red.</font>
```

Note: Not all media players support these formatting tags.

## SRT Parser Implementation

The SRT Editor implements parsing of SRT files with the following capabilities:

1. Parsing standard SRT format
2. Detecting speaker information using multiple patterns
3. Converting time formats between SRT format and seconds
4. Extracting and processing subtitle text

The core parsing logic is in the `parseSRTWithSpeakers` function in `utils/srt/SrtParser.js`.

## Generating SRT Files

The SRT Editor will include functionality to generate SRT files from the edited subtitles. The generated files will:

1. Follow the standard SRT format
2. Include speaker information if available
3. Preserve text formatting
4. Ensure proper time formatting

## Best Practices for SRT Files

When working with SRT files in the SRT Editor, consider these best practices:

1. **Timing**: Keep subtitles on screen long enough to read (general rule: 1 second per 7-8 words)
2. **Line Length**: Limit lines to 42 characters for optimal readability
3. **Line Breaks**: Break lines at natural linguistic breaks
4. **Duration**: Keep subtitles between 1-7 seconds
5. **Gap**: Maintain a small gap (at least 2 frames) between consecutive subtitles
6. **Speaker Consistency**: Use consistent speaker identification patterns

## Compatibility

SRT files created or edited with the SRT Editor should be compatible with most media players and video platforms that support subtitles, including:

- VLC Media Player
- Windows Media Player (with codecs)
- YouTube
- Vimeo
- Most streaming platforms

## Future Enhancements

The SRT Editor plans to add support for additional subtitle formats in the future:

- WebVTT (.vtt)
- Advanced SubStation Alpha (.ass)
- SubStation Alpha (.ssa)
- TTML (.ttml)
