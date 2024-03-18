import {get_timestamp}          from "./utils.js";
import {clamp}                  from "./utils.js";
import {calc_distance}          from "./utils.js";
import {calc_angle_from_player} from "./utils.js";
import {rad_to_deg}             from "./utils.js";
import {rotate_point}           from "./utils.js";

import fs                       from "node:fs/promises";
import path                     from "node:path";
import url                      from "node:url";
import YAML                     from 'yaml'

// Datendatei einlesen
const source_dir = path.dirname(url.fileURLToPath(import.meta.url));
const data_file  = path.join(source_dir, "data.yml");
const data       = YAML.parse(await fs.readFile(data_file, "utf-8"));

/**
 * Flaggen zur Anzeige auf der Karte
 */
export const flags = [];

for (const flag of data.flags) {
    flags.push(flag);
}

// Spielstand der einzelnen Spieler
let players = new Map();

/**
 * Hilfsfunktion zum Ermitteln der aktuellen Spielerdaten anhand einer Spieler ID.
 * Liefert entweder das gefundene Objekt oder wirft eine Exception mit einer Fehlermeldung.
 * 
 * @param {string} player_id ID des Spielers
 * @returns {object} Gesuchte Spielerdaten
 */
function get_player(player_id) {
    const result = players.get(player_id);
    if (!result) throw new Error(`Ungültige Spieler ID: ${player_id}`);
    return result;
}

// Feuerwaffen zum Angriff anderer Spieler
const weapons = {
    water_gun: {                     // Wasserstrahler
        d_health:  0,                //  - Energieabzug
        x_rot:     5,                //  - Maximale Störung der Flugrichtung
        x_alt:     1,                //  - Maximale Störung der Flughöhe
        max_d_len: 80,               //  - Maximale Entfernung in Metern 
        max_d_alt: 20,               //  - Maximaler Höhenunterschied
    },
    machine_gun: {                   // Maschinengewehr
        d_health:  5,                //  - Energieabzug
        x_rot:     15,               //  - Maximale Störung der Flugrichtung
        x_alt:     10,               //  - Maximale Störung der Flughöhe
        max_d_len: 100,              //  - Maximale Entfernung in Metern 
        max_d_alt: 25,               //  - Maximaler Höhenunterschied
    },
    torpedo: {                       // Torpedo
        d_health:  45,               //  - Energieabzug
        x_rot:     45,               //  - Maximale Störung der Flugrichtung
        x_alt:     75,               //  - Maximale Störung der Flughöhe
        max_d_len: 500,              //  - Maximale Entfernung in Metern 
        max_d_alt: 50,               //  - Maximaler Höhenunterschied
    },
};

/**
 * Neuen Spieler dem Spiel hinzufügen. Wirft eine Exception mit einem Fehler, wenn
 * es bereits einen Spieler mit gleichem Namen gibt. Bei der ID wird davon ausgegangen,
 * dass diese immer eindeutig ist und den Spieler technisch identifiziert.
 * 
 * @param {string} player_id ID des Spielers
 * @param {string} player_name Name des Spielers
 * @returns {object} Neue Spielerdaten
 */
