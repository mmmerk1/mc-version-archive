import json
import os
import urllib.parse
import urllib.request

from flask import Flask, jsonify, request, send_from_directory

ROOT = os.path.dirname(os.path.abspath(__file__))
UPSTREAM = "http://bbk.endyun.ltd:9000/api"
DATA_FILE = os.path.join(ROOT, "data-versions.js")

app = Flask(__name__, static_folder=None)


def load_snapshot():
    with open(DATA_FILE, encoding="utf-8") as f:
        raw = f.read()
    raw = raw.split("=", 1)[1].strip().rstrip(";")
    return json.loads(raw)


def upstream(path, data=None, method="POST"):
    if method == "GET":
        url = UPSTREAM + path + "?" + urllib.parse.urlencode(data or {})
        req = urllib.request.Request(url)
    else:
        req = urllib.request.Request(UPSTREAM + path, data=urllib.parse.urlencode(data or {}).encode(),
                                     headers={"Content-Type": "application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req, timeout=12) as r:
        return json.loads(r.read().decode("utf-8"))


def normalize(msg):
    out = []
    for it in msg or []:
        lk = it.get("link") or {}
        keep = {}
        for m in ("123云盘", "OneDrive", "夸克网盘"):
            o = lk.get(m)
            if isinstance(o, dict):
                keep[m] = [o.get("ARMv7") or "", o.get("ARMv8") or ""]
        out.append({
            "a": it.get("version_all"),
            "v": it.get("version"),
            "d": (it.get("update_time") or "")[:10],
            "s": it.get("file_size") or "",
            "b": int(it.get("is_beta") or 0),
            "l": keep,
        })
    return out


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "versions": len(app.config.get("SNAPSHOT") or []), "upstream": UPSTREAM})


@app.get("/api/versions")
def api_versions():
    return jsonify({"ok": True, "source": "snapshot", "versions": app.config.get("SNAPSHOT") or []})


@app.get("/api/search")
def api_search():
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify({"ok": False, "error": "缺少 q"}), 400
    try:
        msg = upstream("/search_version", {"s": q, "m": 1, "b": 2}, method="GET").get("message") or []
        return jsonify({"ok": True, "source": "upstream", "versions": normalize(msg)})
    except Exception as e:
        snap = app.config.get("SNAPSHOT") or []
        hit = [v for v in snap if q in v["v"] or q in v["a"]]
        return jsonify({"ok": True, "source": "snapshot", "error": str(e), "versions": hit})


@app.get("/api/last")
def api_last():
    try:
        msg = upstream("/last_version", {"b": "0"}).get("message") or []
        return jsonify({"ok": True, "source": "upstream", "versions": normalize(msg)})
    except Exception as e:
        snap = sorted(app.config.get("SNAPSHOT") or [], key=lambda v: v["d"], reverse=True)[:4]
        return jsonify({"ok": True, "source": "snapshot", "error": str(e), "versions": snap})


@app.get("/")
def index():
    return send_from_directory(ROOT, "index.html")


@app.get("/<path:name>")
def static_file(name):
    if name.startswith(".") or "/" in name:
        return ("Not Found", 404)
    path = os.path.join(ROOT, name)
    if not os.path.isfile(path):
        return ("Not Found", 404)
    return send_from_directory(ROOT, name)


app.config["SNAPSHOT"] = load_snapshot()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
