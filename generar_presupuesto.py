#!/usr/bin/env python3
"""Genera Presupuesto_Florida_2027_Nico.xlsx con openpyxl.

Datos de vuelos y reservas extraidos de los PDF/documentos reales del viaje
(Google Drive: carpeta VIAJES / Disney 2027 febrero). Todas las celdas
financieras derivadas usan formulas nativas de Excel.
"""
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.comments import Comment
from openpyxl.workbook.defined_name import DefinedName

OUTPUT_PATH = "Presupuesto_Florida_2027_Nico.xlsx"

# ---------------------------------------------------------------------------
# Estilos
# ---------------------------------------------------------------------------
NAVY = "1F3864"
BLUE = "2E5C8A"
LIGHT_BLUE = "D9E2F3"
GOLD = "FFC000"
YELLOW_INPUT = "FFF2CC"
RED_ALERT = "C00000"
RED_FILL = "FCE4E4"
GREEN_FILL = "E2EFDA"
GREY = "F2F2F2"
WHITE = "FFFFFF"

TITLE_FONT = Font(name="Calibri", size=18, bold=True, color=WHITE)
SUBTITLE_FONT = Font(name="Calibri", size=12, italic=True, color=WHITE)
H1_FONT = Font(name="Calibri", size=14, bold=True, color=WHITE)
H2_FONT = Font(name="Calibri", size=11, bold=True, color=WHITE)
BODY_FONT = Font(name="Calibri", size=10.5)
BODY_BOLD = Font(name="Calibri", size=10.5, bold=True)
ALERT_FONT = Font(name="Calibri", size=10.5, bold=True, color=RED_ALERT)
INPUT_FONT = Font(name="Calibri", size=10.5, color="7F6000")

HEADER_FILL = PatternFill("solid", fgColor=NAVY)
SUBHEADER_FILL = PatternFill("solid", fgColor=BLUE)
LIGHT_FILL = PatternFill("solid", fgColor=LIGHT_BLUE)
INPUT_FILL = PatternFill("solid", fgColor=YELLOW_INPUT)
ALERT_FILL = PatternFill("solid", fgColor=RED_FILL)
OK_FILL = PatternFill("solid", fgColor=GREEN_FILL)
TOTAL_FILL = PatternFill("solid", fgColor=GOLD)
STRIPE_FILL = PatternFill("solid", fgColor=GREY)

THIN = Side(style="thin", color="BFBFBF")
BOX = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)

USD = '$#,##0.00'
WRAP_TOP = Alignment(wrap_text=True, vertical="top")
WRAP_TOP_CENTER = Alignment(wrap_text=True, vertical="top", horizontal="center")
CENTER = Alignment(horizontal="center", vertical="center")


def style_title_row(ws, row, text, span, height=32, font=TITLE_FONT, fill=HEADER_FILL):
    ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=span)
    c = ws.cell(row=row, column=1, value=text)
    c.font = font
    c.fill = fill
    c.alignment = Alignment(horizontal="left", vertical="center", indent=1)
    ws.row_dimensions[row].height = height
    for col in range(1, span + 1):
        ws.cell(row=row, column=col).fill = fill


def style_section_header(ws, row, text, span, fill=SUBHEADER_FILL):
    ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=span)
    c = ws.cell(row=row, column=1, value=text)
    c.font = H2_FONT
    c.fill = fill
    c.alignment = Alignment(horizontal="left", vertical="center", indent=1)
    ws.row_dimensions[row].height =20
    for col in range(1, span + 1):
        ws.cell(row=row, column=col).fill = fill


def mark_input(cell):
    cell.fill = INPUT_FILL
    cell.font = INPUT_FONT


wb = Workbook()

# ===========================================================================
# PESTANA 1: DASHBOARD Y REGLAS
# ===========================================================================
ws1 = wb.active
ws1.title = "Dashboard y Reglas"
ws1.sheet_view.showGridLines = False
for col, w in zip("ABCDEF", [26, 26, 26, 26, 26, 26]):
    ws1.column_dimensions[col].width = w

style_title_row(ws1, 1, "PRESUPUESTO FLORIDA 2027 - FAMILIA MAYDANA / AGULLO", 6, height=36)
ws1.merge_cells("A2:F2")
c = ws1.cell(row=2, column=1, value="Orlando (Disney + Universal) y Miami (Hollywood Beach) | 05-feb al 22-feb-2027 | Grupo de 7 personas")
c.font = SUBTITLE_FONT
c.fill = HEADER_FILL
c.alignment = Alignment(horizontal="left", vertical="center", indent=1)
ws1.row_dimensions[2].height = 20

row = 4
style_section_header(ws1, row, "REGLAS DE DIVISION DE GASTOS POR NUCLEO", 6)
row += 1
ws1.merge_cells(f"A{row}:F{row}")
ws1.cell(row=row, column=1, value=(
    "El grupo (N=7) se organiza en 3 nucleos financieros independientes. Cada nucleo paga sus propios "
    "gastos de tierra (hospedaje, entradas, comida, transporte local) segun lo facturado a su nombre. "
    "La UNICA excepcion es el rubro Vuelos: por regla especial, el Nucleo 1 absorbe el 100% del costo "
    "aereo de los 7 pasajeros (EZE-MIA-MCO ida / MCO-MIA...MIA-EZE vuelta), y los Nucleos 2 y 3 quedan "
    "completamente exentos de ese gasto (0% vuelos)."
))
ws1.cell(row=row, column=1).alignment = WRAP_TOP
ws1.cell(row=row, column=1).font = BODY_FONT
ws1.row_dimensions[row].height = 60
row += 2

nucleos = [
    ("NUCLEO 1", "Rodolfo, Claudia, Delfina (6)", "Paga 100% de sus gastos propios (Disney, Universal, etc.) + 100% de TODOS los tickets aereos del grupo (EZE-MCO / MCO-MIA / MIA-EZE)."),
    ("NUCLEO 2", "Florencia, German", "Paga 100% de sus gastos en tierra. 0% de gastos aereos (exento)."),
    ("NUCLEO 3", "Nicolas, Natalia", "Paga 100% de sus gastos en tierra compartidos. 0% de gastos aereos (exento). El costo individual de Nicolas es exactamente la mitad (=Costo_Nucleo3/2) del total del nucleo."),
]
headers = ["Nucleo", "Integrantes", "Regla de gasto"]
for j, h in enumerate(headers, start=1):
    cell = ws1.cell(row=row, column=j, value=h)
    cell.font = H2_FONT
    cell.fill = SUBHEADER_FILL
    cell.alignment = CENTER
