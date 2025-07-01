import WebTorrent from "webtorrent";
import express from "express";
import cors from "cors";

const app = express();
const client = new WebTorrent({
  dht: true, // Enable peer discovery via DHT
});

app.use(cors());

app.get("/stream", (req, res) => {
  const magnet = decodeURIComponent(req.query.magnet || "").trim();
console.log(magnet)

  if (!magnet.startsWith("magnet:?xt=urn:btih:")) {
    return res.status(400).send("Invalid magnet link.");
  }

  const streamTorrent = (torrent) => {
    const file = torrent.files?.find((f) =>
      f.name.endsWith(".mp4") || f.name.endsWith(".mkv")
    );

    if (!file) return res.status(404).send("No video file found");

    res.setHeader("Content-Type", "video/mp4");
    file.createReadStream().pipe(res);
  };
console.log("🔍 Type of client.get:", typeof client.get);
  const existing = client.get(magnet);
  console.log(existing)

  if (existing) {
    if (existing.ready) {
      return streamTorrent(existing);
    } else if (typeof existing.once === "function") {
      return existing.once("ready", () => streamTorrent(existing));
    } else {
      return res.status(500).send("Torrent object invalid.");
    }
  }

  // If not already added
  client.add(
    magnet,
    {
      announce: [
        "udp://tracker.opentrackr.org:1337/announce",
        "udp://tracker.openbittorrent.com:6969/announce",
      ],
    },
    (torrent) => {
      if (typeof torrent.once !== "function") {
        return res.status(500).send("Failed to create valid torrent object.");
      }

      torrent.once("ready", () => streamTorrent(torrent));
    }
  );
});



const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
