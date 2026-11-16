import json
import urllib.request
import urllib.error
import urllib.parse

URL = "https://eqdhxepqsutufynonacr.supabase.co/functions/v1/otrapersona-bridge"

def api(action, origin=False, **fields):
    headers = {"Content-Type": "application/json"}
    if origin:
        headers["Origin"] = "https://ngrr.github.io"
    req = urllib.request.Request(URL, data=json.dumps({"action": action, **fields}).encode(), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            if origin:
                assert resp.headers.get("Access-Control-Allow-Origin") == headers["Origin"]
            return json.load(resp)
    except urllib.error.HTTPError as e:
        return json.load(e)

s = api("create")
assert "id" in s, s.get("error")
d = {"id": s["id"], "token": s["token"]}
try:
    assert api("poll", **d)["state"] == "waiting"
    p = api("open", True, code=s["code"])
    assert p["state"] == "requested"
    assert api("open", True, code=s["code"])["error"] == "not_found"
    assert api("poll", id=s["id"], token="0"*64)["error"] == "not_found"
    assert api("poll", **d)["state"] == "requested"
    assert api("result", **d, result="sent")["state"] == "sent"
    assert api("status", True, id=p["id"], token=p["token"])["state"] == "sent"
    print("Bridge HTTPS: one-shot launch, token isolation, acknowledgement and CORS verified (mock television).")
finally:
    api("cancel", **d)
