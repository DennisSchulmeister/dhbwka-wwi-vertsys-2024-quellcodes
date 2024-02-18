import {JSONFilePreset} from "lowdb/node";

// Default-Daten für unsere kleine Datenbank
const defaultData = {
    LendingRequest: [
        {
            id:           1,
            deviceId:     1,
            manufacturer: "Lenovo",
            model:        "Thinkpad E-Serie",
            startTime:    "2024-02-16",
            endTime:      "2024-02-23",
            status:       "LENDED",
            contactData:  "Max Mustermann, max.musternamm@example.com",
            location:     "Raum A367",
        },
    ],
};

// Datenbank-Objekt als Singleton
export const db = await JSONFilePreset("db.json", defaultData);