export function join_game(player_id, player_name) {
    // Existierenden Spieler mit derselben ID suchen
    const existing_player1 = players.get(player_id);

    if (existing_player1) {
        if (existing_player1.name === player_name) {
            // Spieler nimmt schon am Spiel teil
            return;
        } else {
            // Ein Spieler mit anderem Namen verwendet dieselbe ID
            throw new Error(`Ups! Die Spieler-ID ${player_id} gibt es schon, ist aber mit den Namen ${existing_player1.name} verknüpft.`);
        }
    }

    // Existierenden Spieler mit demselben Namen suchen
    const player_name_lower = player_name.toLowerCase();
    const existing_player2 = [...players.values()].find(entry => entry.name.toLowerCase() === player_name_lower);

    if (existing_player2) {
        throw new Error(`Sorry, der Name ${player_name} ist schon vergeben. Bei zwei ${player_name} komme ich nur durcheinander!`);
    }

    // Neuen Spieler hinzufügen
    const start_lat = (Math.random() * (data.start_position.to.lat - data.start_position.from.lat)) + data.start_position.from.lat;
    const start_lon = (Math.random() * (data.start_position.to.lon - data.start_position.from.lon)) + data.start_position.from.lon;

    const new_player = {
        id:         player_id,       // Technische ID des Spielers
        name:       player_name,     // Angezeigter Name des Spielers
        playing:    false,           // Spieler nimmt aktiv am Spiel teil
        crashed:    false,           // Spieler kann aufgrund Absturz nicht mehr spielen
        finished:   false,           // Spieler hat das Spiel beendet aber noch nicht verlassen
        all_flags:  false,           // Spieler hat alle Flaggen eingesammelt
        left_game:  false,           // Spieler hat das Spiel verlassen
        timestamp:  get_timestamp(), // Zeitstempel der letzten Statusänderung (ms seit 1970)
        last_seen:  get_timestamp(), // Zeitstempel seit der letzten Spieleraktion
        start_time: 0,               // Zeitstempel, wann das Spiel gestartet wurde
        end_time:   0,               // Zeitstempel, wann das Spiel beendet wurde
        health:     100,             // Lebensenergie des Spielers in Prozent von 0..100
        position: {                  // Aktuelle Position und Ausrichtung
            lat: start_lat,          //  - Breitengrad
            lon: start_lon,          //  - Längengrad
            alt: 0,                  //  - Höhe in Meter
            rot: 0,                  //  - Kompassrichtung in Grad, 0 = N, 90 = O, 180 = S, 270 = W
        },
        speed: {                     // Fluggeschwindigkeit
            kmh_f: 0,                //  - Vorwärts-Fluggeschwindigkeit in km/h
            kmh_s: 0,                //  - Seitwärts-Fluggeschwindigkeit in km/h
            kmh_h: 0,                //  - Höhen-Fluggeschwindigkeit in km/h
        },
        max_values: {                // Maximal zulässige Flugwerte
            kmh_f: 50,               //  - Vorwärts-Fluggeschwindigkeit in km/h
            kmh_s: 20,               //  - Seitwärts-Fluggeschwindigkeit in km/h
            kmh_h: 5,                //  - Höhen-Fluggeschwindigkeit in km/h
            alt:   500,              //  - Maximale Höhe in m
            acc_s: 1.1,              //  - Beschleunigungsfaktor je Sekunde
            deg_s: 5,                //  - Maximale Rotationsänderung je Sekunde in Grad
        },
        flight_input: {              // Flugsteuerung (Eingaben des Spielers, alle von -1...1)
            forward:  0,             //  - Flughebel Vor/Zurück
            sideward: 0,             //  - Flughebel Rechts/Links
            height:   0,             //  - Flughebel Hoch/Runter
            rotation: 0,             //  - Flughebel Drehung
            honk:     false,         //  - Hupe an/aus
        },
        next_flag: {                 // Nächste zu erreichende Flagge
            index: 0,                //  - Tabellenindex
            data: {                  //  - Daten zur Flagge
                lat: 0,              //     - Breitengrad
                lon: 0,              //     - Längengrad
                alt: 0,              //     - Höhe in Metern
                nam: "",             //     - Bezeichnung
                spk: "",             //     - Funkspruch
            },
            distance: {              //  - Richtung und Entfernung
                len: 0,              //     - Entfernung in Metern
                lat: 0,              //     - Breitenunterschied in Grad
                lon: 0,              //     - Längenunterschied in Grad
                alt: 0,              //     - Höhenunterschied in Metern
                rot: 0,              //     - Kompasswinkeldifferenz in Grad (0 = in Flugrichtung)
            }
        },
        captured_flags:  [],         // Namen der bereits erreichten Flaggen (Strings)
        nearest_players: [],         // Umliegende Spieler innerhalb Sichtradius (Distanzobjekt: id, nam, len, lat, lon, alt, rot)
        radar_sight_distance: 5000,  // Radarsichtweite in Metern
        weapon_amo: {                // Feuerwaffen zum Angriff von Spielern in der Nähe
            water_gun:   10000,      //  - Wasserstrahler
            machine_gun: 5000,       //  - Maschinengewehr
            torpedo:     5,          //  - Torpedo
        },
    };

    players.set(player_id, new_player);

    return update_player(player_id);
}

/**
 * Zeitstempel der letzten Spieleraktion aktualisieren, damit der Spieler nicht wegen Inaktivität
 * aus dem Spiel fliegt.
 * 
 * @param {string} player_id ID des Spielers
 * @returns {object} Aktualisierte Spielerdaten
 */
export function touch_player(player_id) {
    const player = get_player(player_id);
    player.last_seen = get_timestamp();
    return player;

}
/**
 * Spieler vom Spiel abmelden. Entfernt eigentlich den Spieler aus der Liste, falls vorhanden.
 * Zuvor werden jedoch die aktuellen Spielerdaten ermittelt und so angepasst, dass der Spieler
 * nicht mehr aktiv ist und das Spiel verlassen hat. Dieser Status wird zurückgeliefert, um an
 * die anderen Spielteilnehmer versendet werden zu können.
 * 
 * Gibt es den gesuchten Spieler nicht, passiert nichts und es wird nichts zurückgeliefert.
 * 
 * @param {string} player_id ID des Spielers
 * @returns {object} Aktualisierte Spielerdaten
 */
