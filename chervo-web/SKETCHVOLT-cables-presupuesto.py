# SketchVolt / iLVolt — Presupuesto de cables (para el "lápiz inteligente")
# Guardado a pedido de Ángel para OTRA app / feature futura (no está integrado todavía).
# Metraje de cable unipolar UTE (2.5 mm² tomas, 1.0 mm² iluminación) con conductor de
# protección (tierra) en todos los circuitos. Tramo 1 automático por coordenadas
# (Manhattan) y Tramo 2 por los trazos del lápiz.

def calcular_presupuesto_cables(coordenadas_componentes, trazos_lapiz, x_tablero, y_tablero):
    """
    Calcula el metraje de cable unipolar (2.5mm y 1.0mm) para UTE.
    Maneja Tramo 1 automáticamente por coordenadas y Tramo 2 mediante el lápiz.
    Todos los circuitos incluyen conductor de protección (Tierra).
    """
    cable_tomas_25 = 0.0
    cable_iluminacion_10 = 0.0

    # Parámetros fijos de instalación (Metros)
    MARGEN = 0.40          # 20cm por punta para conexiones en cajas
    FACTOR_OBRA = 1.05     # 5% extra por desperdicio de corte

    # -------------------------------------------------------------
    # TRAMO 1: CÁLCULO AUTOMÁTICO (Fórmula de Manhattan)
    # -------------------------------------------------------------
    for componente in coordenadas_componentes:
        # Distancia ortogonal en planta (X, Y)
        distancia_plano = abs(componente["x"] - x_tablero) + abs(componente["y"] - y_tablero)

        if componente["tipo"] == "toma_corriente":
            # Diferencia vertical fija: 1.60m (tablero) - 0.30m (toma) = 1.30m
            caño_total = distancia_plano + 1.30
            # 3 hilos: Fase + Neutro + Tierra
            cable_tomas_25 += (caño_total + MARGEN) * 3

        elif componente["tipo"] in ["interruptor_comun", "interruptor_combinado"]:
            # Sin diferencia vertical (tablero y llaves a 1.60m)
            caño_total = distancia_plano
            # 3 hilos: Fase + Neutro + Tierra
            cable_iluminacion_10 += (caño_total + MARGEN) * 3

    # -------------------------------------------------------------
    # TRAMO 2: CÁLCULO DEL LÁPIZ (Interconexiones y bajadas)
    # -------------------------------------------------------------
    for trazo in trazos_lapiz:
        metros_2d = trazo["metros"]

        if trazo["tipo"] == "bajada_interruptor":
            # Subida vertical fija desde la llave al techo: 1.60m
            # 3 hilos: Fase + Retorno + Tierra
            cable_iluminacion_10 += (metros_2d + 1.60 + MARGEN) * 3

        elif trazo["tipo"] == "paralelo_lamparas":
            # Distribución plana por el techo (0m verticales adicionales)
            # 3 hilos: Neutro + Retorno + Tierra
            cable_iluminacion_10 += (metros_2d + MARGEN) * 3

        elif trazo["tipo"] == "combinada_puentes":
            # Subida y bajada vertical de las dos llaves (1.60m + 1.60m = 3.20m)
            # 4 hilos: 2 Puentes + Retorno/Fase + Tierra
            cable_iluminacion_10 += (metros_2d + 3.20 + MARGEN) * 4

    return {
        "cable_tomas_2.5mm_total_m": round(cable_tomas_25 * FACTOR_OBRA, 2),
        "cable_iluminacion_1.0mm_total_m": round(cable_iluminacion_10 * FACTOR_OBRA, 2)
    }