ws1.merge_cells(start_row=row, start_column=3, end_row=row, end_column=6)
ws1.row_dimensions[row].height = 18
row += 1
for nombre, integrantes, regla in nucleos:
    ws1.cell(row=row, column=1, value=nombre).font = BODY_BOLD
    ws1.cell(row=row, column=2, value=integrantes).font = BODY_FONT
    ws1.merge_cells(start_row=row, start_column=3, end_row=row, end_column=6)
    rc = ws1.cell(row=row, column=3, value=regla)
    rc.font = BODY_FONT
    rc.alignment = WRAP_TOP
    for col in range(1, 7):
        ws1.cell(row=row, column=col).border = BOX
        ws1.cell(row=row, column=col).fill = LIGHT_FILL
    ws1.cell(row=row, column=1).alignment = WRAP_TOP
    ws1.cell(row=row, column=2).alignment = WRAP_TOP
    ws1.row_dimensions[row].height = 46
    row += 1

row += 1
style_section_header(ws1, row, "ALERTAS OBLIGATORIAS", 6, fill=PatternFill("solid", fgColor=RED_ALERT))
row += 1
alertas = [
    "VISA AMERICANA B1/B2: verificar vigencia de la visa de EE.UU. de los 7 pasajeros antes del 05-feb-2027. Sin visa vigente no se puede abordar el vuelo EZE-MIA (AA982).",
    "PASAPORTE: los 7 pasaportes deben tener un minimo de 6 MESES de vigencia posteriores a la fecha de regreso (23-feb-2027), es decir vigentes al menos hasta 23-ago-2027.",
    "SEGURO DE VIAJE: contratacion OBLIGATORIA de asistencia medica internacional para los 7 pasajeros. Ninguno de los paquetes de Disney/Universal actuales la incluye.",
    "VENCIMIENTO DISNEY: saldo de las 3 reservas (Art of Animation) vence el 06-ene-2027 (ver Matriz Financiera / notas por reserva).",
    "VENCIMIENTO UNIVERSAL: saldo de las 2 reservas (Dockside Inn) vence el 29-dic-2026.",
]
for a in alertas:
    ws1.merge_cells(start_row=row, start_column=1, end_row=row, end_column=6)
    cell = ws1.cell(row=row, column=1, value="⚠ " + a)
    cell.font = ALERT_FONT
    cell.fill = ALERT_FILL
    cell.alignment = WRAP_TOP
    ws1.row_dimensions[row].height = 32
    row += 1

row += 1
style_section_header(ws1, row, "COMO LEER ESTE LIBRO", 6)
row += 1
notas = [
    "Pestana 2 (Matriz Financiera): presupuesto PROYECTADO segun lo ya reservado/facturado. Todas las celdas de costo total y costo de Nicolas son FORMULAS activas de Excel. Las celdas resaltadas en amarillo son estimaciones editables.",
    "Pestana 3 (Registro de Gastos): hoja de carga MANUAL para que Nico anote los gastos reales dia a dia (Uber, comidas, compras, etc.). Los totales por nucleo se calculan solos con formulas.",
    "Pestana 4 (Itinerario Flash): calendario dia a dia con horarios reales de vuelo y estado Confirmado / Por organizar de cada actividad.",
    "Pestana 5 (Logistica): tabla de vuelos reales (PNR ETPWSR / booking B4ZHG8) y analisis de alquiler de minivan en Miami.",
    "Pestana 6 (Guia Operativa): tips practicos y la formula de control del presupuesto total del grupo.",
]
for n in notas:
    ws1.merge_cells(start_row=row, start_column=1, end_row=row, end_column=6)
    cell = ws1.cell(row=row, column=1, value="• " + n)
    cell.font = BODY_FONT
    cell.alignment = WRAP_TOP
    ws1.row_dimensions[row].height = 26
    row += 1

# ===========================================================================
# PESTANA 2: MATRIZ FINANCIERA
# ===========================================================================
ws2 = wb.create_sheet("Matriz Financiera")
ws2.sheet_view.showGridLines = False
widths2 = {"A": 24, "B": 40, "C": 16, "D": 15, "E": 15, "F": 15, "G": 18, "H": 2, "I": 22, "J": 12}
for col, w in widths2.items():
    ws2.column_dimensions[col].width = w

style_title_row(ws2, 1, "MATRIZ FINANCIERA", 7, height=30)

# Parametros (bloque con nombre, columnas I:J)
ws2.cell(row=1, column=9, value="PARAMETROS").font = H2_FONT
ws2.cell(row=1, column=9).fill = SUBHEADER_FILL
ws2.merge_cells(start_row=1, start_column=9, end_row=1, end_column=10)
ws2.cell(row=1, column=9).alignment = Alignment(horizontal="center")

param_rows = [
    ("N1_PAX", 3), ("N2_PAX", 2), ("N3_PAX", 2), ("TOTAL_PAX", 7),
    ("N1_ADULTS", 2), ("N2_ADULTS", 2), ("N3_ADULTS", 2), ("TOTAL_ADULTS", 6),
    ("DIAS_COMIDA", 11),
]
param_cell_refs = {}
prow = 2
for name, value in param_rows:
    ws2.cell(row=prow, column=9, value=name).font = BODY_FONT
    vcell = ws2.cell(row=prow, column=10, value=value)
    vcell.font = BODY_BOLD
    vcell.fill = INPUT_FILL if name == "DIAS_COMIDA" else LIGHT_FILL
    vcell.alignment = CENTER
    param_cell_refs[name] = f"'Matriz Financiera'!$J${prow}"
    prow += 1

for name, ref in param_cell_refs.items():
    wb.defined_names.add(DefinedName(name, attr_text=ref))

