#!/usr/bin/env python3
"""Otrapersona Bridge: one authorized launch, fixed receiver URL, no LAN server."""
import argparse
import ipaddress
import json
import pathlib
import sys
import time
import urllib.request
import urllib.error

ENDPOINT = "https://eqdhxepqsutufynonacr.supabase.co/functions/v1/otrapersona-bridge"
RECEIVER = "https://ngrr.github.io/Lab/tv/"
NETWORKS = tuple(ipaddress.ip_network(x) for x in ("10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"))

def api(action, **fields):
    req = urllib.request.Request(ENDPOINT, data=json.dumps({"action": action, **fields}).encode(),
                                 headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.load(response)
    except urllib.error.HTTPError as exc:
        try:
            reason = json.load(exc).get("error", "HTTP " + str(exc.code))
        except Exception:
            reason = "HTTP " + str(exc.code)
        raise RuntimeError(reason) from None

def launch(ip, token_file):
    from samsungtvws import SamsungTVWS
    tv = SamsungTVWS(host=ip, port=8002, token_file=str(token_file), timeout=30, name="Otrapersona Bridge")
    try:
        print("Enviando URL fija. Acepta la solicitud de acceso en la TV si aparece.", flush=True)
        tv.open_browser(RECEIVER)
    finally:
        try:
            tv.close()
        except Exception:
            pass

def main():
    parser = argparse.ArgumentParser(description="Abrir Otrapersona en un Samsung autorizado.")
    parser.add_argument("--ip", help="IP privada IPv4 del televisor")
    parser.add_argument("--local-test", action="store_true", help="Probar la apertura sin Supabase")
    args = parser.parse_args()
    ip = args.ip or input("IP del Samsung (Ajustes > Red > Estado de red): ").strip()
    try:
        addr = ipaddress.IPv4Address(ip)
        if not any(addr in n for n in NETWORKS):
            raise ValueError()
    except ValueError:
        parser.error("Indica una IP privada IPv4 de tu red doméstica.")
    folder = pathlib.Path.home() / ".otrapersona-bridge"
    folder.mkdir(mode=0o700, exist_ok=True)
    token_file = folder / ("samsung-" + str(addr) + ".token")
    if args.local_test:
        launch(str(addr), token_file)
        print("Orden enviada. Comprueba visualmente si la TV abrió Otrapersona.")
        return
    print("Creando una sesión de un solo uso...", flush=True)
    session = api("create")
    sid, token = session["id"], session["token"]
    code = session["code"]
    print("Código Bridge: " + "-".join(code[i:i+4] for i in range(0, 12, 4)), flush=True)
    print("En el teléfono: Otrapersona > Abrir navegador en TV. Vence en 5 minutos.", flush=True)
    deadline = time.monotonic() + 300
    requested = False
    try:
        while time.monotonic() < deadline:
            try:
                state = api("poll", id=sid, token=token)["state"]
            except (OSError, RuntimeError) as exc:
                if str(exc) == "not_found":
                    print("Sesión caducada.")
                    return
                time.sleep(3)
                continue
            if state == "requested":
                requested = True
                result = "failed"
                try:
                    launch(str(addr), token_file)
                    result = "sent"
                    print("Orden enviada; verifica la pantalla de la TV.", flush=True)
                except Exception as exc:
                    print("Falló el control local: " + type(exc).__name__ + ". Comprueba IP, red, TV encendida y autorización.", file=sys.stderr)
                # Do not resend the TV command if the acknowledgement fails.
                for _ in range(3):
                    try:
                        api("result", id=sid, token=token, result=result)
                        break
                    except (OSError, RuntimeError):
                        time.sleep(2)
                return
            time.sleep(2)
        print("Código caducado.")
    finally:
        if not requested:
            try:
                api("cancel", id=sid, token=token)
            except Exception:
                pass

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nBridge detenido.")
    except Exception as exc:
        print("Error: " + type(exc).__name__ + " — " + str(exc), file=sys.stderr)
        sys.exit(1)
