import { Song } from "../types";

export const getSongLookupKey = (song: Pick<Song, "id" | "isNetease" | "neteaseId">) => {
    if (song.isNetease && song.neteaseId) {
        return `netease:${song.neteaseId}`;
    }

    return `id:${song.id}`;
};

export const buildSongIdIndexMap = (songs: Song[]) => {
    const map = new Map<string, number>();

    songs.forEach((song, index) => {
        map.set(song.id, index);
    });

    return map;
};

export const buildSongLookupIndexMap = (songs: Song[]) => {
    const map = new Map<string, number>();

    songs.forEach((song, index) => {
        map.set(getSongLookupKey(song), index);
    });

    return map;
};

export const buildSongIdMap = (songs: Song[]) => {
    const map = new Map<string, Song>();

    songs.forEach((song) => {
        map.set(song.id, song);
    });

    return map;
};