row = 3
style_section_header(ws2, row, "PRESUPUESTO POR CATEGORIA", 7)
row += 1
headers2 = ["Categoria", "Descripcion", "Costo Total USD", "Nucleo 1 USD", "Nucleo 2 USD", "Nucleo 3 USD", "Costo Nico (50% N3)"]
for j, h in enumerate(headers2, start=1):
    cell = ws2.cell(row=row, column=j, value=h)
    cell.font = H2_FONT
    cell.fill = SUBHEADER_FILL
    cell.alignment = WRAP_TOP_CENTER
    cell.border = BOX
ws2.row_dimensions[row].height = 30
ws2.freeze_panes = f"A{row + 1}"
header_row2 = row
row += 1
first_data_row = row

def add_fixed_row(categoria, descripcion, n1, n2, n3, note=None):
    global row
    ws2.cell(row=row, column=1, value=categoria).font = BODY_BOLD
    dcell = ws2.cell(row=row, column=2, value=descripcion)
    dcell.font = BODY_FONT
    dcell.alignment = WRAP_TOP
    n1_col, n2_col, n3_col = 4, 5, 6
    ws2.cell(row=row, column=n1_col, value=n1).number_format = USD
    ws2.cell(row=row, column=n2_col, value=n2).number_format = USD
    ws2.cell(row=row, column=n3_col, value=n3).number_format = USD
    total_cell = ws2.cell(row=row, column=3, value=f"=SUM(D{row}:F{row})")
    total_cell.number_format = USD
    total_cell.font = BODY_BOLD
    nico_cell = ws2.cell(row=row, column=7, value=f"=F{row}/2")
    nico_cell.number_format = USD
    nico_cell.font = BODY_BOLD
    if note:
        dcell.comment = Comment(note, "Presupuesto Florida 2027")
    for col in range(1, 8):
        ws2.cell(row=row, column=col).border = BOX
        if col in (1, 2):
            ws2.cell(row=row, column=col).alignment = WRAP_TOP
    ws2.row_dimensions[row].height = 42
    row += 1

def add_flight_row():
    global row
    ws2.cell(row=row, column=1, value="Vuelos").font = BODY_BOLD
    dcell = ws2.cell(row=row, column=2, value=(
        "4 tramos AA (PNR ETPWSR / booking B4ZHG8): EZE-MIA AA982, MIA-MCO AA1856 (05-feb), "
        "MCO-MIA AA1741 (17-feb), MIA-EZE AA931 (22-feb). Costo NO figura en el e-ticket."
    ))
    dcell.font = BODY_FONT
    dcell.alignment = WRAP_TOP
    total_input = ws2.cell(row=row, column=3, value=0)
    total_input.number_format = USD
    mark_input(total_input)
    total_input.comment = Comment("A COMPLETAR: cargar aqui el costo total real de los 7 pasajes cuando se conozca.", "Presupuesto Florida 2027")
    ws2.cell(row=row, column=4, value=f"=C{row}").number_format = USD
    ws2.cell(row=row, column=5, value=0).number_format = USD
    ws2.cell(row=row, column=6, value=0).number_format = USD
    ws2.cell(row=row, column=7, value=0).number_format = USD
    for col in range(1, 8):
        ws2.cell(row=row, column=col).border = BOX
        if col in (1, 2):
            ws2.cell(row=row, column=col).alignment = WRAP_TOP
    ws2.row_dimensions[row].height = 42
    row += 1

def add_prop_row(categoria, descripcion, total_value, weight="PAX", note=None, input_cell=True):
    """Fila con costo total editable y reparto proporcional por PAX o ADULTS."""
    global row
    ws2.cell(row=row, column=1, value=categoria).font = BODY_BOLD
    dcell = ws2.cell(row=row, column=2, value=descripcion)
    dcell.font = BODY_FONT
    dcell.alignment = WRAP_TOP
    total_cell = ws2.cell(row=row, column=3, value=total_value)
    total_cell.number_format = USD
    if input_cell:
        mark_input(total_cell)
    n1n, n2n, n3n, totn = (
        (f"N1_{weight}", f"N2_{weight}", f"N3_{weight}", f"TOTAL_{weight}")
    )
    ws2.cell(row=row, column=4, value=f"=$C{row}*{n1n}/{totn}").number_format = USD
    ws2.cell(row=row, column=5, value=f"=$C{row}*{n2n}/{totn}").number_format = USD
    ws2.cell(row=row, column=6, value=f"=$C{row}*{n3n}/{totn}").number_format = USD
    ws2.cell(row=row, column=7, value=f"=F{row}/2").number_format = USD
    if note:
        dcell.comment = Comment(note, "Presupuesto Florida 2027")
    for col in range(1, 8):
        ws2.cell(row=row, column=col).border = BOX
        if col in (1, 2):
            ws2.cell(row=row, column=col).alignment = WRAP_TOP
    ws2.row_dimensions[row].height = 42
    row += 1

add_fixed_row(
    "Disney (Art of Animation)",
    "3 reservas separadas, 05 al 12-feb-2027 (7 noches), Quick-Service Dining Plan incluido. "
    "Res.#43028633 (N1, 5-Day) / Res.#43028415 (N2, 4-Day) / Res.#43028783 (N3, 5-Day).",
    5988.35, 4876.79, 5008.57,
    note="Montos reales facturados por Disney (no estimados). Saldos vencen 06-ene-2027.",
)
add_fixed_row(
    "Universal (Dockside Inn)",
    "12 al 17-feb-2027 (5 noches). Res. X2W124U2 (N1, Standard 2Q) = $3,204.59. "
    "Res. 63W124U2 (N2+N3 juntos, Suite 2BR, 4 adultos) = $4,433.94, dividido 50/50 entre N2 y N3.",
    3204.59, 2216.97, 2216.97,
    note="N1 = monto real de su reserva. N2/N3 = mitad de la reserva conjunta 63W124U2 ($4,433.94/2). Saldos vencen 29-dic-2026.",
)
add_flight_row()
add_prop_row(
    "Traslado MCO - Disney",
    "Llegada 05-feb: 2 UberXL desde MCO hasta Disney's Art of Animation Resort (7 pax + 21 bultos de equipaje).",
    90.00, weight="PAX",
    note="Estimado sourced del analisis de traslados del grupo (~$25.71/persona x 7 / 2 tramos = ~$90 por tramo de 2 UberXL). Editable.",
)
add_prop_row(
    "Traslado Universal - MCO",
    "Salida 17-feb: 2 UberXL desde Universal Dockside hasta MCO para tomar el vuelo AA1741 a MIA.",
    90.00, weight="PAX",
    note="Estimado sourced, mismo criterio que el traslado de llegada. Editable.",
)
add_prop_row(
    "Hospedaje Miami (Hollywood Beach)",
    "Departamento 3/4 habitaciones, 17 al 22-feb-2027 (5 noches). Aun sin reservar.",
    0.00, weight="PAX",
    note="A COMPLETAR: no se encontro reserva en Drive. Cargar el costo total cuando se confirme el alojamiento.",
)
add_prop_row(
    "Alquiler Auto Miami",
    "Minivan 7 pax (Chrysler Pacifica / Kia Carnival) + seguros CDW/LIS + SunPass, 17 al 22-feb-2027.",
    0.00, weight="PAX",
    note="A COMPLETAR. Ver Pestana 4 'Logistica Terrestre y Vuelos' para el desglose de este monto (tarifa + seguros + peajes + estacionamiento).",
)

