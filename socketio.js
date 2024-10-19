const option = {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        transport: ["websocket", "polling"],
        credential: true,
    }
}

const { log } = require("console");
// fs sync file envir data
const fs = require("fs");

let envirData = fs.readFileSync("envirData.json", "utf-8");
envirData = JSON.parse(envirData);
//watch file envir data
fs.watch("envirData.json", (event, filename) => {
    envirData = fs.readFileSync("envirData.json");
    envirData = JSON.parse(envirData);
});

const MAX_DATA_LENGTH = 3;

const tmpData = {
    tempC: [],
    humidity: [],
    eco2: [],
    tvoc: [],
    hTemp: [],
    hSpO2: [],
    hRate: [],
    // ir: [],
    aqi: [],
}

let tmpAvg = {
    tempC: 0,
    humidity: 0,
    eco2: 0,
    tvoc: 0,
    hTemp: 0,
    hSpO2: 0,
    hRate: 0,
    // ir: 0,
    aqi: 0,
}

const io = require("socket.io")(option);

const socketapi = {
    io: io
}


io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("message", (data) => {
        console.log(`Received data from ESP32: ${data}`);
        for (let key in data) {
            if (tmpData[key]) {
                tmpData[key].push(data[key]);
            }
        }

        // calculate average
        if (tmpData.tempC.length == MAX_DATA_LENGTH) {
            log("Calculating average data");
            for (let key in tmpData) {
                tmpAvg[key] = tmpData[key].reduce((a, b) => a + b, 0) / tmpData[key].length;
                tmpAvg[key] = Math.round(tmpAvg[key] * 100) / 100;
                tmpData[key] = [];
            }
            let newData = {
                id: envirData.length + 1,
                date: new Date().toISOString().slice(0, 10),
                time: new Date().toLocaleTimeString("en-US", { hourCycle: "h24" }),
                data: {
                    tempC: tmpAvg.tempC,
                    humidity: tmpAvg.humidity,
                    eco2: tmpAvg.eco2,
                    tvoc: tmpAvg.tvoc,
                    hTemp: tmpAvg.hTemp,
                    hSpO2: tmpAvg.hSpO2,
                    hRate: tmpAvg.hRate,
                    // ir: tmpAvg.ir,
                    aqi: tmpAvg.aqi,
                },
                location: data.location ? data.location : { "latitute": null, "longitute": null }
            }
            if (envirData) {
                envirData.push(newData);
                fs.writeFileSync("envirData.json", JSON.stringify(envirData));
            }
        }
        socket.broadcast.emit("/web/measure", data)
    })

    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
    socket.on("chat message", (msg) => {
        console.log("message: " + msg);
        io.emit("chat message", msg);
    });
});

module.exports = { socketapi, envirData };
