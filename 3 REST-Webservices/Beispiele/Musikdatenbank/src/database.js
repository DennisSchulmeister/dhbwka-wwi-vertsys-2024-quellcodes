import {JSONFilePreset} from "lowdb/node";

// Default-Daten für unsere kleine Datenbank
const defaultData = {
    Song: [
        {id: 1,  artist: "Elton John",   name: "Goodbye Yellow Brick Road", releaseYear: 1973, songwriters: "Bernie Taupin, Elton John"},
        {id: 2,  artist: "Elton John",   name: "Candle In The Wind",        releaseYear: 1973, songwriters: "Bernie Taupin, Elton John"},
        {id: 3,  artist: "Elton John",   name: "Blue Wonderful",            releaseYear: 2016, songwriters: "Bernie Taupin, Elton John"},
        {id: 4,  artist: "Dire Straits", name: "Brothers In Arms",          releaseYear: 1985, songwriters: "Mark Knopfler"},
        {id: 5,  artist: "Dire Straits", name: "Sultans of Swing",          releaseYear: 1978, songwriters: "Mark Knopfler"},
        {id: 6,  artist: "Dire Straits", name: "Calling Elvis",             releaseYear: 1991, songwriters: "Mark Knopfler"},
        {id: 7,  artist: "The Eagles",   name: "Tequila Sunrise",           releaseYear: 1973, songwriters: "Don Henley, Glenn Frey"},
        {id: 8,  artist: "The Eagles",   name: "Busy Being Fabulous",       releaseYear: 2007, songwriters: "Don Henley, Glenn Frey"},
        {id: 9,  artist: "O.M.D.",       name: "Walking On The Milky Way",  releaseYear: 1996, songwriters: "McCluskey, Nigel Ipinson, Keith Small"},
        {id: 10, artist: "Queen",        name: "I Want To Break Free",      releaseYear: 1984, songwriters: "John Deacon"},
        {id: 11, artist: "Queen",        name: "Radio Ga-Ga",               releaseYear: 1984, songwriters: "Roger Taylor"},
    ],

    Playlist: [
        {
            id:    1,
            name:  "The Golden 70s",
            songs: [1, 2, 5, 7],
        },
        {
            id:    2,
            name:  "The very best of Dire Straits",
            songs: [4, 5, 6],
        }
    ],
};

// Datenbank-Objekt als Singleton
export const db = await JSONFilePreset("db.json", defaultData);

/**
 * Hilfsmethode zum Auffinden des Array-Index eines Datensatzes, dessen ID bekannt ist.
 * Hierfür muss der Methode im ersten Parameter das zu durchsuchende Array und im
 * zweiten Parameter die ID des gesuchten Datensatzes übergeben werden. Als Ergebnis
 * liefert sie den Index innerhalb des Arrays oder -1, wenn dieser nicht gefunden wurde.
 * 
 * @param {Object[]} dataset Zu durchsuchende Datenmenge
 * @param {integer} id ID des gesuchten Datensatzes
 * @returns {integer} Gefundener Index oder -1
 */
export function findIndex(dataset, id) {
    return dataset.findIndex(entry => entry.id === id);
}

/**
 * Hilfsmethode zum Ermitteln der nächsten freien ID innerhalb einer Datenmenge.
 * Kann beim Speichern eines neuen Datensatzes verwendet werden, um die ID des
 * Datensatzes zu ermitteln.
 * 
 * HINWEIS: Da wir keine echte Datenbank nutzen, müssen wir auf diese Hilfsmethode
 * zurückgreifen, die allerdings keinerlei Synchronisation erzwingt und somit bei
 * zeitgleichen Zugriffen durch mehrere Clients zu falschen Ergebnissen führen kann!
 * 
 * @param {Object[]} dataset Zu durchsuchende Datenmenge
 */
export function getNextId(dataset) {
    let maxId = -1;
    for (let entry of dataset || []) maxId = Math.max(maxId, entry.id);
    return maxId + 1;
}

export default {db, findIndex, getNextId};