# Comidas: total = 60 * TOTAL_ADULTS * DIAS_COMIDA (formula), split por ADULTS
ws2.cell(row=row, column=1, value="Comidas").font = BODY_BOLD
dcell = ws2.cell(row=row, column=2, value=(
    "$60 USD/dia por adulto, durante Universal + Miami (Disney ya incluye Quick-Service Dining). "
    "Dias editable en Parametros (J10)."
))
dcell.font = BODY_FONT
dcell.alignment = WRAP_TOP
total_cell = ws2.cell(row=row, column=3, value="=60*TOTAL_ADULTS*DIAS_COMIDA")
total_cell.number_format = USD
ws2.cell(row=row, column=4, value=f"=$C{row}*N1_ADULTS/TOTAL_ADULTS").number_format = USD
ws2.cell(row=row, column=5, value=f"=$C{row}*N2_ADULTS/TOTAL_ADULTS").number_format = USD
ws2.cell(row=row, column=6, value=f"=$C{row}*N3_ADULTS/TOTAL_ADULTS").number_format = USD
ws2.cell(row=row, column=7, value=f"=F{row}/2").number_format = USD
dcell.comment = Comment("Total = 60 x TOTAL_ADULTS x DIAS_COMIDA (formula activa). Reparto por adultos: Delfina (6 anos) no cuenta como adulto.", "Presupuesto Florida 2027")
for col in range(1, 8):
    ws2.cell(row=row, column=col).border = BOX
    if col in (1, 2):
        ws2.cell(row=row, column=col).alignment = WRAP_TOP
ws2.row_dimensions[row].height = 42
row += 1

last_data_row = row - 1

# Fila de totales
ws2.cell(row=row, column=1, value="TOTALES").font = Font(bold=True, size=11)
for col in range(1, 8):
    ws2.cell(row=row, column=col).fill = TOTAL_FILL
    ws2.cell(row=row, column=col).border = BOX
for col_letter in ["C", "D", "E", "F", "G"]:
    tot_cell = ws2.cell(row=row, column=ws2[col_letter + "1"].column,
                         value=f"=SUM({col_letter}{first_data_row}:{col_letter}{last_data_row})")
    tot_cell.number_format = USD
    tot_cell.font = Font(bold=True, size=11)
ws2.row_dimensions[row].height = 22

# Leyenda
row += 2
ws2.cell(row=row, column=1, value="Leyenda:").font = BODY_BOLD
row += 1
ws2.cell(row=row, column=1, value="Celda amarilla = estimacion/dato editable manualmente.").font = BODY_FONT
row += 1
ws2.cell(row=row, column=1, value="Costo Nico = Nucleo 3 USD / 2 (formula activa, Nicolas paga exactamente la mitad del nucleo).").font = BODY_FONT

# ===========================================================================
# PESTANA 3: REGISTRO DE GASTOS (carga manual, dia a dia, a cargo de Nico)
# ===========================================================================
ws2b = wb.create_sheet("Registro de Gastos")
ws2b.sheet_view.showGridLines = False
widths2b = {"A": 13, "B": 20, "C": 34, "D": 15, "E": 16, "F": 14, "G": 30}
for col, w in widths2b.items():
    ws2b.column_dimensions[col].width = w

style_title_row(ws2b, 1, "REGISTRO DE GASTOS - CARGA MANUAL (NICO)", 7, height=30)
row = 2
ws2b.merge_cells(f"A{row}:G{row}")
c = ws2b.cell(row=row, column=1, value=(
    "Esta hoja es de uso exclusivo de Nico: anotar aca cada gasto real a medida que ocurre en el viaje "
    "(Uber, comidas, compras, propinas, etc.). Es independiente de la Matriz Financiera (que refleja lo ya "
    "reservado/facturado). Los totales de abajo se recalculan solos con formulas."
))
c.font = Font(italic=True, size=10)
c.alignment = WRAP_TOP
c.fill = LIGHT_FILL
ws2b.row_dimensions[row].height = 34
row += 2

headers2b = ["Fecha", "Categoria", "Descripcion", "Nucleo", "Pagado por", "Monto USD", "Notas"]
header_row_2b = row
for j, h in enumerate(headers2b, start=1):
    cell = ws2b.cell(row=row, column=j, value=h)
    cell.font = H2_FONT
    cell.fill = SUBHEADER_FILL
    cell.alignment = CENTER
    cell.border = BOX
ws2b.row_dimensions[row].height = 18
ws2b.freeze_panes = f"A{row + 1}"
row += 1
gasto_first_row = row

N_BLANK_ROWS = 60
for i in range(N_BLANK_ROWS):
    for col in range(1, 8):
        cell = ws2b.cell(row=row, column=col)
        cell.border = BOX
        cell.font = BODY_FONT
        if col == 6:
            cell.number_format = USD
        if (i % 2) == 0:
            cell.fill = STRIPE_FILL
    ws2b.row_dimensions[row].height = 16
    row += 1
gasto_last_row = row - 1

