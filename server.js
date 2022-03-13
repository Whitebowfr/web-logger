const fs = require('fs')
var app = require('express')()

app.get("/", function (req, res) {
    res.sendFile(`${__dirname}/public/main.html`)
})

app.get("/getData", function(req, res) {
    fs.readFile(`${__dirname}/loggs.CSV`, "utf-8", function (err, data) {
        if (err) console.log("[ERROR] " + err)
        data = data.split("\n")
        data = [data[0]].concat(data.reverse().slice(0, 100).reverse())
        data = data.join("\n")
        data = data.replaceAll(/,+/gm, ",")
        let formatted = formatLogs(data, 100)
        res.send(JSON.stringify(formatted).replaceAll("�", "°"))
    })
})

app.get("/clearLogs", (req, res) => {
    cleanLogs()
        .catch(e => {res.status(500); res.end()})
        .then(sizes => {res.send(JSON.stringify(sizes)); res.end()})
})

app.get("/archiveLogs", (req, res) => {
    console.log("received")
    clearLogs(false)
        .then(dataReceived => {
        let newLogs = dataReceived[0]
        newLogs = newLogs.split("\n")
        newLogs.shift()
        newLogs = newLogs.join("\n")
        console.log("received logs")
        fs.readFile(`${__dirname}/logArchive.CSV`, "utf-8", function (err, data) {
            if (err) {res.status(500); res.end()}
            let lastLog = data.split("\n")[data.split("\n").length - 1]
            let newLogsSplitted = newLogs.split("\n")

            while(newLogsSplitted[0] < parseInt(lastLog.split(",")[1].replace(":", ""))) {
                newLogsSplitted.pop()
            }
        
            newLogs = newLogsSplitted.join("\n")
            
            if (newLogs.split("").length > 25) {
                data += newLogs
                fs.writeFile(`${__dirname}/logArchive.CSV`, data, (err, data) => {
                    if (err) {res.status(500); res.end()}
                    else {
                        dataReceived[1][0] = newLogs.split("\n").length
                        res.send(dataReceived[1])
                        res.status(200);
                        res.end()
                    }
                })
            } else {
                console.log("done")
                dataReceived[1][0] = 0
                res.send(dataReceived[1])
                res.status(200);
                res.end()
            }
        })
    });
})

async function cleanLogs() {
    return new Promise(function(resolve, reject) {
        clearLogs().then(data => {
            let newLogs = data[0]
            let sizes = data[1]
            fs.writeFile(`${__dirname}/loggs.CSV`, newLogs, (err, data) => {
                if (err) reject(err)
                else resolve(sizes)
            })
        });
    })
}

function formatLogs(logs, number) {
    let titles = logs.split("\n")[0].split(",")
    let result = []
    logs = logs.split("\n")
    for (let i = 0; i < number; i++) {
        if (logs.length - i > 0 && logs[logs.length - i]) {
            let currentLog = logs[logs.length - i]
            currentLog.split(",").forEach((el, index) => {
                if (!result[index]) {
                    result[index] = [el]
                } else {
                    result[index].push(el)
                }
                
            })
        }
    }
    let resultBis = {}
    titles.forEach((el, index) => {
        if (el != "") {
            el = el.replaceAll('\"', '')
            if ((el == "Read Rate [MB/s]" || el == "Write Activity [%]" || el == "Total Activity [%]") && resultBis[el]) {
                resultBis[el].map((x, ind) => Math.max(parseFloat(x), parseFloat(result[index][ind])))
            } else {
                resultBis[el] = result[index]
            }
        }
    })
    return resultBis
}

async function clearLogs(first100=true) {
    return new Promise(function(resolve, reject) {
        let result = ""
        fs.readFile(`${__dirname}/loggs.CSV`, "utf-8", function (err, data) {
            if (err) console.log("[ERROR] " + err)
            data = data.replaceAll(/,+/gm, ",")
            let index = 0
            let dataSplitted = data.split("\n")
            for (let index = 0; index < dataSplitted.length - (first100 ? 100 : 0); index += 30) {
                const element = dataSplitted[index];
                if (element) {
                    result += element
                    result += "\n"
                }
            }
            if (first100) {
                for (let index = 0; index < 100; index++) {
                    const element = dataSplitted.reverse()[index]
                    result += element
                    result += "\n"
                }
            }
            
            resolve([result, [result.split("\n").length, data.split("\n").length]])
        })
    })
    
}

app.listen(8004, () => {
    console.log("app listening on 8004")
})