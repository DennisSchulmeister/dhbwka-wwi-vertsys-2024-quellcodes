import {Say} from "say";

/**
 * Hilfsklasse zur Steuerung der Sprachausgabe. Verschalt die `Say`-Klasse
 * der gleichnamigen Bibliothek, um die gleichzeitige Ausgabe mehrerer Texte
 * zu vermeiden. Die Texte werden von dieser Klasse daher in einer kleinen
 * FIFO-Wartschlange gesammelt und nacheinander vorgelesen.
 */
export class Speach {
    /**
     * Konstruktor.
     */
    constructor() {
        this._say      = new Say();
        this._queue    = []
        this._speaking = false;

        this._interval = setInterval(() => {
            if (this._queue.length > 0 && !this._speaking) {
                let text = this._queue.pop();
                this._speaking = true;
                this._say.speak(text, null, null, () => this._speaking = false);
            }
        }, 500);
    }

    /**
     * Thread beenden.
     */
    quit() {
        clearInterval(this._interval);
    }

    /**
     * Zu sprechenden Text der Warteschlange hinzufügen
     */
    say(text) {
        this._queue.push(text);
    }

    /**
     * Aktuellen Inhalt der Wartschlange zurückliefern.
     */
    get queue() {
        return this._queue;
    }

    /**
     * Flag zurückliefern, ob die Sprachausgabe gerade aktiv ist.
     */
    get speaking() {
        return this._speaking;
    }
}
