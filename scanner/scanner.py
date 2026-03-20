"""
Babel - RFID Scanner
Runs on Raspberry Pi with PN532 module over I2C.
Reads tag UIDs and posts them to the backend API.
"""

import time
import board
import busio
import requests
import os
from adafruit_pn532.i2c import PN532_I2C
from dotenv import load_dotenv

load_dotenv()

BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:3001')
SCAN_ENDPOINT = f'{BACKEND_URL}/api/rfid/scan'
RETRY_DELAY = 5  # seconds to wait before retrying if reader init fails


def init_reader():
    """Initialise the PN532 over I2C."""
    i2c = busio.I2C(board.SCL, board.SDA)
    pn532 = PN532_I2C(i2c, debug=False)
    ic, ver, rev, _ = pn532.firmware_version
    print(f'PN532 ready — firmware {ver}.{rev}')
    pn532.SAM_configuration()
    return pn532


def format_uid(uid: bytes) -> str:
    """Format UID bytes as a colon-separated hex string e.g. 0x94:0x84:0x62:0x6"""
    return ':'.join([hex(i) for i in uid])


def post_scan(uid: str) -> bool:
    """
    Post a scanned UID to the backend.
    Returns True on success, False on failure.
    """
    try:
        response = requests.post(
            SCAN_ENDPOINT,
            json={'uid': uid},
            timeout=5
        )

        if response.status_code == 200:
            print(f'Scan posted successfully: {uid}')
            return True
        elif response.status_code == 404:
            print(f'Tag not registered to any account: {uid}')
            return False
        else:
            print(f'Unexpected response {response.status_code}: {response.text}')
            return False

    except requests.exceptions.ConnectionError:
        print(f'Could not reach backend at {BACKEND_URL} — is the server running?')
        return False
    except requests.exceptions.Timeout:
        print('Backend request timed out')
        return False
    except Exception as e:
        print(f'Unexpected error posting scan: {e}')
        return False


def main():
    print('Babel RFID Scanner starting...')

    # Initialise reader with retry loop in case of hardware issues
    pn532 = None
    while pn532 is None:
        try:
            pn532 = init_reader()
        except Exception as e:
            print(f'Failed to initialise PN532: {e}')
            print(f'Retrying in {RETRY_DELAY}s...')
            time.sleep(RETRY_DELAY)

    print(f'Scanner ready. Posting scans to {BACKEND_URL}')
    print('Waiting for tags...\n')

    while True:
        try:
            uid = pn532.read_passive_target(timeout=0.5)

            if uid is None:
                continue

            uid_str = format_uid(uid)
            print(f'Tag detected: {uid_str}')

            post_scan(uid_str)

            # Wait for tag to be removed before scanning again
            while pn532.read_passive_target(timeout=0.5) is not None:
                pass

            print('Ready for next scan...\n')

        except KeyboardInterrupt:
            print('\nScanner stopped.')
            break
        except Exception as e:
            print(f'Scanner error: {e}')
            time.sleep(1)


if __name__ == '__main__':
    main()
