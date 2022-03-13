# Web logger
This project was initially made to be used personally, but I ended up publishing it here because it may interest some people.
The goal was to be able to monitor a remote server without having to be in LAN, or to connect to this server remotely. What I initially did was using the remote monitoring thing from HWInfo, but I couldn't use it on my phone, which wasn't what I wanted.
There's probably lots of bugs in this project, but I'll try to fix them.
## Usage
#### Installing and launching the logger
First, you'll need to install HWInfo on the target PC.
Once this is done, you'll need to deactivate what you don't need to monitor (for this PC, I didn't monitor the graphics card because it isn't used). Be aware that the more you remove, the less space the logs will take.
Then, enable logging in HWInfo (you can set any interval of time you want, but 2 seconds is pretty good), and log to a file in the root folder of this project. HWInfo will start filling this CSV file with logs.
Go into the server.js file, and modify the lines 3 and 4 to the path of the logs file, and the path where you want the archived logs to be stored (You'll need to create the archive file first).

You can then launch the server.js file with node, and connect to it using the port specified line 5 (8004 by default).

#### Archiving the logs
The logs can get pretty big (around 13 MB per day for me, that's 4.5 GB/year), so you'll probably want to clean them every month or so. You can of course simply stop the monitoring, delete the log file and start the monitoring again, but I wanted to be able to get old logs. Of course, since I didn't need a precision of 2 seconds, I settled with storing a log per minute. This reduces the size of the logs by 30, and since it removes useless commas as well, I found it to be 1/40th of the logs original size. (this makes it 300 KB/day, or 110 MB/year).
To archive the logs, you can click on the "Archive Logs" button on the web page. Be aware that this will not delete the current logs, so you'll still need to turn off HWInfo logging, delete the logs file, and enable it again.
## Conclusion
If you want to help me or if you have any question, feel free to send me a DM on discord : **Whitebow#0749**
I'll probably keep updating this project, but I don't know for how long, since it already does what I want.
I was looking at something to limit the CPU usage of specific applications, but apparently it was only available on Linux, so I'll see if there's another way.