# Primer gasto real ya avisado por Nico: sena de $200 pagada con tarjeta Santander Rio.
# Fecha/reserva exacta a confirmar (hay dos senas de $200: Universal 63W124U2 y Disney #43028783).
ws2b.cell(row=gasto_first_row, column=1, value="A confirmar")
ws2b.cell(row=gasto_first_row, column=3, value="Sena de reserva (confirmar si es Universal 63W124U2 o Disney #43028783 - ambas por $200)")
ws2b.cell(row=gasto_first_row, column=5, value="Nicolas - Tarjeta credito Santander Rio")
ws2b.cell(row=gasto_first_row, column=6, value=200)
ws2b.cell(row=gasto_first_row, column=7, value="Cargado por Claude a pedido de Nico; confirmar fecha exacta y a que reserva corresponde.")
for col in (1, 3, 5, 7):
    ws2b.cell(row=gasto_first_row, column=col).alignment = WRAP_TOP

# Data validation: Categoria y Nucleo como listas desplegables
from openpyxl.worksheet.datavalidation import DataValidation

categoria_list = '"Vuelos,Disney,Universal,Hospedaje Miami,Auto/Transporte,Comida,Compras,Seguro,Propinas,Otro"'
dv_cat = DataValidation(type="list", formula1=categoria_list, allow_blank=True, showDropDown=False)
ws2b.add_data_validation(dv_cat)
dv_cat.add(f"B{gasto_first_row}:B{gasto_last_row}")

nucleo_list = '"Nucleo 1,Nucleo 2,Nucleo 3,Compartido/Todos"'
dv_nuc = DataValidation(type="list", formula1=nucleo_list, allow_blank=True, showDropDown=False)
ws2b.add_data_validation(dv_nuc)
dv_nuc.add(f"D{gasto_first_row}:D{gasto_last_row}")

row += 1
style_section_header(ws2b, row, "RESUMEN AUTOMATICO (se calcula solo a medida que cargas filas arriba)", 7)
row += 1
rango_nucleo = f"$D${gasto_first_row}:$D${gasto_last_row}"
rango_monto = f"$F${gasto_first_row}:$F${gasto_last_row}"
resumen_labels = [
    ("Total Nucleo 1", f'=SUMIF({rango_nucleo},"Nucleo 1",{rango_monto})'),
    ("Total Nucleo 2", f'=SUMIF({rango_nucleo},"Nucleo 2",{rango_monto})'),
    ("Total Nucleo 3", f'=SUMIF({rango_nucleo},"Nucleo 3",{rango_monto})'),
    ("Total Compartido/Todos", f'=SUMIF({rango_nucleo},"Compartido/Todos",{rango_monto})'),
]
resumen_n3_row = None
for label, formula in resumen_labels:
    ws2b.cell(row=row, column=1, value=label).font = BODY_BOLD
    fcell = ws2b.cell(row=row, column=2, value=formula)
    fcell.number_format = USD
    fcell.font = BODY_BOLD
    if label == "Total Nucleo 3":
        resumen_n3_row = row
    for col in range(1, 8):
        ws2b.cell(row=row, column=col).border = BOX
    ws2b.row_dimensions[row].height = 16
    row += 1

ws2b.cell(row=row, column=1, value="Costo Nico (50% Nucleo 3)").font = BODY_BOLD
nico_cell = ws2b.cell(row=row, column=2, value=f"=B{resumen_n3_row}/2")
nico_cell.number_format = USD
nico_cell.font = BODY_BOLD
for col in range(1, 8):
    ws2b.cell(row=row, column=col).border = BOX
ws2b.row_dimensions[row].height = 16
row += 1

ws2b.cell(row=row, column=1, value="TOTAL REGISTRADO").font = Font(bold=True, size=11)
total_gastos_cell = ws2b.cell(row=row, column=2, value=f"=SUM({rango_monto})")
total_gastos_cell.number_format = USD
total_gastos_cell.font = Font(bold=True, size=11)
for col in range(1, 8):
    ws2b.cell(row=row, column=col).fill = TOTAL_FILL
    ws2b.cell(row=row, column=col).border = BOX
ws2b.row_dimensions[row].height = 20
row += 3

style_section_header(ws2b, row, "DEUDAS ENTRE PERSONAS (adelantos de un integrante a nombre de otros)", 7)
row += 1
headers_deudas = ["Concepto", "Adelanto pagado por", "A cargo de", "Monto USD", "Estado"]
for j, h in enumerate(headers_deudas, start=1):
    cell = ws2b.cell(row=row, column=j, value=h)
    cell.font = H2_FONT
    cell.fill = SUBHEADER_FILL
    cell.alignment = CENTER
    cell.border = BOX
ws2b.merge_cells(start_row=row, start_column=5, end_row=row, end_column=7)
ws2b.row_dimensions[row].height = 18
row += 1

deudas = [
    (
        "Universal Dockside (reserva conjunta 63W124U2: Florencia, German, Natalia, Nicolas)",
        "German Agullo (pago la reserva completa)",
        "Nicolas y Natalia (Nucleo 3) le deben a German la mitad de esta reserva + lo que falte pagar",
        "='Matriz Financiera'!F6",
        "Pendiente de liquidar con German",
    ),
    (
        "Disney Art of Animation (reserva #43028783: Natalia, Nicolas)",
        "Nicolas y Natalia (pagan directo, sin intermediario)",
        "N/A - no genera deuda entre personas",
        "='Matriz Financiera'!F5",
        "Gestionado directamente por Nucleo 3",
    ),
]
for concepto, adelanto, cargo, monto_formula, estado in deudas:
    ws2b.cell(row=row, column=1, value=concepto).font = BODY_FONT
    ws2b.cell(row=row, column=1).alignment = WRAP_TOP
    ws2b.cell(row=row, column=2, value=adelanto).font = BODY_FONT
    ws2b.cell(row=row, column=2).alignment = WRAP_TOP
    ws2b.cell(row=row, column=3, value=cargo).font = BODY_FONT
    ws2b.cell(row=row, column=3).alignment = WRAP_TOP
    monto_cell = ws2b.cell(row=row, column=4, value=monto_formula)
    monto_cell.number_format = USD
    monto_cell.font = BODY_BOLD
    ws2b.merge_cells(start_row=row, start_column=5, end_row=row, end_column=7)
    estado_cell = ws2b.cell(row=row, column=5, value=estado)
    estado_cell.font = Font(italic=True, size=9.5)
    estado_cell.alignment = WRAP_TOP
    for col in range(1, 8):
        ws2b.cell(row=row, column=col).border = BOX
    ws2b.row_dimensions[row].height = 40
    row += 1

