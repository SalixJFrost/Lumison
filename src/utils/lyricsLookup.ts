import { LyricLine, LyricWord } from "../types";

export const findActiveLyricLineIndex = (
    lyrics: LyricLine[],
    currentTime: number,
) => {
    let left = 0;
    let right = lyrics.length - 1;
    let result = -1;

    while (left <= right) {
        const middle = Math.floor((left + right) / 2);
        const line = lyrics[middle];

        if (!line) {
            break;
        }

        if (currentTime >= line.time) {
            result = middle;
            left = middle + 1;
        } else {
            right = middle - 1;
        }
    }

    return result;
};

export const findActiveLyricWordIndex = (
    words: LyricWord[],
    currentTime: number,
) => {
    let left = 0;
    let right = words.length - 1;
    let result = -1;

    while (left <= right) {
        const middle = Math.floor((left + right) / 2);
        const word = words[middle];

        if (!word) {
            break;
        }

        if (currentTime >= word.startTime) {
            result = middle;
            left = middle + 1;
        } else {
            right = middle - 1;
        }
    }

    return result;
};