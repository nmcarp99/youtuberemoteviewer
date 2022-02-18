const fs = require("fs");
const ytdl = require("ytdl-core");
const express = require("express");
const findRemoveSync = require("find-remove");
const path = require("path");
const app = express();
const port = process.env.PORT;

var createdVideos = {};

setInterval(() => {
  console.log(createdVideos);
  var results = findRemoveSync(path.join(__dirname, "videos"), {
    age: { seconds: 3600000 },
    extensions: ".mp4",
  });
  
  if (Object.keys(results).length > 0) {
    console.log("Ran File Purge; Deleted Files: \n" + Object.keys(results));
  }
  
  Object.entries(createdVideos).forEach(([video_id, video_data]) => {
    if (video_data.status == 1) {
      delete createdVideos[video_id];
    }
  });
  
  fs.readdir(path.join(__dirname, "videos"), (err, files) => {
    if (err) {
      console.log("Error scanning directory: " + err);
    }
    
    files.forEach(file => {
      var video_id = path.basename(file, '.mp4');
      
      createdVideos[video_id] = {
        status: 1
      };
    });
  });
}, 300000);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/v/*", (req, res) => {
  var video_id = req.url.split("/")[2];

  var video_path = __dirname + "/videos/" + video_id + ".mp4";

  if (createdVideos[video_id]) {
    if (createdVideos[video_id].status == 1) {
      res.sendFile(video_path);
      return;
    }
  } else {
    var video = ytdl("https://www.youtube.com/watch?v=" + video_id, {
      quality: "highest",
    });

    createdVideos[video_id] = {
      status: 0
    };
    
    video.on("finish", () => {
      createdVideos[video_id].status = 1;
    });

    video.pipe(fs.createWriteStream("videos/" + video_id + ".mp4"));
  }

  res.sendFile(__dirname + "/client.html");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