row += 1
ws2b.merge_cells(start_row=row, start_column=1, end_row=row, end_column=7)
nota_deudas = ws2b.cell(row=row, column=1, value=(
    "El monto de la fila Universal esta enlazado por formula a la Matriz Financiera (Nucleo 3 = mitad de la "
    "reserva conjunta 63W124U2). Incluye la sena ya pagada y el saldo que falte liquidar con German a medida "
    "que se vaya pagando la reserva completa."
))
nota_deudas.font = Font(italic=True, size=9.5)
nota_deudas.alignment = WRAP_TOP
ws2b.row_dimensions[row].height = 30

# ===========================================================================
# PESTANA 4: ITINERARIO FLASH (calendario dia a dia)
# ===========================================================================
ws3 = wb.create_sheet("Itinerario Flash")
ws3.sheet_view.showGridLines = False
ws3.column_dimensions["A"].width = 14
ws3.column_dimensions["B"].width = 12
ws3.column_dimensions["C"].width = 15
ws3.column_dimensions["D"].width = 52
ws3.column_dimensions["E"].width = 15
ws3.column_dimensions["F"].width = 48

CONFIRMADO_FILL = PatternFill("solid", fgColor="E2EFDA")
PENDIENTE_FILL = PatternFill("solid", fgColor="FFF2CC")

style_title_row(ws3, 1, "ITINERARIO FLASH - CALENDARIO FEBRERO 2027", 6, height=30)
row = 3
headers3 = ["Fecha", "Hora", "Momento del dia", "Actividad / Lugar", "Estado", "Tip pragmatico"]
for j, h in enumerate(headers3, start=1):
    cell = ws3.cell(row=row, column=j, value=h)
    cell.font = H2_FONT
    cell.fill = SUBHEADER_FILL
    cell.alignment = CENTER
    cell.border = BOX
ws3.row_dimensions[row].height = 18
ws3.freeze_panes = f"A{row + 1}"
row += 1

CONF = "Confirmado"
PEND = "Por organizar"

itinerario = [
    ("05-feb (vie)", "10:10", "Manana", "Vuelo AA982 EZE -> MIA (10:10 a 17:20)", CONF, "Check-in online 24h antes; llegar a EZE con 3h de anticipacion por ser vuelo internacional B1/B2."),
    ("05-feb (vie)", "18:56", "Tarde/Noche", "Conexion AA1856 MIA -> MCO (18:56 a 20:15)", CONF, "Conexion corta (1h36) dentro del mismo aeropuerto MIA; no hace falta retirar equipaje si esta chequeado hasta MCO."),
    ("05-feb (vie)", "20:15", "Noche", "Llegada a Orlando -> Check-in Disney's Art of Animation", CONF, "Traslado en 2 UberXL (7 pax + 21 bultos); pedir con anticipacion por horario nocturno."),
    ("06-feb (sab)", "-", "Todo el dia", "Parque Disney 1", CONF, "Comprar Lightning Lane Multi Pass apenas abre la app a las 7am."),
    ("07-feb (dom)", "-", "Todo el dia", "Parque Disney 2", CONF, "Reservar restaurante con Advance Dining Reservation si se sale del Quick-Service."),
    ("08-feb (lun)", "-", "Todo el dia", "Parque Disney 3", CONF, "Dia de mayor concurrencia -> priorizar atracciones top apenas abre el parque."),
    ("09-feb (mar)", "-", "Todo el dia", "Parque Disney 4", CONF, "Aprovechar Extra Magic Hours si el hotel las tiene habilitadas ese dia."),
    ("10-feb (mie)", "-", "Todo el dia", "Parque Disney 5", CONF, "Guardar el ultimo dia de ticket Disney para el parque favorito del grupo."),
    ("11-feb (jue)", "-", "Todo el dia", "Descanso / Compras en Orlando International Premium Outlets", PEND, "Uber compartido con otras familias del resort para bajar el costo del traslado."),
    ("12-feb (vie)", "11:00", "Manana", "Check-out Disney -> Check-in Universal Dockside Inn", CONF, "Guardar equipaje en Bell Services de Disney si el check-in de Universal es mas tarde."),
    ("12-feb (vie)", "-", "Tarde", "Early Park Admission Universal (segun ticket)", CONF, "Usar el transporte gratuito del hotel Dockside en vez de Uber."),
    ("13-feb (sab)", "-", "Todo el dia", "Universal Epic Universe", CONF, "Llegar 45 min antes de la apertura general por controles de seguridad reforzados."),
    ("14-feb (dom)", "-", "Todo el dia", "Universal's Islands of Adventure", CONF, "Ir directo a VelociCoaster apenas abre el parque."),
    ("15-feb (lun)", "-", "Todo el dia", "Dia libre / Compras", PEND, "Aprovechar para lavar ropa; la mayoria de los Dockside tienen lavanderia self-service."),
    ("16-feb (mar)", "-", "Todo el dia", "Universal Studios Florida", CONF, "Usar el Hogwarts Express (Park-to-Park) para moverse entre parques sin volver a la entrada."),
    ("17-feb (mie)", "-", "Manana", "Check-out Universal -> 2 UberXL a MCO", CONF, "Salir con margen: 21 bultos de equipaje hacen mas lento el check-in en el aeropuerto domestico."),
    ("17-feb (mie)", "10:00", "Manana", "Vuelo AA1741 MCO -> MIA (10:00 a 11:20)", CONF, "Vuelo corto domestico; despachar valijas grandes igual (no entran como carry-on)."),
    ("17-feb (mie)", "11:20", "Mediodia/Tarde", "Llegada Miami -> Check-in departamento Hollywood Beach + retiro de minivan", PEND, "Retirar la minivan (Chrysler Pacifica/Kia Carnival) directo en el aeropuerto MIA para evitar un traslado extra."),
    ("18-feb (jue)", "-", "Todo el dia", "Hollywood Beach - playa y Broadwalk", PEND, "Comprar en Publix o Walmart apenas se llega para no depender de delivery los primeros dias."),
    ("19-feb (vie)", "-", "Todo el dia", "Dia libre Miami / Excursion opcional", PEND, "Cargar SunPass antes de salir a la ruta para evitar recargos por peaje sin transponder."),
    ("20-feb (sab)", "-", "Todo el dia", "Miami - paseo urbano (Wynwood / South Beach)", PEND, "Estacionamiento pago en South Beach; verificar tarifa horaria antes de dejar la minivan."),
    ("21-feb (dom)", "-", "Todo el dia", "Ultimo dia libre + preparar valijas", PEND, "Revisar franquicia de equipaje del vuelo internacional (distinta a la domestica) antes de repartir compras."),
    ("22-feb (lun)", "-", "Tarde", "Check-out departamento + devolucion minivan en MIA", PEND, "Devolver el tanque lleno para evitar el cargo de combustible de la rentadora."),
    ("22-feb (lun)", "20:15", "Noche", "Vuelo AA931 MIA -> EZE (20:15, llega 07:25 del 23-feb)", CONF, "Llegar a MIA con 3.5h de anticipacion por ser vuelo internacional con 7 pasajeros y equipaje voluminoso."),
]

