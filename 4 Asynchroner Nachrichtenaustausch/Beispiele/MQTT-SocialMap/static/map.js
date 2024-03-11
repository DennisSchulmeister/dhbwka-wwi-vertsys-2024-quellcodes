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

            view: new ol.View({center: centerPoint, zoom: 15}),

            layers: [
                new ol.layer.Tile({source: new ol.source.OSM()}),
                this.markerLayer,
            ]
        });
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
     * Eigenes Marker-Objekt ermitteln, falls es bereits auf der Karte existiert.
     * @returns Marker-Objekt oder `undefined`
     */
    getOwnMarker() {
        let marker = this.markerLayer.getSource().getFeatureById("SELF");
        return marker;
    }

    /**
     * Marker-Objekt eines fremden Avatars ermitteln, falls es bereits auf der Karte existiert.
     * 
     * @param {string} realname Realname des Avatars
     * @returns Marker-Objekt oder `undefined`
     */
    getOtherMarker(realname) {
        let marker = this.markerLayer.getSource().getFeatureById(`OTHER: ${realname}`);
        return marker;
    }

    /**
     * Eigene Position ändern.
     * 
     * @param {string} realname Eigener Realname
     * @param {number[]} lonLat Longitude und Latitude
     */
    setOwnPosition(realname, lonLat) {
        const marker = this.getOwnMarker();
        const point  = new ol.geom.Point(ol.proj.transform(lonLat, "EPSG:4326", "EPSG:3857"));
    
        if (marker !== null) {
            marker.setGeometry(point);
            marker.changed();
        } else {
            const marker = new ol.Feature({geometry: point});

            marker.setStyle([
                new ol.style.Style({
                    image: new ol.style.Icon({
                        anchor: [0.5, 1.2],
                        anchorXUnits: "fraction",
                        anchorYUnits: "fraction",
                        opacity: 1,
                        src: "avatar-self.svg",
                        scale: 0.1,
                    }),
                    text: new ol.style.Text({
                        text: realname,
                        font: 'bold 20px "Open Sans", "Arial Unicode MS", "sans-serif"',
                        fill: new ol.style.Fill({
                            color: "black"
                        }),
                        stroke: new ol.style.Stroke({
                            color: 'white', width: 2
                        })
                    }),
                }),

                new ol.style.Style({
                    text: new ol.style.Text({
                        offsetY: 22,
                        text: "",
                        font: '16px "Open Sans", "Arial Unicode MS", "sans-serif"',
                        fill: new ol.style.Fill({
                            color: "black"
                        }),
                        stroke: new ol.style.Stroke({
                            color: 'white', width: 1
                        })
                    }),
                }),
            ]);

            marker.setId("SELF");
            this.markerLayer.getSource().addFeature(marker);
        }
    }
    

    /**
     * Position eines fremden Avatars ändern.
     * 
     * @param {string} realname Realname des Avatars
     * @param {number[]} lonLat Longitude und Latitude
     */
    setOtherPosition(realname, lonLat) {
        const marker = this.getOtherMarker(realname);
        const point = new ol.geom.Point(ol.proj.transform(lonLat, "EPSG:4326", "EPSG:3857"));
        
        if (marker !== null) {
            marker.setGeometry(point);
            marker.changed();
        } else {
            const marker = new ol.Feature({geometry: point});

            marker.setStyle([
                new ol.style.Style({
                    image: new ol.style.Icon({
                        anchor: [0.5, 1.2],
                        anchorXUnits: "fraction",
                        anchorYUnits: "fraction",
                        opacity: 1,
                        src: "avatar-other.svg",
                        scale: 0.8,
                    }),
                    text: new ol.style.Text({
                        text: realname,
                        font: 'bold 20px "Open Sans", "Arial Unicode MS", "sans-serif"',
                        fill: new ol.style.Fill({
                            color: "black"
                        }),
                        stroke: new ol.style.Stroke({
                            color: 'white', width: 2
                        })
                    }),
                }),

                new ol.style.Style({
                    text: new ol.style.Text({
                        offsetY: 22,
                        text: "",
                        font: '16px "Open Sans", "Arial Unicode MS", "sans-serif"',
                        fill: new ol.style.Fill({
                            color: "black"
                        }),
                        stroke: new ol.style.Stroke({
                            color: 'white', width: 1
                        })
                    }),
                }),
            ]);
            marker.setId(`OTHER: ${realname}`);
            this.markerLayer.getSource().addFeature(marker);
        }
    }

    /**
     * Eigenen Statustext aktualisieren.
     * @param {string} status Statustext
     */
    setOwnStatus(status) {
        const marker = this.getOwnMarker();
        if (marker === null) return;

        marker.getStyle()[1].getText().setText(status);
        marker.changed();
    }

    /**
     * Statustext eines fremden Avatars aktualisieren.
     * 
     * @param {string} realname Realname des Avatars
     * @param {string} status Statustext
     */
    setOtherStatus(realname, status) {
        const marker = this.getOtherMarker(realname);
        if (marker === null) return;

        marker.getStyle()[1].getText().setText(status);
        marker.changed();
    }

    /**
     * Fremdem Avatar entfernen.
     * @param {string} realname Realname des Avatars
     */
    removeOther(realname) {
        const marker = this.getOtherMarker(realname);
        if (marker === null) return;

        this.markerLayer.getSource().removeFeature(marker);
    }
}
