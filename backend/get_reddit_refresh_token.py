import os
import random
import socket
import string
import threading
import json
import time
import urllib.parse
import requests
import webbrowser
from dotenv import load_dotenv
from http.server import HTTPServer, BaseHTTPRequestHandler

# Load values from .env into environment
load_dotenv()

CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI", "http://localhost:8080/callback")
SCOPES = ["identity", "read"]

AUTH_BASE = "https://www.reddit.com/api/v1/authorize"
TOKEN_URL = "https://www.reddit.com/api/v1/access_token"
USER_AGENT = "refresh-token-helper/1.0 by your_username"

def _random_state(n=24):
    alphabet = string.ascii_letters + string.digits
    return "".join(random.choice(alphabet) for _ in range(n))

def _find_free_port(preferred=8080):
    try:
        with socket.socket() as s:
            s.bind(("127.0.0.1", preferred))
            return preferred
    except OSError:
        s = socket.socket()
        s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]
        s.close()
        return port

class _OAuthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path != "/callback":
            self.send_response(404); self.end_headers()
            self.wfile.write(b"Not Found")
            return

        query = urllib.parse.parse_qs(parsed.query)
        self.server.auth_code = query.get("code", [None])[0]
        self.server.returned_state = query.get("state", [None])[0]
        self.server.error = query.get("error", [None])[0]

        self.send_response(200)
        self.end_headers()
        msg = (
            "<h1>Success</h1>"
            "<p>You can close this tab and return to the script.</p>"
        )
        self.wfile.write(msg.encode("utf-8"))

    def log_message(self, *args, **kwargs):
        pass

def main():
    # --- sanity checks ---
    if not CLIENT_ID or not CLIENT_SECRET:
        raise SystemExit("Missing CLIENT_ID or CLIENT_SECRET (check your .env).")
    if not REDIRECT_URI:
        raise SystemExit("Missing REDIRECT_URI in .env")

    # Use the redirect EXACTLY as saved in your Reddit app (no changes)
    redirect_uri = REDIRECT_URI.strip()

    # Parse the port from that URI and start the local server on the SAME port
    parsed = urllib.parse.urlparse(redirect_uri)
    if parsed.scheme != "http":
        raise SystemExit("Use http:// for localhost redirect URIs.")
    if parsed.hostname not in ("localhost", "127.0.0.1"):
        raise SystemExit("Redirect host must be localhost or 127.0.0.1.")
    if parsed.path != "/callback":
        raise SystemExit('Redirect path must be exactly "/callback".')
    port = parsed.port or 80  # should be 8080 for http://localhost:8080/callback

    try:
        httpd = HTTPServer(("127.0.0.1", port), _OAuthHandler)
    except OSError as e:
        raise SystemExit(
            f"Cannot bind to port {port}. Close anything using it, or change "
            f"REDIRECT_URI in .env AND in your Reddit app to the same new port."
        ) from e

    # Prepare to capture the callback
    httpd.auth_code = None
    httpd.returned_state = None
    httpd.error = None

    # Build the authorize URL (redirect_uri MUST match exactly)
    state = _random_state()
    params = {
        "client_id": CLIENT_ID,
        "response_type": "code",
        "state": state,
        "redirect_uri": redirect_uri,
        "duration": "permanent",            # required to receive a refresh_token
        "scope": " ".join(SCOPES),
    }
    authorize_url = f"{AUTH_BASE}?{urllib.parse.urlencode(params)}"

    print("Opening browser to:\n", authorize_url, "\n")

    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    webbrowser.open(authorize_url)

    print("Waiting for Reddit to redirect back to", redirect_uri)
    try:
        while httpd.auth_code is None and httpd.error is None:
            time.sleep(0.1)  # avoid busy-wait
    finally:
        httpd.shutdown()

    if httpd.error:
        raise SystemExit(f"Authorization error: {httpd.error}")
    if httpd.returned_state != state:
        raise SystemExit("State mismatch — aborting (possible CSRF).")

    print("Got authorization code. Exchanging for tokens...")

    # Exchange the code for tokens (redirect_uri MUST match exactly here too)
    auth = requests.auth.HTTPBasicAuth(CLIENT_ID, CLIENT_SECRET)
    data = {
        "grant_type": "authorization_code",
        "code": httpd.auth_code,
        "redirect_uri": redirect_uri,
    }
    headers = {"User-Agent": USER_AGENT}
    resp = requests.post(TOKEN_URL, auth=auth, data=data, headers=headers, timeout=30)
    resp.raise_for_status()
    tokens = resp.json()

    refresh = tokens.get("refresh_token")
    access = tokens.get("access_token")

    print("\n=== TOKENS ===")
    print("access_token :", access)
    print("refresh_token:", refresh)
    print("expires_in   :", tokens.get("expires_in"))
    print("scope        :", tokens.get("scope"))

    # Save the refresh token locally
    out = {
        "client_id": CLIENT_ID,
        "client_secret": "<<< not saved >>>",
        "redirect_uri": redirect_uri,
        "scopes": SCOPES,
        "refresh_token": refresh,
        "obtained_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
    }
    with open("reddit_tokens.json", "w") as f:
        json.dump(out, f, indent=2)
    print('\nSaved refresh token to "reddit_tokens.json" (keep this SECRET).')

    print("\nTo refresh later:")
    print("curl -u {}:{} -d 'grant_type=refresh_token&refresh_token={}' {}".format(
        CLIENT_ID, "YOUR_CLIENT_SECRET", refresh, TOKEN_URL
    ))

if __name__ == "__main__":
    main()