for fecha, hora, momento, actividad, estado, tip in itinerario:
    ws3.cell(row=row, column=1, value=fecha).font = BODY_BOLD
    ws3.cell(row=row, column=2, value=hora).font = BODY_FONT
    ws3.cell(row=row, column=2).alignment = CENTER
    ws3.cell(row=row, column=3, value=momento).font = BODY_FONT
    a = ws3.cell(row=row, column=4, value=actividad)
    a.font = BODY_FONT
    a.alignment = WRAP_TOP
    estado_cell = ws3.cell(row=row, column=5, value=estado)
    estado_cell.font = Font(bold=True, size=9.5, color="375623" if estado == CONF else "7F6000")
    estado_cell.fill = CONFIRMADO_FILL if estado == CONF else PENDIENTE_FILL
    estado_cell.alignment = CENTER
    t = ws3.cell(row=row, column=6, value="-> " + tip)
    t.font = BODY_FONT
    t.alignment = WRAP_TOP
    for col in range(1, 7):
        ws3.cell(row=row, column=col).border = BOX
        if col in (1, 2, 3):
            ws3.cell(row=row, column=col).alignment = WRAP_TOP if col == 1 else CENTER
    ws3.row_dimensions[row].height = 34
    row += 1

row += 1
ws3.merge_cells(start_row=row, start_column=1, end_row=row, end_column=6)
leyenda3 = ws3.cell(row=row, column=1, value=(
    "Confirmado = ya reservado/facturado (vuelos, Disney, Universal). Por organizar = todavia sin reserva "
    "(Hollywood Beach, minivan, dias libres de Miami)."
))
leyenda3.font = Font(italic=True, size=9.5)
ws3.row_dimensions[row].height = 18

# ===========================================================================
# PESTANA 5: LOGISTICA TERRESTRE Y VUELOS
# ===========================================================================
ws4 = wb.create_sheet("Logistica Terrestre y Vuelos")
ws4.sheet_view.showGridLines = False
for col, w in zip("ABCDEFGH", [12, 10, 16, 14, 14, 10, 16, 18]):
    ws4.column_dimensions[col].width = w

style_title_row(ws4, 1, "LOGISTICA TERRESTRE Y VUELOS", 8, height=30)

row = 3
style_section_header(ws4, row, "TABLA 1: HORARIOS DE VUELOS (PNR AA ETPWSR / Booking B4ZHG8)", 8)
row += 1
headers4a = ["Fecha", "Vuelo", "Tramo", "Salida", "Llegada", "Duracion", "Terminal", "Equipo"]
for j, h in enumerate(headers4a, start=1):
    cell = ws4.cell(row=row, column=j, value=h)
    cell.font = H2_FONT
    cell.fill = SUBHEADER_FILL
    cell.alignment = CENTER
    cell.border = BOX
ws4.row_dimensions[row].height = 18
row += 1

vuelos = [
    ("05-feb-2027", "AA 982", "EZE -> MIA", "10:10", "17:20", "9:10", "P (EZE, salida)", "Boeing 787-8"),
    ("05-feb-2027", "AA 1856", "MIA -> MCO", "18:56", "20:15", "1:19", "B (MCO, llegada)", "Boeing 737 MAX 8"),
    ("17-feb-2027", "AA 1741", "MCO -> MIA", "10:00", "11:20", "1:20", "B (MCO, salida)", "Boeing 737 MAX 8"),
    ("22-feb-2027", "AA 931", "MIA -> EZE", "20:15", "07:25 (23-feb)", "9:10", "IA (EZE, llegada)", "Boeing 777-200/200ER"),
]
for v in vuelos:
    for j, val in enumerate(v, start=1):
        cell = ws4.cell(row=row, column=j, value=val)
        cell.font = BODY_FONT
        cell.alignment = CENTER
        cell.border = BOX
    ws4.row_dimensions[row].height = 16
    row += 1

row += 1
ws4.merge_cells(start_row=row, start_column=1, end_row=row, end_column=8)
ws4.cell(row=row, column=1, value="Nota: costo de los pasajes no disponible en el e-ticket. Ver fila 'Vuelos' en Matriz Financiera (celda A COMPLETAR).").font = Font(italic=True, size=9.5)
row += 2

style_section_header(ws4, row, "TABLA 2: ANALISIS ALQUILER MINIVAN MIAMI (7 pax, 17 al 22-feb-2027)", 8)
row += 1
headers4b = ["Concepto", "Detalle", "Costo USD"]
for j, h in enumerate(headers4b, start=1):
    cell = ws4.cell(row=row, column=j, value=h)
    cell.font = H2_FONT
    cell.fill = SUBHEADER_FILL
    cell.alignment = CENTER if j == 3 else Alignment(horizontal="left", vertical="center")
    cell.border = BOX
ws4.merge_cells(start_row=row, start_column=2, end_row=row, end_column=6)
ws4.row_dimensions[row].height = 18
row += 1
tabla2_start = row

