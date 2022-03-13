const fs = require('fs')
var app = require('express')()

const logsPath = `${__dirname}/loggs.CSV`
const archiveLogsPath = `${__dirname}/logArchive.CSV`
const appPort = 8004

app.get("/", function (req, res) {
    res.sendFile(`${__dirname}/public/main.html`)
})

app.get("/getData", function(req, res) {
    fs.readFile(logsPath, "utf-8", function (err, data) {
        if (err) console.log("[ERROR] " + err)
        data = data.split("\n")

        // Splicing here to optimize the filtering process
        data = [data[0]].concat(data.reverse().slice(0, 100).reverse())
        data = data.join("\n")

        // Filtering useless commas
        data = data.replaceAll(/,+/gm, ",")
        let formatted = formatLogs(data, 100)

        // For some reason JSON.stringify doesn't keep the degrees
        res.send(JSON.stringify(formatted).replaceAll("�", "°"))
    })
})

app.get("/archiveLogs", (req, res) => {
    console.log("received")
    clearLogs(false)
        .then(dataReceived => {
            let newLogs = dataReceived[0]

            // Removing the index line
            newLogs = newLogs.split("\n")
            newLogs.shift()
            newLogs = newLogs.join("\n")
            
            fs.readFile(archiveLogsPath, "utf-8", function (err, data) {
                if (err) {res.status(500); res.end()}
                let lastLog = data.split("\n")[data.split("\n").length - 1]
                let newLogsSplitted = newLogs.split("\n")

                // Removing duplicates logs
                while(newLogsSplitted[0] < parseInt(lastLog.split(",")[1].replace(":", ""))) {
                    newLogsSplitted.pop()
                }
            
                newLogs = newLogsSplitted.join("\n")
                
                // Checks if the new logs are empty
                if (newLogs.split("").length > 25) {
                    data += newLogs
                    fs.writeFile(archiveLogsPath, data, (err, data) => {
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

/**
 * @param {String} logs The logs extracted from the file
 * @param {?Int} number The number of logs returned (defaults to 100)
 * @returns {Object} An object containing arrays of logged values
 */
function formatLogs(logs, number) {
    let titles = logs.split("\n")[0].split(",")
    let result = []
    logs = logs.split("\n")

    // For each log requested
    for (let i = 0; i < number; i++) {
        
        // Checking if this log exists
        if (logs.length - i > 0 && logs[logs.length - i]) {
            let currentLog = logs[logs.length - i]

            // Looping trough all the logged values
            currentLog.split(",").forEach((el, index) => {

                // Checking if the logged category already exists
                if (!result[index]) {
                    result[index] = [el]
                } else {
                    result[index].push(el)
                }
                
            })
        }
    }

    // Converting the array of values to a JS object

    let resultBis = {}
    
    // Looping trough all the names of the logged values
    titles.forEach((el, index) => {
        if (el != "") {
            el = el.replaceAll('\"', '')
            if ((el == "Read Rate [MB/s]" || el == "Write Activity [%]" || el == "Total Activity [%]") && resultBis[el]) {
                // Since I have two drives, I take the most used one
                resultBis[el].map((x, ind) => Math.max(parseFloat(x), parseFloat(result[index][ind])))
            } else {
                resultBis[el] = result[index]
            }
        }
    })
    return resultBis
}

/**
 * 
 * @param {Boolean} [first100=true] Does the first 100 logs get kept or not
 * @returns {String|Number[]} Returns an array containing the cleared logs, the number of logs in the cleared logs, and the original number of logs.
 */
async function clearLogs(first100=true) {
    return new Promise(function(resolve, reject) {
        let result = ""
        fs.readFile(logsPath, "utf-8", function (err, data) {
            if (err) console.log("[ERROR] " + err)

            // Removing useless commas
            data = data.replaceAll(/,+/gm, ",")
            let dataSplitted = data.split("\n")

            // Gets 1 out of 30 logs
            for (let index = 0; index < dataSplitted.length - (first100 ? 100 : 0); index += 30) {
                const element = dataSplitted[index];
                if (element) {
                    result += element
                    result += "\n"
                }
            }

            // If the first 100 logs need to be kept, adding them to the result
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

app.listen(appPort, () => {
    console.log("app listening on " + appPort)
})