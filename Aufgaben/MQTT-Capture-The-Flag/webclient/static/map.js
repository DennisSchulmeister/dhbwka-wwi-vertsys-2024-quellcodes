const DEFAULT_ZOOM = 15;

/**
 * Klasse zur Steuerung der Karten-Ansicht.
 */
class MyMap {
    /**
     * Konstruktor.
     * 
     * @param {string} mapSelector CSS-Selektor für das HTML-Elternelement der Karte
     */
    constructor(mapSelector) {
        const mapElement  = document.querySelector(mapSelector);
        const centerPoint = ol.proj.transform([8.385901, 49.026489], "EPSG:4326", "EPSG:3857");

        this.markerLayer = new ol.layer.Vector({
            source: new ol.source.Vector({})
        });

        this.map = new ol.Map({
            target: mapElement,

            view: new ol.View({center: centerPoint, zoom: DEFAULT_ZOOM}),

            layers: [
                new ol.layer.Tile({source: new ol.source.OSM()}),
                this.markerLayer,
            ]
        });

        this.following = false;
    }

    /**
     * Event Handler Funktion registrieren
     * 
     * @param {string} event Event-Name, z.B. "click"
     * @param {Function} callback Aufzurufende Callback-Funktion
     */
    on(event, callback) {
        this.map.on(event, callback);
    }

    /**
     * Alle Markierungen auf der Karte löschen.
     */
    reset() {
        this.markerLayer.getSource().clear();
    }

    /**
     * Marker-Objekt eines Spielers ermitteln, falls es existiert.
     *
     * @param {string} playerId ID des Spielers
     * @returns Marker-Objekt oder `undefined`
     */
    getPlayerMarker(playerId) {
        let marker = this.markerLayer.getSource().getFeatureById(`PLAYER: ${playerId}`);
        return marker;
    }

    /**
     * Marker-Objekt einer Flagge ermitteln, falls es existiert.
     * 
     * @param {number} flagId ID der Flagge
     * @returns Marker-Objekt oder `undefined`
     */
    getFlagMarker(flagId) {
        let marker = this.markerLayer.getSource().getFeatureById(`FLAG: ${flagId}`);
        return marker;
    }

    /**
     * Spieler von der Karte entfernen.
     * @param {string} playerId ID des Spielers
     */
    removePlayer(playerId) {
        const marker = this.getPlayerMarker(playerId);
        if (marker === null) return;

        this.markerLayer.getSource().removeFeature(marker);
    }

    /**
     * Position einer Flagge setzen/ändern.
     * 
     * @param {number} flagId ID der Flagge
     * @param {object} position Longitude und Latitude
     */
    setFlagPosition(flagId, position) {
        const lonLat = [position.lon, position.lat];
        const marker = this.getFlagMarker(flagId);
        const point  = new ol.geom.Point(ol.proj.transform(lonLat, "EPSG:4326", "EPSG:3857"));

        if (marker !== null) {
            marker.setGeometry(point);
            marker.changed();
        } else {
            const marker = new ol.Feature({geometry: point});

            marker.setStyle([
                new ol.style.Style({
                    image: new ol.style.Icon({
                        opacity: 1,
                        src: "img/flag.png",
                        scale: 0.1,
                    }),
                }),
            ]);

            marker.setId(`FLAG: ${flagId}`);
            this.markerLayer.getSource().addFeature(marker);

            marker.changed();
        }
    }

    /**
     * Position eines Spielers setzen/ändern
     *
     * @param {object} player Spielerdaten vom Game-Master
     * @param {boolean} highlight Spielfigur farblich hervorheben
     */
    setPlayerPosition(player, highlight) {
        const name    = player.name || player.id || "Unbekannter Spieler";
        const rot_deg = (player?.position?.rot || 0);
        const rot_rad = rot_deg * Math.PI / 180;
        let image_url;

        if (player.crashed) {
            image_url = "img/explosion.svg";
        } else if (rot_deg <= 180) {
            image_url = highlight ? "img/player-other.png" : "img/player-self.png";
        } else {
            image_url = highlight ? "img/player-other1.png" : "img/player-self1.png";
        }

        const lonLat = [player?.position?.lon || 0, player?.position?.lat || 0];
        const marker = this.getPlayerMarker(player.id);
        const point  = new ol.geom.Point(ol.proj.transform(lonLat, "EPSG:4326", "EPSG:3857"));
    
        if (marker !== null) {
            marker.setGeometry(point);
            marker.changed();

            marker.getStyle()[0].getText().setText(name);
            marker.getStyle()[0].setImage(new ol.style.Icon({
                // anchor: [0.5, 1.2],
                // anchorXUnits: "fraction",
                // anchorYUnits: "fraction",
                opacity: 1,
                src: image_url,
                scale: 0.1,
                rotation: rot_rad,
                rotateWithView: true,
            }));
        } else {
            const marker = new ol.Feature({geometry: point});

            marker.setStyle([
                // Drehung
                new ol.style.Style({
                    image: new ol.style.Icon({
                        // anchor: [0.5, 1.2],
                        // anchorXUnits: "fraction",
                        // anchorYUnits: "fraction",
                        opacity: 1,
                        src: image_url,
                        scale: 0.1,
                        rotation: rot_rad,
                        rotateWithView: true,
                    }),
                    text: new ol.style.Text({
                        text: name,
                        font: 'bold 20px "Open Sans", "Arial Unicode MS", "sans-serif"',
                        fill: new ol.style.Fill({
                            color: "black"
                        }),
                        stroke: new ol.style.Stroke({
                            color: 'white', width: 2
                        })
                    }),
                }),
            ]);

            marker.setId(`PLAYER: ${player.id}`);
            this.markerLayer.getSource().addFeature(marker);
        }
    }

    /**
     * Kartenmittelpunkt, Rotation und Zoomlevel setzen, um den übergebenen Spieler zu verfolgen.
     * @param {object} player Spielerdaten vom Game-Master
     */
    followPlayer(player) {
        const view = this.map.getView();

        const lonLat = [player?.position?.lon || 0, player?.position?.lat || 0];
        const centerPoint = ol.proj.transform(lonLat, "EPSG:4326", "EPSG:3857");
        view.setCenter(centerPoint);

        // const rot_rad = (player?.position?.rot || 0) * Math.PI / 180;
        // view.setRotation(rot_rad);

        const alt = (player?.position?.alt || 0);
        const zoom = linearMap(alt, 0, 500, 15, 5);
        view.setZoom(zoom);

        this.following = true;
    }

    /**
     * Karte auf Standardwerte zurücksetzen, um keinem Spieler mehr zu folgen.
     */
    unfollowPlayer() {
        if (!this.following) return;

        const view = this.map.getView();
        // view.setRotation(0);
        view.setZoom(DEFAULT_ZOOM);

        this.following = false;
    }
}


function linearMap(x, xMin, xMax, yMin, yMax) {
    return (x - xMin) * ((yMax - yMin) / (xMax - xMin)) + yMin;
}