minivan_items = [
    ("Tarifa base", "Minivan 7 pax (Chrysler Pacifica / Kia Carnival), 5 dias, retiro/devolucion en MIA", 0.00),
    ("Seguro CDW", "Collision Damage Waiver. Verificar cobertura Visa Signature/AIG del titular antes de contratarlo con la rentadora.", 0.00),
    ("Seguro LIS", "Liability Insurance Supplement", 0.00),
    ("Peajes / SunPass", "Transponder o pase electronico para autopistas de Florida durante los 5 dias", 0.00),
    ("Estacionamiento Hollywood", "Estacionamiento del departamento/edificio en Hollywood Beach", 0.00),
]
for concepto, detalle, costo in minivan_items:
    ws4.cell(row=row, column=1, value=concepto).font = BODY_FONT
    ws4.merge_cells(start_row=row, start_column=2, end_row=row, end_column=6)
    d = ws4.cell(row=row, column=2, value=detalle)
    d.font = BODY_FONT
    d.alignment = WRAP_TOP
    cst = ws4.cell(row=row, column=7, value=costo)
    cst.number_format = USD
    mark_input(cst)
    for col in range(1, 8):
        ws4.cell(row=row, column=col).border = BOX
    ws4.row_dimensions[row].height = 30
    row += 1
tabla2_end = row - 1

ws4.cell(row=row, column=1, value="SUBTOTAL ALQUILER AUTO").font = Font(bold=True)
ws4.merge_cells(start_row=row, start_column=1, end_row=row, end_column=6)
subtotal_cell = ws4.cell(row=row, column=7, value=f"=SUM(G{tabla2_start}:G{tabla2_end})")
subtotal_cell.number_format = USD
subtotal_cell.font = Font(bold=True)
for col in range(1, 8):
    ws4.cell(row=row, column=col).fill = TOTAL_FILL
    ws4.cell(row=row, column=col).border = BOX
ws4.row_dimensions[row].height = 20
row += 2
ws4.merge_cells(start_row=row, start_column=1, end_row=row, end_column=8)
ws4.cell(row=row, column=1, value=(
    "Este subtotal debe transcribirse manualmente a la fila 'Alquiler Auto Miami' (columna Costo Total USD) "
    "de la pestana Matriz Financiera cuando se confirme la cotizacion real de la rentadora."
)).font = Font(italic=True, size=9.5)
ws4.cell(row=row, column=1).alignment = WRAP_TOP
ws4.row_dimensions[row].height = 30

# ===========================================================================
# PESTANA 6: GUIA OPERATIVA
# ===========================================================================
ws5 = wb.create_sheet("Guia Operativa")
ws5.sheet_view.showGridLines = False
ws5.column_dimensions["A"].width = 95

style_title_row(ws5, 1, "GUIA OPERATIVA", 1, height=30)
row = 3

def add_guide_block(title, body, fill=LIGHT_FILL, height=70):
    global row
    style_section_header(ws5, row, title, 1, fill=SUBHEADER_FILL)
    row += 1
    c = ws5.cell(row=row, column=1, value=body)
    c.font = BODY_FONT
    c.alignment = WRAP_TOP
    c.fill = fill
    c.border = BOX
    ws5.row_dimensions[row].height = height
    row += 2

add_guide_block(
    "TIP: COMPRAS EN WALMART / PUBLIX (HOLLYWOOD BEACH)",
    "Al llegar al departamento en Hollywood Beach, hacer una compra grande en Walmart o Publix (desayuno, "
    "snacks, agua, algo de cocina simple) en vez de comer afuera las 3 comidas. Con cocina disponible en el "
    "departamento esto reduce fuertemente el gasto diario de comida frente a los $60 USD/adulto/dia estimados "
    "en la Matriz Financiera para Universal + Miami.",
    height=70,
)
add_guide_block(
    "TIP: SEGURO DEL AUTO YA CUBIERTO (VISA SIGNATURE / AIG)",
    "La tarjeta Visa Signature (Argentina) tiene un beneficio de Danio a la Propiedad de Vehiculos Alquilados "
    "(CDW) provisto por AIG, sin costo adicional, valido a nivel mundial. Antes de contratar el CDW de la "
    "rentadora en Miami, confirmar con el banco emisor la vigencia y el tope de cobertura para esa tarjeta; "
    "si aplica, se puede rechazar el CDW de la rentadora y ahorrar ese costo en la Tabla 2 de la pestana "
    "'Logistica Terrestre y Vuelos'.",
    height=70,
)
add_guide_block(
    "TIP: EQUIPAJE EN EL TRAMO INTERNO MCO-MIA (17-feb)",
    "El grupo viaja con 21 bultos (7 valijas grandes + 7 carry-on + 7 mochilas). Para el vuelo domestico "
    "AA1741 MCO-MIA hay que despachar las valijas grandes igual que en un vuelo internacional; calcular al "
    "menos 2 horas de anticipacion en el aeropuerto de Orlando para no correr con el chequeo de equipaje.",
    height=60,
)

style_section_header(ws5, row, "FORMULA DE CONTROL DEL PRESUPUESTO TOTAL DEL GRUPO", 1, fill=SUBHEADER_FILL)
row += 1
formula_text = "C_total_grupo = N x ( C_hospedaje + C_atracciones + n x (C_comida + C_transporte_local) + C_seguro )"
c = ws5.cell(row=row, column=1, value=formula_text)
c.font = Font(name="Cambria Math", size=13, bold=True, italic=True)
c.alignment = Alignment(horizontal="center", vertical="center")
c.fill = LIGHT_FILL
c.border = BOX
ws5.row_dimensions[row].height = 40
row += 1
c2 = ws5.cell(row=row, column=1, value=(
    "Donde N = cantidad total de personas del grupo (7), n = cantidad de personas que comparten gastos "
    "diarios de comida y transporte local, C_hospedaje = costo de alojamiento, C_atracciones = costo de "
    "tickets a parques, C_comida = costo diario de comida por persona, C_transporte_local = costo diario de "
    "transporte local por persona, C_seguro = costo del seguro de asistencia medica internacional."
))
c2.font = Font(italic=True, size=9.5)
c2.alignment = WRAP_TOP
ws5.row_dimensions[row].height = 55

# ---------------------------------------------------------------------------
wb.save(OUTPUT_PATH)
print(f"Archivo generado: {OUTPUT_PATH}")
