import {JSONFilePreset} from "lowdb/node";

// Default-Daten für unsere kleine Datenbank
const defaultData = {
    LogEntries: [
        {
            "starDate": "49762.3",
            "text": "Die Crew hat erfolgreich eine neue Klasse-M-Welt kartografiert. Keine Anzeichen von intelligentem Leben gefunden."
        },
        {
            "starDate": "49812.7",
            "text": "Ein unbekanntes Signal aus dem Delta-Quadranten erreicht uns. Die Herkunft bleibt rätselhaft."
        },
        {
            "starDate": "49901.5",
            "text": "Erste Kontakte mit einer neuen Spezies namens Xelari hergestellt. Ihre Technologie übertrifft unsere Erwartungen."
        },
        {
            "starDate": "50023.8",
            "text": "Ein unerwarteter Energieausfall in der Warpkern-Kammer führte zu einer kurzfristigen Evakuierung."
        },
        {
            "starDate": "50110.4",
            "text": "Die Sternenflotte hat uns neue Befehle erteilt. Wir sollen eine verlassene Raumstation im Grenzsektor untersuchen."
        },
        {
            "starDate": "50289.2",
            "text": "Unsere Langstreckensensoren haben eine Anomalie entdeckt, die möglicherweise ein Wurmloch sein könnte."
        },
        {
            "starDate": "50345.9",
            "text": "Ein Notruf einer Frachter-Crew wurde empfangen. Wir setzen Kurs, um Hilfe zu leisten."
        },
        {
            "starDate": "50478.3",
            "text": "Die medizinische Abteilung hat ein Heilmittel für eine seltene interstellare Krankheit entwickelt."
        },
        {
            "starDate": "50567.1",
            "text": "Unsere Diplomaten haben ein Friedensabkommen mit den Torkani verhandelt."
        },
        {
            "starDate": "50623.4",
            "text": "Ein unerwarteter Angriff von unbekannten Schiffen hat unsere Schilde schwer beschädigt. Notfallprotokolle aktiviert."
        },
        {
            "starDate": "50712.5",
            "text": "Wir haben einen ersten Kontakt mit einer außerirdischen Lebensform, die in den Nebeln des Sektors lebt."
        },
        {
            "starDate": "50891.8",
            "text": "Ein neues Mitglied ist unserer Crew beigetreten. Ihre Expertise in Quantenmechanik könnte von unschätzbarem Wert sein."
        },
        {
            "starDate": "50957.4",
            "text": "Ein Experiment mit der Holodeck-Technologie hat unerwartete Nebenwirkungen verursacht. Systeme werden neu kalibriert."
        },
        {
            "starDate": "51045.6",
            "text": "Unsere Sensoren haben ein verlassenes Schiff im Orbit eines unbekannten Planeten entdeckt."
        },
        {
            "starDate": "51199.3",
            "text": "Die Mission zur Erforschung eines Neutronensterns war erfolgreich. Neue Erkenntnisse über seine Strahlung wurden gesammelt."
        }
    ],
};

// Datenbank-Objekt als Singleton
export const db = await JSONFilePreset("db.json", defaultData);
