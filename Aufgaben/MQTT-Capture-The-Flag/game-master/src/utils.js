/**
 * Neuen Zeitstempel anhand aktuellem Datum/Uhrzeit ermitteln.
 * @returns Millisekunden seit 1970
 */
export function get_timestamp() {
    return (new Date()).valueOf();
}

/**
 * Hilfsfunktion zum Sicherstellen, dass ein Wert innerhalb seines gültigen Wertebereichs liegt.
 * 
 * @param {number} value Ist-Wert
 * @param {number} min Mindestwert
 * @param {number} max Maximalwert
 * @returns Neuer Wert
 */
export function clamp(value, min, max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
}

/**
 * Winkel von Grad in Bogenmaß umrechnen.
 * 
 * @param {number} degrees Grad
 * @returns {number} Bogenmaß
 */
export function deg_to_rad(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * Winkel von Bogenmaß nach Grad umrechnen.
 * 
 * @param {number} degrees Bogenmaß
 * @returns {number} Grad
 */
export function rad_to_deg(rad) {
    return rad * 180 / Math.PI;
}

/**
 * Berechnung der Entfernung in Metern und dem Richtungsunterschied zwischen zwei
 * Objekten, deren Koordinaten im WGS84-Format als Longitude, Latitude und Altitude
 * gegeben sind. Die übergebenen Objekte müssen folgende Struktur besitzen:
 * 
 * ```js
 * {
 *     lat: 98.87654321,        // Latitude
 *     lon: 12.34567897,        // Longitude
 *     alt: 123,                // Höhe in Metern
 * }
 * ```
 * 
 * Als Ergebnis wird ein Objekt mit folgenden Attributen geliefert:
 * 
 * ```js
 * {
 *     len: 123.456,            // Distanz in Metern (Haversine-Formel)
 *     lat: 0.02314,            // Breitenunterschied in Grad
 *     lon: 0.00542,            // Längenunterschied in Grad
 *     alt: -23.000,            // Höhenunterschied in Metern
 * }
 * ```
 * 
 * @param {object} coords1 Koordinate 1
 * @param {object} coords2 Koordinate 2
 * @returns {number} Entfernung
 */
export function calc_distance(coords1, coords2) {
    let result = {
        len: 0,
        lat: coords2.lat - coords1.lat,
        lon: coords2.lon - coords1.lon,
        alt: coords2.alt - coords1.alt,
    };

    const lat1 = deg_to_rad(coords1.lat);
    const lon1 = deg_to_rad(coords1.lon);
    const lat2 = deg_to_rad(coords2.lat);
    const lon2 = deg_to_rad(coords2.lon);

    const a = Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    result.len = c * 6371 * 1000; // Erdradius: 6371 km

    return result;
}

/**
 * Hilfsfunktion zum Berechnen des Winkels zwischen der X-Achse der Karte und einem Punkt.
 * Der Winkel wird in Grad von 0 bis 360 berechnet, um daraus ablesen zu können, in welcher
 * Richtung der Punkt relativ zum Bezugspunkt liegt.
 * 
 * Dies ist dafür gedacht, den Winkel zwischen einem Objekt und dem Spieler zu berechnen,
 * um dem Spieler einen Hinweis zu geben, ob er in die richtige Richtung fliegt. Hierfür
 * muss die Differenz zwischen Spieler und Objekt gebildet und an diese Funktion übergeben
 * werden. Anschließend muss vom zurückgegebenen Winkel der Kompasswinkel des Spielers
 * abgezogen werden. Siehe Funktion `calc_angle_from_player()`
 * 
 * @param {number} lat Breigengrad
 * @param {number} lon Längengrad
 * @returns {number} Winkel in Grad
 */
export function calc_compass_angle(lat, lon) {
    let theta_rad = Math.atan2(lat, lon);    
    let alpha_rad = Math.PI / 2 - theta_rad;
    let alpha_deg = rad_to_deg(alpha_rad);
    
    if (alpha_deg < 0) alpha_deg = 360 + alpha_deg;
    return alpha_deg;
}

/**
 * Berechnung der Winkeldifferenz, die ein Spieler seinen Kompasswinkel anpassen müsste, um
 * zu einem anderen Objekt zu gelangen. Fliegt der Spieler beispielsweise in Richtung 45° (N-O),
 * und das Objekt befindet sich bei 135° (S-O), wird die Differenz 90° ermittelt, da der Spieler
 * seine Flugrichtung um 90° ändern müsste, um auf das Objekt zuzufliegen.
 * 
 * @param {object} player_pos Spieler-Position (lon, lat, rot)
 * @param {object} other_pos Anderes Objekt (lon, lat)
 * @returns {number} Winkeldifferenz in Grad
 */
export function calc_angle_from_player(player_pos, other_pos) {
    const angle = calc_compass_angle(other_pos.lat - player_pos.lat, other_pos.lon - player_pos.lon);
    return angle - player_pos.rot;
}

/**
 * Drehung eines Punkts um den Nullpunkt.
 * 
 * @param {number} lat Breitengrad
 * @param {number} lon Längengrad
 * @param {number} theta Drehwinkel in Grad
 * @returns {object} Gedrehter Punkt (lon, lat)
 */
export function rotate_point(lat, lon, theta) {
    var radians = deg_to_rad(theta);
    var new_lat = lon * Math.sin(radians) + lat * Math.cos(radians);
    var new_lon = lon * Math.cos(radians) - lat * Math.sin(radians);

    return {
        lat: new_lat,
        lon: new_lon,
    };
}