export function leave_game(player_id) {
    const player = players.get(player_id);
    
    if (player) {
        player.timestamp = get_timestamp();
        player.playing   = false;
        player.left_game = true;
    }

    players.delete(player_id);
    return player;
}

/**
 * Spiel beenden, ohne das Spiel zu verlassen. Ändert die Daten des Spielers entsprechend, so dass
 * der Spieler nicht mehr mit dem Spiel interagieren kann und gibt diese zurück.fire
 * 
 * @param {string} player_id ID des Spielers
 * @returns {object} Aktualisierte Spielerdaten
 */
export function finish_game(player_id) {
    const player = get_player(player_id);

    player.timestamp       = get_timestamp();
    player.end_time        = player.timestamp;
    player.playing         = false;
    player.finished        = true;

    player.flight_input.forward  = 0;
    player.flight_input.sideward = 0;
    player.flight_input.height   = -1;
    player.flight_input.rotation = 0;
    
    player.next_flag.index          = -1,
    player.next_flag.distance.d_len = 0;
    player.next_flag.distance.d_lat = 0;
    player.next_flag.distance.d_lon = 0;
    player.next_flag.distance.d_alt = 0;
    player.next_flag.distance.d_rot = 0;
    player.next_flag.data.lat       = 0;
    player.next_flag.data.lon       = 0;
    player.next_flag.data.alt       = 0;
    player.next_flag.data.nam       = "";
    player.next_flag.data.spk       = "";
    
    return player;
}

/**
 * Flughebel bewegen, um die Eingaben für die Flugsteuerung anzupassen. Prüft lediglich die Werte
 * und übernimmt sie in das Spielerobjekt. Jedoch erst die Funktion `advance_game()` berechnet die
 * Geschwindigkeiten und Position etc. neu.
 * 
 * @param {string} player_id ID des Spielers
 * @param {number} forward Flughebel Vor/Zurück
 * @param {number} sideward Flughebel Rechts/Links
 * @param {number} height Flughebel Hoch/Runter
 * @param {number} rotation Flughebel Drehung
 * @param {boolean} honk Hupe an/aus
 * @returns {object} Aktualisierte Spielerdaten
 */
export function change_flight_input(player_id, {forward, sideward, height, rotation, honk} = {}) {
    const player = get_player(player_id);

    if (!player.finished && !player.crashed) {
        player.playing = true;
    
        player.flight_input.forward  = clamp(forward,  -1, 1);
        player.flight_input.sideward = clamp(sideward, -1, 1);
        player.flight_input.height   = clamp(height,   -1, 1);
        player.flight_input.rotation = clamp(rotation, -1, 1);
        player.flight_input.honk     = honk ? true : false;
    }

    return player;
}

/**
 * Anderen Spieler angreifen. Aktualisiert den Status beider Spieler, wobei der angegriffene
 * Spieler in Reichweite sein muss, damit der Angriff Wirkung zeigt. Wirft nur dann einen Fehler,
 * wenn es einen der beiden Spieler nicht geben sollte. Alle anderen Fehler, wie die Auswahl einer
 * nicht vorhandenen Waffe oder Abgabe von mehr Schuss als vorhanden, werden ignoriert.
 * 
 * @param {string} player_id ID des Spielers
 * @param {string} weapon Name der abgefeuerten Waffe
 * @param {number} amount Anzahl abgegebener Schuss
 * @param {string} target_player_id Angepeilter Gegenspieler
 */
export function attack_other_player(player_id, {weapon, amount, target_player_id} = {}) {
    // Prüfungen vorneweg
    const player = get_player(player_id);
    if (player.finished || player.crashed) return;

    const target_player = get_player(target_player_id);

    const weapon_params = weapons[weapon];
    if (!weapon_params) return;
    
    // Munition des Angreifers reduzieren
    const amo_before = player.weapon_amo[weapon] || 0;
    amount = Math.min(amount, amo_before);
    player.weapon_amo[weapon] -= amount;

    // Reichweite des Gegenspielers prüfen
    const distance = calc_distance(player.position, target_player.position);

    if (Math.abs(distance.len) > weapon_params.max_d_len) return;
    if (Math.abs(distance.alt) > weapon_params.max_d_alt) return;

    // Gegenspieler beeinflussen (ohne Flags, das passiert in `update_player()`)
    target_player.health = clamp(target_player.health - weapon_params.d_health, 0, 100);

    target_player.position.rot += (2 * Math.random() * weapon_params.x_rot) - weapon_params.x_rot;
    target_player.position.alt += (2 * Math.random() * weapon_params.x_alt) - weapon_params.x_alt;
}

