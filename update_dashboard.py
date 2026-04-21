#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
update_dashboard.py
Actualiza todas las fórmulas del DASHBOARD en el spreadsheet de control financiero familiar.

Sheet ID: 1Gfr2syN61NMRaI6fGvDlYAiJMuQhl53WaVwi6F4ty3I
URL: https://docs.google.com/spreadsheets/d/1Gfr2syN61NMRaI6fGvDlYAiJMuQhl53WaVwi6F4ty3I

Autenticación (en orden de preferencia):
  1. Variable de entorno GOOGLE_ACCESS_TOKEN con un token OAuth válido
  2. service_account.json en el directorio actual (service account de Google Cloud)
  3. credentials.json en el directorio actual (OAuth2 client secret de Google Cloud)

Uso:
  python3 update_dashboard.py
  python3 update_dashboard.py --mes 2026-04
"""

import os
import sys
import json
import argparse
from datetime import datetime

try:
    import requests
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'requests'])
    import requests

SPREADSHEET_ID = '1Gfr2syN61NMRaI6fGvDlYAiJMuQhl53WaVwi6F4ty3I'
SHEETS_API = f'https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}'


# ---------------------------------------------------------------------------
# Autenticación
# ---------------------------------------------------------------------------

def get_access_token():
    """Obtiene un access token de Google por cualquier método disponible."""

    # Método 1: token directo desde variable de entorno
    token = os.environ.get('GOOGLE_ACCESS_TOKEN')
    if token:
        print("  Auth: usando GOOGLE_ACCESS_TOKEN desde variable de entorno")
        return token

    # Método 2: service account JSON
    sa_file = os.environ.get('GOOGLE_SERVICE_ACCOUNT', 'service_account.json')
    if os.path.exists(sa_file):
        print(f"  Auth: usando service account desde {sa_file}")
        try:
            from google.oauth2 import service_account
            from google.auth.transport.requests import Request as GoogleRequest
            creds = service_account.Credentials.from_service_account_file(
                sa_file,
                scopes=['https://www.googleapis.com/auth/spreadsheets']
            )
            creds.refresh(GoogleRequest())
            return creds.token
        except ImportError:
            print("  ERROR: pip install google-auth")
            sys.exit(1)

    # Método 3: OAuth2 client credentials (credentials.json)
    creds_file = os.environ.get('GOOGLE_CREDENTIALS', 'credentials.json')
    if os.path.exists(creds_file):
        print(f"  Auth: usando OAuth2 desde {creds_file}")
        try:
            from google_auth_oauthlib.flow import InstalledAppFlow
            from google.oauth2.credentials import Credentials
            from google.auth.transport.requests import Request as GoogleRequest
            import pickle

            SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
            token_file = 'token.pickle'
            creds = None

            if os.path.exists(token_file):
                with open(token_file, 'rb') as f:
                    creds = pickle.load(f)

            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    creds.refresh(GoogleRequest())
                else:
                    flow = InstalledAppFlow.from_client_secrets_file(creds_file, SCOPES)
                    creds = flow.run_local_server(port=0)
                with open(token_file, 'wb') as f:
                    pickle.dump(creds, f)

            return creds.token
        except ImportError:
            print("  ERROR: pip install google-auth google-auth-oauthlib")
            sys.exit(1)

    # Ningún método disponible
    print("""
ERROR: No se encontró ningún método de autenticación válido.

Opciones disponibles:

  1. Token OAuth directo (más rápido para pruebas):
       export GOOGLE_ACCESS_TOKEN="ya29.xxxxxxxxx"
       python3 update_dashboard.py
     Obtenerlo en: https://developers.google.com/oauthplayground
     Scope requerido: https://www.googleapis.com/auth/spreadsheets

  2. Service Account (recomendado para automatización):
     a. Crear una cuenta de servicio en Google Cloud Console
     b. Descargar el JSON y guardarlo como service_account.json
     c. Compartir el spreadsheet con el email de la cuenta de servicio (rol Editor)
     d. pip install google-auth
     e. python3 update_dashboard.py

  3. OAuth2 Client Credentials (para uso personal):
     a. Crear credenciales OAuth2 "Desktop app" en Google Cloud Console
     b. Descargar el JSON y guardarlo como credentials.json
     c. pip install google-auth google-auth-oauthlib
     d. python3 update_dashboard.py  (abrirá el browser para autorizar)
