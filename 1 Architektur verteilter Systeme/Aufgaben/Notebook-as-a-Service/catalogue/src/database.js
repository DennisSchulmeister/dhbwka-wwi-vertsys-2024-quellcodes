import {JSONFilePreset} from "lowdb/node";

// Default-Daten für unsere kleine Datenbank
const defaultData = {
    DeviceClass: [
        {id: 1, name: "Notebooks"},
        {id: 2, name: "Smartphones"},
    ],

    Device: [
        // Notebooks
        {id: 1, deviceClass: 1, manufacturer: "Lenovo", model: "Thinkpad E-Serie", buyingDate: "2024-01-20", imgageUrl: "img/thinkpad-e.png"},
        {id: 2, deviceClass: 1, manufacturer: "Lenovo", model: "Thinkpad X-Serie", buyingDate: "2024-01-22", imgageUrl: "img/thinkpad-x.png"},
        {id: 3, deviceClass: 1, manufacturer: "Sony",   model: "Vaio Z-Serie",     buyingDate: "2023-11-04", imgageUrl: "img/sony-vaio.jpg"},
        {id: 4, deviceClass: 1, manufacturer: "Asus",   model: "Zenbook Duo",      buyingDate: "2023-06-03", imgageUrl: "img/asus-zenbook.jpg"},

        // Smartphones
        {id: 5, deviceClass: 2, manufacturer: "Jolla",          model: "C",      buyingDate: "2023-10-09", imgageUrl: "img/jolla.jpg"},
        {id: 6, deviceClass: 2, manufacturer: "Apple",          model: "iPhone", buyingDate: "2023-08-10", imgageUrl: "img/iphone.jpg"},
        {id: 7, deviceClass: 2, manufacturer: "Samsung",        model: "Galaxy", buyingDate: "2023-05-24", imgageUrl: "img/samsung-galaxy.jpg"},
        {id: 8, deviceClass: 2, manufacturer: "Planet Devices", model: "Cosmo",  buyingDate: "2023-02-17", imgageUrl: "img/cosmo.jpg"},
    ],
};

// Datenbank-Objekt als Singleton
export const db = await JSONFilePreset("db.json", defaultData);
