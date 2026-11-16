"""
Digital Twin of the Human Heart — Lumped-Parameter Cardiovascular Simulation Scaffold
Framework: FastAPI + NumPy + SciPy

NOTE: This is a documented research backend scaffold for external Python deployment.
In the Node.js web preview environment, the equivalent ODE solver runs natively in TypeScript
(src/simulation/cardioModel.ts). Do not represent this service as running unless deployed.
"""

from typing import List, Dict
import math
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(
    title="Cardiovascular Digital Twin Mathematical Engine",
    description="Educational 0D Lumped-Parameter Windkessel + Time-Varying Elastance Solver",
    version="0.1.0-prototype",
)


class SimulationParameters(BaseModel):
    heart_rate_bpm: float = Field(72.0, ge=30.0, le=220.0, description="Heart rate in beats/min")
    e_max_mmhg_ml: float = Field(2.3, ge=0.4, le=6.0, description="Peak systolic LV elastance (mmHg/mL)")
    e_min_mmhg_ml: float = Field(0.06, ge=0.02, le=0.3, description="Diastolic LV elastance (mmHg/mL)")
    v0_ml: float = Field(10.0, ge=0.0, le=40.0, description="Unstressed ventricular volume (mL)")
    r_sys_mmhg_s_ml: float = Field(1.05, ge=0.3, le=3.5, description="Systemic vascular resistance (mmHg*s/mL)")
    c_art_ml_mmhg: float = Field(1.45, ge=0.3, le=4.0, description="Systemic arterial compliance (mL/mmHg)")
    r_aortic_valve: float = Field(0.015, ge=0.005, le=0.5, description="Aortic valve resistance (mmHg*s/mL)")
    r_mitral_valve: float = Field(0.012, ge=0.005, le=0.5, description="Mitral valve resistance (mmHg*s/mL)")
    p_la_mmhg: float = Field(10.0, ge=2.0, le=30.0, description="Mean left atrial filling pressure (mmHg)")
    cycles: int = Field(3, ge=1, le=10, description="Number of cardiac cycles to integrate")
    dt_s: float = Field(0.002, ge=0.0005, le=0.01, description="Fixed RK2 integration time step (s)")


def normalized_double_hill_elastance(tau: float) -> float:
    """
    Stergiopulos et al. Double-Hill normalized time-varying elastance E_n(tau), tau in [0, 1].
    tau1 = 0.303, tau2 = 0.508, n1 = 1.32, n2 = 21.9 (normalized peak ~ 1.0).
    """
    tau_clamped = max(1e-6, tau % 1.0)
    a1 = (tau_clamped / 0.303) ** 1.32
    a2 = (tau_clamped / 0.508) ** 21.9
    raw = (a1 / (1.0 + a1)) * (1.0 / (1.0 + a2))
    return min(1.0, raw / 0.644)


@app.get("/health")
def health() -> Dict[str, str]:
    return {
        "status": "scaffold-ready",
        "model": "0D-TimeVaryingElastance-Windkessel",
        "disclaimer": "Educational and research prototype only. Not clinically validated.",
    }


@app.post("/simulate")
def run_simulation(params: SimulationParameters) -> Dict[str, object]:
    cycle_duration = 60.0 / params.heart_rate_bpm
    total_time = cycle_duration * params.cycles
    steps = int(total_time / params.dt_s)

    if steps > 50000:
        raise HTTPException(status_code=400, detail="Step count exceeds stability cap (50,000).")

    v_lv = 120.0
    p_ao = 80.0
    series: List[Dict[str, float]] = []

    for i in range(steps):
        t = i * params.dt_s
        tau = (t % cycle_duration) / cycle_duration
        en = normalized_double_hill_elastance(tau)
        e_t = params.e_min_mmhg_ml + (params.e_max_mmhg_ml - params.e_min_mmhg_ml) * en

        # P_ventricle(t) = E(t) * (V(t) - V0)
        p_lv = max(0.0, e_t * (v_lv - params.v0_ml))

        # Diode valve flows: Q = dP / R
        q_mv = max(0.0, (params.p_la_mmhg - p_lv) / params.r_mitral_valve)
        q_ao = max(0.0, (p_lv - p_ao) / params.r_aortic_valve)

        # Windkessel arterial compliance: C * dP/dt = Q_in - P_ao / R_sys
        dv_dt = q_mv - q_ao
        dp_ao_dt = (q_ao - (p_ao / params.r_sys_mmhg_s_ml)) / params.c_art_ml_mmhg

        v_lv = max(params.v0_ml + 5.0, min(260.0, v_lv + dv_dt * params.dt_s))
        p_ao = max(20.0, min(280.0, p_ao + dp_ao_dt * params.dt_s))

        if i % 5 == 0:
            series.append({
                "t": round(t, 4),
                "p_lv_mmhg": round(p_lv, 2),
                "v_lv_ml": round(v_lv, 2),
                "p_ao_mmhg": round(p_ao, 2),
                "q_ao_ml_s": round(q_ao, 2),
            })

    last_cycle = series[-int((cycle_duration / params.dt_s) / 5):]
    edv = max(pt["v_lv_ml"] for pt in last_cycle)
    esv = min(pt["v_lv_ml"] for pt in last_cycle)
    sv = max(0.0, edv - esv)
    ef = (sv / edv * 100.0) if edv > 0 else 0.0
    co = (params.heart_rate_bpm * sv) / 1000.0

    return {
        "summary": {
            "edv_ml": round(edv, 2),
            "esv_ml": round(esv, 2),
            "stroke_volume_ml": round(sv, 2),
            "ejection_fraction_pct": round(ef, 2),
            "cardiac_output_l_min": round(co, 2),
        },
        "time_series": series,
        "assumptions": [
            "0D lumped-parameter Windkessel approximation; spatial wave reflections neglected.",
            "Valves modeled as ideal unidirectional resistive diodes.",
            "Fixed left atrial preload pressure (P_la).",
        ],
    }