""")
    sys.exit(1)


# ---------------------------------------------------------------------------
# API de Sheets
# ---------------------------------------------------------------------------

def sheets_batch_update_values(access_token, data):
    """Actualiza múltiples rangos de celdas vía Sheets API."""
    url = f'{SHEETS_API}/values:batchUpdate'
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json; charset=utf-8',
    }
    payload = {
        'valueInputOption': 'USER_ENTERED',
        'data': data,
        'includeValuesInResponse': False,
    }
    resp = requests.post(url, json=payload, headers=headers, timeout=30)
    if resp.status_code not in (200, 201):
        print(f"\nERROR {resp.status_code} al actualizar celdas:")
        print(resp.text[:800])
        sys.exit(1)
    return resp.json()


def sheets_batch_format(access_token, requests_list):
    """Aplica formato a celdas vía Sheets API batchUpdate (spreadsheets.batchUpdate)."""
    url = f'{SHEETS_API}:batchUpdate'
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json; charset=utf-8',
    }
    payload = {'requests': requests_list}
    resp = requests.post(url, json=payload, headers=headers, timeout=30)
    if resp.status_code not in (200, 201):
        print(f"\nERROR {resp.status_code} al aplicar formato:")
        print(resp.text[:400])
    return resp.json() if resp.status_code in (200, 201) else {}


def get_dashboard_sheet_id(access_token):
    """Obtiene el sheetId numérico de la pestaña DASHBOARD."""
    url = f'{SHEETS_API}?fields=sheets.properties'
    headers = {'Authorization': f'Bearer {access_token}'}
    resp = requests.get(url, headers=headers, timeout=15)
    if resp.status_code != 200:
        print(f"ERROR obteniendo info del spreadsheet: {resp.status_code}")
        return None
    for sheet in resp.json().get('sheets', []):
        props = sheet.get('properties', {})
        if props.get('title') == 'DASHBOARD':
            return props.get('sheetId')
    return None


# ---------------------------------------------------------------------------
# Construcción de fórmulas
# ---------------------------------------------------------------------------

def build_all_formulas(mes):
    """
    Devuelve la lista de {range, values} con todas las fórmulas del DASHBOARD.

    Estructura del DASHBOARD:
      D3        → selector de mes (texto AAAA-MM)
      C7:E7     → Ingresos  NICO / NATI / TOTAL
      C8:E8     → Efectivo / MP (Google Forms)
      C9:E9     → Tarjetas Santander
      C10:E10   → Tarjetas Galicia / Prov
      C11:E11   → Total Gastos
      C12:E12   → Balance
      C13:E13   → % Ahorro
      C25:F32   → Gastos por categoría (Forms | Tarjetas | Total | %)

    Notas clave:
      - Fechas del Forms incluyen hora (ej: 28/03/2026 14:22:07) → se usa DATEVALUE(TEXT(...))
      - Importes del Forms pueden tener punto como separador de miles → se usa SUBSTITUTE
      - Separador de argumentos: ; (locale español argentino)
    """
    S_FORMS   = "'Respuestas de formulario 1'"
    S_ING     = 'INGRESOS'
    S_SANT    = 'TARJETAS_SANTANDER'
    S_GAL     = 'TARJETAS_GALICIA_PROV'

    # --- helpers ---

    def date_match(sheet_col):
        """Extrae AAAA-MM de una celda que puede tener fecha+hora o fecha sola."""
        return f'TEXT(DATEVALUE(TEXT({sheet_col};"DD/MM/YYYY"));"AAAA-MM")'

    def safe_amount(col):
        """Convierte texto con punto decimal a número (maneja 150.000 → 150000)."""
        return f'IFERROR(VALUE(SUBSTITUTE({col};".";""));0)'

    def sumproduct_forms(titular):
        dm  = date_match(f'{S_FORMS}!A2:A1000')
        tit = f'{S_FORMS}!D2:D1000="{titular}"'
        amt = safe_amount(f'{S_FORMS}!B2:B1000')
        return f'=SUMPRODUCT(({dm}=$D$3)*({tit})*{amt})'

    def sumproduct_ingresos(titular):
        dm  = date_match(f'{S_ING}!A2:A1000')
        tit = f'{S_ING}!B2:B1000="{titular}"'
        amt = safe_amount(f'{S_ING}!E2:E1000')
        return f'=SUMPRODUCT(({dm}=$D$3)*({tit})*{amt})'

    def sumproduct_tarjeta(sheet, titular):
        dm  = date_match(f'{sheet}!A2:A1000')
        tit = f'{sheet}!G2:G1000="{titular}"'
        amt = safe_amount(f'{sheet}!D2:D1000')
        return f'=SUMPRODUCT(({dm}=$D$3)*({tit})*{amt})'

    def cat_forms(cat_key):
        dm   = date_match(f'{S_FORMS}!A2:A1000')
        srch = f'ISNUMBER(SEARCH("{cat_key}";{S_FORMS}!C2:C1000))'
        amt  = safe_amount(f'{S_FORMS}!B2:B1000')
        return f'=SUMPRODUCT(({dm}=$D$3)*{srch}*{amt})'

    def cat_tarjetas(cat_key):
        def sp(sheet):
            dm   = date_match(f'{sheet}!A2:A1000')
            srch = f'ISNUMBER(SEARCH("{cat_key}";{sheet}!H2:H1000))'
            amt  = safe_amount(f'{sheet}!D2:D1000')
            return f'SUMPRODUCT(({dm}=$D$3)*{srch}*{amt})'
        return f'={sp(S_SANT)}+{sp(S_GAL)}'

    # --- lista de actualizaciones ---
    updates = []

    def add(cell, value):
        updates.append({'range': f'DASHBOARD!{cell}', 'values': [[value]]})

    # Selector de mes
    add('D3', mes)

    # Fila 7 — Ingresos
    add('C7', sumproduct_ingresos('NICO'))
    add('D7', sumproduct_ingresos('NATI'))
    add('E7', '=C7+D7')

    # Fila 8 — Efectivo / MP (Forms)
    add('C8', sumproduct_forms('NICO'))
    add('D8', sumproduct_forms('NATI'))
    add('E8', '=C8+D8')

    # Fila 9 — Tarjetas Santander
    add('C9',  sumproduct_tarjeta(S_SANT, 'NICO'))
    add('D9',  sumproduct_tarjeta(S_SANT, 'NATI'))
    add('E9',  '=C9+D9')

    # Fila 10 — Tarjetas Galicia / Prov
    add('C10', sumproduct_tarjeta(S_GAL, 'NICO'))
    add('D10', sumproduct_tarjeta(S_GAL, 'NATI'))
    add('E10', '=C10+D10')

    # Fila 11 — Total Gastos
    add('C11', '=C8+C9+C10')
    add('D11', '=D8+D9+D10')
    add('E11', '=C11+D11')

    # Fila 12 — Balance
    add('C12', '=C7-C11')
    add('D12', '=D7-D11')
    add('E12', '=C12+D12')

    # Fila 13 — % Ahorro
    add('C13', '=IFERROR(C12/C7;0)')
    add('D13', '=IFERROR(D12/D7;0)')
    add('E13', '=IFERROR(E12/E7;0)')

    # Filas 25-32 — Gastos por categoría
    categories = [
        ('Súper y Comida',              25),
        ('Servicios y Casa',            26),
        ('Transporte y Auto',           27),
        ('Salud y Farmacia',            28),
        ('Ocio y Salidas',              29),
        ('Educación',                   30),
        ('Varios y Extras',             31),
        ('Impuestos y Cargos Bancarios',32),
    ]
    for cat_key, row in categories:
        add(f'C{row}', cat_forms(cat_key))
        add(f'D{row}', cat_tarjetas(cat_key))
        add(f'E{row}', f'=C{row}+D{row}')
        add(f'F{row}', f'=IFERROR(E{row}/$E$11;0)')  # % del total de gastos

    return updates


def build_format_requests(sheet_id):
    """Devuelve requests de formato: porcentajes en fila 13 y columna F de categorías."""
    if sheet_id is None:
        return []

    pct_format = {
        'numberFormat': {'type': 'PERCENT', 'pattern': '0.0%'}
    }

    def pct_range(start_row, end_row, start_col, end_col):
        return {
            'repeatCell': {
                'range': {
                    'sheetId': sheet_id,
                    'startRowIndex': start_row,
                    'endRowIndex': end_row,
                    'startColumnIndex': start_col,
                    'endColumnIndex': end_col,
                },
                'cell': {'userEnteredFormat': pct_format},
                'fields': 'userEnteredFormat.numberFormat',
            }
        }

    return [
        pct_range(12, 13, 2, 5),   # C13:E13 → % ahorro (fila 13, índice base 0)
        pct_range(24, 32, 5, 6),   # F25:F32 → % del total por categoría
    ]


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description='Actualiza las fórmulas del DASHBOARD de control financiero familiar'
    )
    parser.add_argument(
        '--mes', default=None,
        help='Mes para D3 en formato AAAA-MM (ej: 2026-04). Default: mes actual.'
    )
    parser.add_argument(
        '--solo-formulas', action='store_true',
        help='Solo actualiza fórmulas, sin aplicar formato de porcentaje.'
    )
    args = parser.parse_args()

    mes = args.mes or datetime.now().strftime('%Y-%m')

    print(f"\n=== Dashboard de Control Financiero ===")
    print(f"  Mes : {mes}")
    print(f"  Sheet: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}\n")

    # Auth
    access_token = get_access_token()

    # Fórmulas
    print("Construyendo fórmulas...")
    updates = build_all_formulas(mes)
    print(f"  → {len(updates)} celdas a actualizar")

    print("Actualizando Google Sheets...")
    result = sheets_batch_update_values(access_token, updates)
    updated = result.get('totalUpdatedCells', '?')
    print(f"  ✓ {updated} celdas actualizadas")

    # Formato opcional
    if not args.solo_formulas:
        print("Aplicando formato de porcentaje...")
        sheet_id = get_dashboard_sheet_id(access_token)
        fmt_reqs = build_format_requests(sheet_id)
        if fmt_reqs:
            sheets_batch_format(access_token, fmt_reqs)
            print(f"  ✓ Formato aplicado en C13:E13 y F25:F32")
        else:
            print("  ✗ No se pudo obtener el sheetId de DASHBOARD (formato omitido)")

    print(f"\n✅ DASHBOARD actualizado para {mes}")
    print(f"   {SHEETS_API.replace('sheets.googleapis.com/v4/spreadsheets', 'docs.google.com/spreadsheets/d')}\n")


if __name__ == '__main__':
    main()
