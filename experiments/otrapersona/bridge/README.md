# Otrapersona Bridge — prueba Samsung Tizen

Requiere un PC (Windows, macOS o Linux) en la misma red local que la TV encendida y Python 3.10+. El iPhone puede utilizar LTE. No abrir puertos del router.

**1.** Descarga `bridge.py` desde esta carpeta y abre una terminal allí. Instala la dependencia en un entorno virtual:

Windows PowerShell:
```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install samsungtvws==3.0.7
.\.venv\Scripts\python.exe bridge.py --local-test
```

macOS/Linux:
```bash
python3 -m venv .venv
.venv/bin/python -m pip install samsungtvws==3.0.7
.venv/bin/python bridge.py --local-test
```

Introduce la IP privada del Samsung (Ajustes > Red > Estado de red > Configuración IP). Acepta en la pantalla la autorización del control remoto si el televisor la solicita. Verifica que abra Otrapersona sin escribir URL. El método samsungtvws.open_browser utiliza org.tizen.browser; el firmware puede ignorar la URL o la apertura. El puerto 8002 usa el protocolo local del fabricante y su autorización. No expongas ese puerto a Internet.

**2.** Si funciona, repite el comando de ejecución sin `--local-test`. Copia el código temporal mostrado en el PC al teléfono: Otrapersona > Conectar a TV por Internet > Abrir navegador en TV · Bridge. Pulsa Abrir en TV.

**3.** Si abre el receptor, pulsa Activar receptor y reproducir en el TV; para controlar desde el teléfono vincula con el código Connect que aparece en pantalla. El navegador podría exigir este gesto local. Bridge no enciende el TV.

Seguridad: solo URL fija de Otrapersona; una petición por sesión, código aleatorio de 48 bits que expira a los cinco minutos, tokens de 256 bits independientes por rol; hash de tokens en DB, HTTPS, límite global de 30 sesiones activas. No hay ejecución arbitraria de comandos, acceso a otras aplicaciones ni servidor abierto en el PC. El token de autorización Samsung se guarda solamente en ~/.otrapersona-bridge/. Mantenerlo privado. El límite global mitiga capacidad pero no elimina abuso del endpoint público. El estado "enviado" indica envío del comando, no confirmación visual del televisor. La biblioteca local es una integración no oficial, no una garantía de Samsung.

Fuente: https://github.com/xchwarze/samsung-tv-ws-api
