# Botty op e-paper

Toont een **live Botty** uit de hive op een **Waveshare 2.13inch e-Paper (B) V3**
(212×104, zwart/wit/rood) met een **Raspberry Pi Zero W**.

Elke **3 minuten** verschijnt een andere Botty (roterend). De data komt uit
dezelfde Supabase-database als de website — het zijn dus exact dezelfde Botty's
en dezelfde stats als op [hive.ramonmoorlag.nl](https://hive.ramonmoorlag.nl).

![voorbeeld](voorbeeld.png)

Getoond worden: naam, generatie (rood), levensfase + humeur (of **ziek** in rood),
en de vier balken **energie / data / fit / geluk**. Een balk die kritiek laag
staat (< 35 %) kleurt rood.

---

## 1. Hardware aansluiten

Steek de e-Paper HAT op de 40-pins header van de Pi Zero W (of sluit met de
meegeleverde kabel aan volgens de Waveshare-pinout). Zet **SPI** aan:

```bash
sudo raspi-config      # → Interface Options → SPI → Enable
sudo reboot
```

## 2. Waveshare-driver ophalen

De Waveshare Python-driver (`waveshare_epd`) zit niet op PyPI; die haal je uit
hun repo en zet je naast dit script:

```bash
cd ~
git clone https://github.com/waveshare/e-Paper.git
mkdir -p ~/botty-epaper
cp -r ~/e-Paper/RaspberryPi_JetsonNano/python/lib/waveshare_epd ~/botty-epaper/
```

> Belangrijk: dit script gebruikt het model **`epd2in13b_V3`**. Heb je een andere
> revisie, pas dan de regel `from waveshare_epd import epd2in13b_V3` in
> `botty_epaper.py` aan (bijv. `epd2in13b_V4`).

## 3. Dit programma installeren

```bash
cp botty_epaper.py requirements.txt botty-epaper.service ~/botty-epaper/
cd ~/botty-epaper
python3 -m pip install --break-system-packages -r requirements.txt
```

Op **Bookworm** gebruikt de driver `gpiozero`/`lgpio`; op **Bullseye** `RPi.GPIO`.
De `requirements.txt` installeert ze allebei — dat is prima.

## 4. Testen

```bash
cd ~/botty-epaper
python3 botty_epaper.py
```

Na een paar seconden verschijnt de eerste Botty. Stop met `Ctrl+C`.

## 5. Automatisch starten (systemd)

Zodat het bij opstart draait en blijft draaien:

```bash
sudo cp ~/botty-epaper/botty-epaper.service /etc/systemd/system/
# Controleer in het bestand of User=pi en de paden kloppen met jouw setup.
sudo systemctl daemon-reload
sudo systemctl enable --now botty-epaper.service
sudo systemctl status botty-epaper.service     # controleren
journalctl -u botty-epaper.service -f          # live log
```

---

## Aanpassen

Bovenin `botty_epaper.py`:

| Instelling | Betekenis |
|---|---|
| `REFRESH_SECONDS` | Ververstijd in seconden (standaard 180 = 3 minuten). |
| `LAAG_DREMPEL` | Onder dit percentage kleurt een balk rood (standaard 35). |

Wil je juist steeds **dezelfde** Botty? Vervang in `main()` de aanroep
`kies_volgende(bottys)` door het opzoeken van een vaste naam.

## Waarom 3 minuten?

E-paper ververst traag en het rood/zwart-paneel gaat langer mee bij minder
refreshes. Tussen twee refreshes zet het script het scherm in slaap
(`epd.sleep()`), wat stroom spaart — fijn op een Pi Zero W.