/**
 * Spielstand eines Spielers durchaktualisieren. Berechnet die neue Geschwindigkeit, Position,
 * zu erreichende Flagge, Status, Abstand zu anderen Spielern usw. Prüft darüber hinaus auf Kollision
 * mit einem anderen Spieler und lässt beide Abstürzen, falls sie sich zu nahe kommen.
 * 
 * @param {string} player_id ID des Spielers
 * @returns {object} Aktualisierte Spielerdaten
 */
export function update_player(player_id) {
    const player = get_player(player_id);

    const timestamp = get_timestamp();
    const time_diff = (player.timestamp - timestamp) / 1000;
    player.timestamp = timestamp;

    // Lebensenergie prüfen
    if (player.health <= 0) {
        player.health  = 0;
        player.playing = false;
        player.crashed = true;
    }

    // Neue Geschwindigkeit und Flugrichtung berechnen
    if (player.playing) {
        // Neue Geschwindigkeit berechnen
        const min_kmh = 3.6;
    
        const target_speed = {
            kmh_f: (player.max_values.kmh_f * player.flight_input.forward),
            kmh_s: (player.max_values.kmh_s * player.flight_input.sideward),
            kmh_h: (player.max_values.kmh_h * player.flight_input.height),
        };
    
        const delta_speed = {
            kmh_f: target_speed.kmh_f - player.speed.kmh_f,
            kmh_s: target_speed.kmh_s - player.speed.kmh_s,
            kmh_h: target_speed.kmh_h - player.speed.kmh_h,
        };
    
        if (delta_speed.kmh_f > 0) {
            if (player.speed.kmh_f >= -min_kmh) {
                player.speed.kmh_f = Math.max(min_kmh, player.speed.kmh_f);
                player.speed.kmh_f *= Math.pow(player.max_values.acc_s, time_diff);
            } else {
                player.speed.kmh_f /= Math.pow(player.max_values.acc_s, time_diff);
            }
        } else if (delta_speed.kmh_f < 0) {
            if (player.speed.kmh_f >= min_kmh) {
                player.speed.kmh_f /= Math.pow(player.max_values.acc_s, time_diff);
            } else {
                player.speed.kmh_f = Math.min(-min_kmh, player.speed.kmh_f);
                player.speed.kmh_f *= Math.pow(player.max_values.acc_s, time_diff);
            }
        }
    
        if (delta_speed.kmh_s > 0) {
            if (player.speed.kmh_s >= -min_kmh) {
                player.speed.kmh_s = Math.max(min_kmh, player.speed.kmh_s);
                player.speed.kmh_s *= Math.pow(player.max_values.acc_s, time_diff);
            } else {
                player.speed.kmh_s /= Math.pow(player.max_values.acc_s, time_diff);
            }
        } else if (delta_speed.kmh_s < 0) {
            if (player.speed.kmh_s >= min_kmh) {
                player.speed.kmh_s /= Math.pow(player.max_values.acc_s, time_diff);
            } else {
                player.speed.kmh_s = Math.min(-min_kmh, player.speed.kmh_s);
                player.speed.kmh_s *= Math.pow(player.max_values.acc_s, time_diff);
            }
        }
    
        if (delta_speed.kmh_h > 0) {
            if (player.speed.kmh_h >= -min_kmh) {
                player.speed.kmh_h = Math.max(min_kmh, player.speed.kmh_h);
                player.speed.kmh_h *= Math.pow(player.max_values.acc_s, time_diff);
            } else {
                player.speed.kmh_h /= Math.pow(player.max_values.acc_s, time_diff);
            }
        } else if (delta_speed.kmh_h < 0) {
            if (player.speed.kmh_h >= min_kmh) {
                player.speed.kmh_h /= Math.pow(player.max_values.acc_s, time_diff);
            } else {
                player.speed.kmh_h = Math.min(-min_kmh, player.speed.kmh_h);
                player.speed.kmh_h *= Math.pow(player.max_values.acc_s, time_diff);
            }
        }
    
        player.speed.kmh_f = clamp(player.speed.kmh_f, -player.max_values.kmh_f, player.max_values.kmh_f);
        player.speed.kmh_s = clamp(player.speed.kmh_s, -player.max_values.kmh_s, player.max_values.kmh_s);
        player.speed.kmh_h = clamp(player.speed.kmh_h, -player.max_values.kmh_h, player.max_values.kmh_h);
    
        // Neue Flugrichtung berechnen
        player.position.rot += player.flight_input.forward * player.flight_input.rotation * player.max_values.deg_s / 2 * time_diff;

        // while (player.position.rot > 360) player.position.rot -= 360;
        // while (player.position.rot < 0) player.position.rot += 360;
    }

    // Neue Position berechnen
    let m_deg = rad_to_deg(1 / 6371 * 1000);            // Erddurchmesser 6371 km -> 1m in Grad
    m_deg = m_deg / 10000;                              // TODO: WORKAROUND FÜR NICHT FUNKTIONIERENDE FORMEL

    const ms_deg_f = player.speed.kmh_f / 3.6 * m_deg;    // Geschwindigkeit -> m/s -> Delta Grad; Latitude  = Breitengrad = Vorwärts
    const ms_deg_s = player.speed.kmh_s / 3.6 * m_deg;    // Geschwindigkeit -> m/s -> Delta Grad; Longitude = Längengrad  = Seitwärts
    const rotated  = rotate_point(ms_deg_f, ms_deg_s, player.position.rot);

    // console.warn("M_DEG:", m_deg);
    // console.warn("MS_DEG_F:", ms_deg_f);
    // console.warn("MS_DEG_S:", ms_deg_s);
    // console.warn();

    player.position.lat += rotated.lat * time_diff;
    player.position.lon += rotated.lon * time_diff;
    
    player.position.alt += player.speed.kmh_h / 3.6 * time_diff;

    if (player.position.alt >= player.max_values.alt) {
        player.position.alt = player.max_values.alt;
    }

    // Steuerhebel bei Erreichen des Bodens zurücksetzen
    if (player.position.alt <= 0) {
        player.position.alt = 0;

        // player.speed.kmh_f  = 0;
        // player.speed.kmh_s  = 0;
        // player.speed.kmh_h  = 0;

        // player.flight_input.forward  = 0;
        // player.flight_input.sideward = 0;
        // player.flight_input.height   = 0;
        // player.flight_input.rotation = 0;
    }

    // Abstand zur Flagge prüfen
    if (player.playing && player.next_flag.data) {
        const distance = calc_distance(player.position, player.next_flag.data);

        if (distance.len <= 2) {
            player.captured_flags.push(player.next_flag.data.nam);

            player.next_flag.index += 1;

            if (player.next_flag.index >= flags.length) {
                // Keine nächste Flagge mehr
                player.all_flags = true;
                player.next_flag.index = -1;
            }

            player.next_flag.distance.d_len = 0;
            player.next_flag.distance.d_lat = 0;
            player.next_flag.distance.d_lon = 0;
            player.next_flag.distance.d_alt = 0;
            player.next_flag.distance.d_rot = 0;
            player.next_flag.data.lat       = 0;
            player.next_flag.data.lon       = 0;
            player.next_flag.data.alt       = 0;
            player.next_flag.data.nam       = "";
            player.next_flag.data.spk       = "";
        }
    }

    // Daten der Flagge ermitteln
    if (player.next_flag.index >= 0 && player.next_flag.index < flags.length) {
        const flag = flags[player.next_flag.index];

        player.next_flag.data.lat = flag.lat || 0;
        player.next_flag.data.lon = flag.lon || 0;
        player.next_flag.data.alt = flag.alt || 0;
        player.next_flag.data.nam = flag.nam || "";
        player.next_flag.data.spk = flag.spk || "";

        player.next_flag.distance = calc_distance(player.position, player.next_flag.data);
        player.next_flag.distance.rot = calc_angle_from_player(player.position, player.next_flag.data);
    }

    // Abstand zu den anderen Spielern berechnen
    player.nearest_players = [];

    for (const other_player of players.values()) {
        if (player === other_player) continue;

        const distance = calc_distance(player.position, other_player.position);
        if (distance.len > player.radar_sight_distance) continue;
        if (distance.alt > player.radar_sight_distance) continue;

        distance.id  = other_player.id;
        distance.nam = other_player.name;
        distance.rot = calc_angle_from_player(player.position, other_player.position);

        player.nearest_players.push(distance);

        // Kollisionsprüfung
        if (Math.abs(distance.len) <= 10 && Math.abs(distance.alt) <= 10) {
            player.playing = false;
            player.crashed = true;
            player.health  = 0;

            other_player.playing = false;
            other_player.crashed = true;
            other_player.health  = 0;
        }
    }

    player.nearest_players.sort((a, b) => {
        return a.len - b.len || a.alt - b.alt || a.rot - b.rot;
    });

    return player;
}

export default {flags, weapons, players, join_game, touch_player, leave_game, finish_game, change_flight_input, attack_other_player, update_player};