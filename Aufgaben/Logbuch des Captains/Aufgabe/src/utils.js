/**
 * Hilfsfunktion zur Berechnung der aus Star Trek bekannten Sternzeit zu einem gegebenen
 * Datum mit Uhrzeit. Es gibt keine feste Formel hierfür. Der untenstehende Algorithmus
 * scheint aber weit verbreitet zu sein. Anders als in der Vorlage lassen wir die Sternzeit
 * hier im Jahr 1973 beginnen, um negative Werte zu vermeiden. Im Original liegt der Anfang
 * im Jahr 2323. Bis dahin ist es aber noch eine Weile hin und ich bin mir nicht sicher, ob
 * sich dann noch jemand für dieses Programm interessiert. :-)
 * 
 * @param {Date} date Umzurechnendes Datum und Uhrzeit
 * @returns {string} Sternzeit
 */
export function calcStarDate(date) {
    const startYear = 1973;
    const year      = date.getFullYear();
    
    const firstDay  = new Date(year, 0, 0);
    const diff      = date - firstDay;
    const oneDay    = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    const timeOfDay = dayOfYear + (date.getHours() / 24) + (date.getMinutes() / 1440) + (date.getSeconds() / 86400);
    const starDate  = 1000 * (year - startYear) + timeOfDay;
    return `${starDate.toFixed(2)}`;
}