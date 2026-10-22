#!/usr/bin/env python3
"""CFO Cockpit — Les Délices de Bourgogne SAS.

Lit l'Excel source (unique source de vérité), calcule les métriques,
écrit metrics.json puis injecte ce même JSON dans cockpit.html
(fichier autonome, ouvrable sans serveur).

Usage : python3 build_metrics.py [chemin_excel]
"""
import json
import sys
from datetime import date, datetime
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent
XLSX = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "data" / "CFO_Cockpit_Delices_de_Bourgogne_2026.xlsx"
OUT_JSON = ROOT / "metrics.json"
TEMPLATE = ROOT / "cockpit_template.html"
OUT_HTML = ROOT / "cockpit.html"

MOIS_ALL = ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"]
DATE_ARRETE = date(2026, 9, 30)
NB_MOIS = 9  # janv.–sept.
MOIS = MOIS_ALL[:NB_MOIS]
MOIS_LONG = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre"]
GAMMES = ["Moutardes", "Pain d'épices", "Crèmes de cassis", "Condiments"]
POSTES_CHARGES = [
    "Frais de personnel",
    "Loyers & charges locatives",
    "Transport & logistique",
    "Marketing & commercial",
    "Autres charges externes",
]
TRANCHES = ["Non échu", "1-30 j", "31-60 j", "61-90 j", "> 90 j"]
SEUIL_CONFORME_PCT = 2.0  # écart |%| sous lequel on parle de « conforme au budget »
TOL = 1.0  # tolérance de réconciliation en euros


# ---------------------------------------------------------------- formatage
def eur(x, signe=False):
    s = f"{abs(x):,.0f}".replace(",", " ")
    if signe:
        return ("+" if x >= 0 else "−") + s + " €"
    return ("−" if x < 0 else "") + s + " €"


def pct(x, signe=False, dec=1):
    s = f"{abs(x):.{dec}f}".replace(".", ",")
    if signe:
        return ("+" if x >= 0 else "−") + s + " %"
    return ("−" if x < 0 else "") + s + " %"


def pts(x):
    return ("+" if x >= 0 else "−") + f"{abs(x):.1f}".replace(".", ",") + " pt" + ("s" if abs(x) >= 2 else "")


def r2(x):
    return round(float(x), 2) + 0.0  # + 0.0 : évite les « −0 »


def lc(s):
    return s[0].lower() + s[1:] if s and not s[:2].isupper() else s


def ecart_pct(reel, budget):
    return None if budget == 0 else r2((reel - budget) / abs(budget) * 100)


# ---------------------------------------------------------------- lecture
def lire_pl(feuille):
    """Recalcule le P&L à partir des seules cellules saisies (pas des formules)."""
    df = pd.read_excel(XLSX, sheet_name=feuille, index_col=0)
    df = df[MOIS_ALL].apply(pd.to_numeric, errors="coerce")
    pl = {}
    for g in GAMMES:
        pl["CA " + g] = df.loc["CA " + g]
    pl["CA"] = sum(pl["CA " + g] for g in GAMMES)
    pl["Coût des ventes"] = df.loc["Coût des ventes"]
    pl["Marge brute"] = pl["CA"] - pl["Coût des ventes"]
    for p in POSTES_CHARGES:
        pl[p] = df.loc[p]
    pl["Charges d'exploitation"] = sum(pl[p] for p in POSTES_CHARGES)
    pl["EBITDA"] = pl["Marge brute"] - pl["Charges d'exploitation"]
    return pl, df


def valeurs_excel_cachees(feuille):
    """Valeurs calculées par Excel (data_only) — sert uniquement au contrôle."""
    df = pd.read_excel(XLSX, sheet_name=feuille, index_col=0, engine="openpyxl")
    return df


bud, _ = lire_pl("Budget_2026")
reel, reel_raw = lire_pl("Reel_2026")
n1, _ = lire_pl("Reel_2025")
ventes = pd.read_excel(XLSX, sheet_name="Ventes_Detail")
creances = pd.read_excel(XLSX, sheet_name="Creances_Clients")
hyp = pd.read_excel(XLSX, sheet_name="Hypotheses", index_col=0)["Valeur"]

anomalies = []
controles = []
observations = []


def controle(nom, ok, detail):
    controles.append({"controle": nom, "ok": bool(ok), "detail": detail})


# ---------------------------------------------------------------- contrôles de base
mois_reel_remplis = int(reel_raw.loc["CA Moutardes"].notna().sum())
controle("Réel 2026 renseigné jusqu'à septembre", mois_reel_remplis == NB_MOIS,
         f"{mois_reel_remplis} mois renseignés dans Reel_2026")
if mois_reel_remplis != NB_MOIS:
    anomalies.append({"gravite": "haute", "titre": "Période réelle incomplète",
                      "description": f"Reel_2026 contient {mois_reel_remplis} mois au lieu de {NB_MOIS}.",
                      "impact_eur": None})

# Recalcul Python vs valeurs Excel (formules)
for feuille, pl in (("Budget_2026", bud), ("Reel_2026", reel)):
    cache = valeurs_excel_cachees(feuille)
    for ligne_xl, cle in (("Chiffre d'affaires total", "CA"), ("Marge brute", "Marge brute"), ("EBITDA", "EBITDA")):
        diff = (pd.to_numeric(cache.loc[ligne_xl, MOIS], errors="coerce") - pl[cle][MOIS]).abs().max()
        ok = pd.notna(diff) and diff <= TOL
        controle(f"{feuille} — {ligne_xl} : recalcul = valeur Excel", ok,
                 "écart max " + (eur(diff) if pd.notna(diff) else "valeur Excel absente"))
        if not ok:
            anomalies.append({"gravite": "moyenne", "titre": f"Formule divergente ({feuille})",
                              "description": f"La ligne « {ligne_xl} » d'Excel ne correspond pas au recalcul depuis les postes saisis.",
                              "impact_eur": None if pd.isna(diff) else r2(diff)})

# Ventes_Detail : doublons de facture
ventes["mois"] = ventes["Date"].dt.month
ventes["Marge calc"] = ventes["CA HT"] - ventes["Coût de revient"]
cles_ligne = ["N° facture", "Date", "Client", "Produit", "Quantité", "CA HT"]
doublons_num = ventes[ventes["N° facture"].duplicated(keep=False)]
for num, grp in doublons_num.groupby("N° facture"):
    identiques = grp[cles_ligne].drop_duplicates().shape[0] == 1
    excedent = grp["CA HT"].iloc[1:].sum()
    anomalies.append({
        "gravite": "haute",
        "titre": f"Facture {num} saisie {len(grp)} fois dans Ventes_Detail",
        "description": (f"{grp['Client'].iloc[0]}, {grp['Produit'].iloc[0]}, {grp['Date'].iloc[0]:%d/%m/%Y} : "
                        + ("lignes strictement identiques" if identiques else "lignes différentes sous le même numéro")
                        + f". Le détail surestime le CA de {eur(excedent)} (marge {eur(grp['Marge calc'].iloc[1:].sum())}). "
                          "Non corrigé dans le cockpit : les ventes par client l'incluent."),
        "impact_eur": r2(excedent),
        "client": grp["Client"].iloc[0],
    })
controle("Unicité des n° de facture (Ventes_Detail)", doublons_num.empty,
         f"{doublons_num['N° facture'].nunique()} numéro(s) en doublon")

# Ventes_Detail vs P&L réel, par gamme et par mois
det = ventes.pivot_table(index="Gamme", columns="mois", values="CA HT", aggfunc="sum").reindex(GAMMES)
cogs_det = ventes.groupby("mois")["Coût de revient"].sum()
num_doublons = set(doublons_num["N° facture"])
ecarts_rec = []
for g in GAMMES:
    for m in range(1, NB_MOIS + 1):
        d, p = det.loc[g, m], reel["CA " + g].iloc[m - 1]
        if abs(d - p) > TOL:
            sous = ventes[(ventes["Gamme"] == g) & (ventes["mois"] == m)]
            dup = sous[sous["N° facture"].isin(num_doublons) & sous["N° facture"].duplicated()]["CA HT"].sum()
            ecarts_rec.append((g, m, d - p, dup))
for m in range(1, NB_MOIS + 1):
    d, p = cogs_det[m], reel["Coût des ventes"].iloc[m - 1]
    if abs(d - p) > TOL:
        ecarts_rec.append(("Coût des ventes", m, d - p, None))
for g, m, e, dup in ecarts_rec:
    if g == "Coût des ventes":
        explique = any(a.get("impact_eur") and "Facture" in a["titre"] for a in anomalies)
        desc = (f"{MOIS_ALL[m-1]} : coût de revient du détail {eur(e, True)} vs coût des ventes comptable."
                + (" Cohérent avec le doublon de facture ci-dessus." if explique else " Non expliqué."))
        anomalies.append({"gravite": "moyenne", "titre": f"Coût des ventes {MOIS_ALL[m-1]} : détail ≠ comptabilité",
                          "description": desc, "impact_eur": r2(e)})
        continue
    reste = e - (dup or 0)
    if dup and abs(reste) <= TOL:
        desc = f"{MOIS_ALL[m-1]} : détail {eur(e, True)} vs P&L, entièrement expliqué par le doublon de facture."
        grav = "moyenne"
    else:
        desc = (f"{MOIS_ALL[m-1]} : le détail des factures dépasse le CA comptable de {eur(e, True)}"
                + (f", dont {eur(dup)} expliqués par un doublon" if dup else "")
                + f". Reste {eur(reste, True)} sans explication dans le fichier (avoir non détaillé ? facture hors période ?). "
                  "À justifier par la comptabilité.")
        grav = "haute"
    anomalies.append({"gravite": grav, "titre": f"CA {g} {MOIS_ALL[m-1]} : détail ≠ comptabilité",
                      "description": desc, "impact_eur": r2(e)})
ca_det_ytd = float(ventes["CA HT"].sum())
ca_pl_ytd = float(reel["CA"][MOIS].sum())
controle("CA Ventes_Detail = CA comptable (YTD)", abs(ca_det_ytd - ca_pl_ytd) <= TOL,
         f"détail {eur(ca_det_ytd)} vs P&L {eur(ca_pl_ytd)} (écart {eur(ca_det_ytd - ca_pl_ytd, True)})")

# Observation N-1 : rupture de taux de marge
tm_n1 = float(n1["Marge brute"].sum() / n1["CA"].sum() * 100)
tm_bud_an = float(bud["Marge brute"].sum() / bud["CA"].sum() * 100)
if tm_bud_an - tm_n1 > 5:
    observations.append({
        "titre": "Rupture de taux de marge brute entre 2025 et 2026",
        "description": (f"Taux de marge brute 2025 réalisé : {pct(tm_n1)} ; budget 2026 : {pct(tm_bud_an)} "
                        f"({pts(tm_bud_an - tm_n1)}). Un tel saut doit être expliqué (prix, achats, ou changement "
                        "de périmètre du coût des ventes) avant toute comparaison N/N-1 ou tout forecast T4 basé sur 2025."),
    })


# ---------------------------------------------------------------- KPI mensuels + YTD
def serie(cle, unit="eur"):
    r = [r2(x) for x in reel[cle][MOIS]]
    b = [r2(x) for x in bud[cle][MOIS]]
    ry, by = r2(sum(r)), r2(sum(b))
    return {
        "unit": unit,
        "mensuel": {"reel": r, "budget": b,
                    "ecart": [r2(x - y) for x, y in zip(r, b)],
                    "ecart_pct": [ecart_pct(x, y) for x, y in zip(r, b)]},
        "ytd": {"reel": ry, "budget": by, "ecart": r2(ry - by), "ecart_pct": ecart_pct(ry, by)},
    }


def taux(num, den):
    rn, rd = reel[num][MOIS], reel[den][MOIS]
    bn, bd = bud[num][MOIS], bud[den][MOIS]
    r = [r2(a / b * 100) for a, b in zip(rn, rd)]
    b = [r2(a / c * 100) for a, c in zip(bn, bd)]
    ry, by = r2(rn.sum() / rd.sum() * 100), r2(bn.sum() / bd.sum() * 100)
    return {
        "unit": "pct",
        "mensuel": {"reel": r, "budget": b, "ecart": [r2(x - y) for x, y in zip(r, b)], "ecart_pct": None},
        "ytd": {"reel": ry, "budget": by, "ecart": r2(ry - by), "ecart_pct": None},
    }


kpis = {
    "ca": {"label": "Chiffre d'affaires", **serie("CA")},
    "marge_brute": {"label": "Marge brute", **serie("Marge brute")},
    "taux_marge": {"label": "Taux de marge brute", **taux("Marge brute", "CA")},
    "ebitda": {"label": "EBITDA", **serie("EBITDA")},
    "taux_ebitda": {"label": "Taux d'EBITDA", **taux("EBITDA", "CA")},
}
for g in GAMMES:
    kpis["ca_" + g] = {"label": "CA " + g, "gamme": g, **serie("CA " + g)}

gammes = [{"gamme": g, **kpis["ca_" + g]["ytd"], "part_reel": r2(kpis["ca_" + g]["ytd"]["reel"] / kpis["ca"]["ytd"]["reel"] * 100)}
          for g in GAMMES]
charges = [{"poste": p, "ytd_reel": r2(reel[p][MOIS].sum()), "ytd_budget": r2(bud[p][MOIS].sum()),
            "ecart": r2(reel[p][MOIS].sum() - bud[p][MOIS].sum()),
            "ecart_pct": ecart_pct(reel[p][MOIS].sum(), bud[p][MOIS].sum())} for p in POSTES_CHARGES]

# ---------------------------------------------------------------- pont EBITDA
ca_r, ca_b = reel["CA"][MOIS].sum(), bud["CA"][MOIS].sum()
tmb_r = reel["Marge brute"][MOIS].sum() / ca_r
tmb_b = bud["Marge brute"][MOIS].sum() / ca_b
eb_b, eb_r = bud["EBITDA"][MOIS].sum(), reel["EBITDA"][MOIS].sum()
etapes = [{"label": "EBITDA budget YTD", "valeur": r2(eb_b), "type": "total"},
          {"label": "Effet volume CA", "valeur": r2((ca_r - ca_b) * tmb_b), "type": "delta",
           "detail": f"({eur(ca_r)} − {eur(ca_b)}) × taux de marge budget {pct(tmb_b*100)}"},
          {"label": "Effet taux de marge", "valeur": r2((tmb_r - tmb_b) * ca_r), "type": "delta",
           "detail": f"({pct(tmb_r*100)} − {pct(tmb_b*100)}) × CA réel {eur(ca_r)}"}]
for c in charges:
    etapes.append({"label": c["poste"], "valeur": r2(-c["ecart"]), "type": "delta",
                   "detail": f"budget {eur(c['ytd_budget'])} − réel {eur(c['ytd_reel'])}"})
etapes.append({"label": "EBITDA réel YTD", "valeur": r2(eb_r), "type": "total"})
somme = eb_b + sum(e["valeur"] for e in etapes if e["type"] == "delta")
controle("Pont EBITDA bouclé (budget + effets = réel)", abs(somme - eb_r) <= TOL, f"écart de bouclage {eur(somme - eb_r)}")
pont = {"etapes": etapes, "ecart_total": r2(eb_r - eb_b),
        "methode": "Volume = ΔCA × taux de marge budget ; Taux = Δtaux de marge × CA réel ; charges = budget − réel (positif = favorable)."}

# ---------------------------------------------------------------- ventes clients
v_cli = ventes.pivot_table(index="Client", columns="mois", values="CA HT", aggfunc="sum", fill_value=0)
v_cli = v_cli.reindex(columns=range(1, NB_MOIS + 1), fill_value=0)
v_cli["total"] = v_cli.sum(axis=1)
v_cli = v_cli.sort_values("total", ascending=False)
marge_cli = ventes.groupby("Client")["Marge calc"].sum()
total_det = float(v_cli["total"].sum())
dup_par_client = {}
for a in anomalies:
    if a.get("client"):
        dup_par_client[a["client"]] = dup_par_client.get(a["client"], 0) + a["impact_eur"]
dup_mois = {}
for num, grp in doublons_num.groupby("N° facture"):
    for _, row in grp.iloc[1:].iterrows():
        dup_mois.setdefault(row["Client"], [0.0] * NB_MOIS)[int(row["mois"]) - 1] += float(row["CA HT"])
lignes = [{"client": c, "mensuel": [r2(x) for x in row[list(range(1, NB_MOIS + 1))]], "total": r2(row["total"]),
           "part": r2(row["total"] / total_det * 100),
           "taux_marge": r2(marge_cli[c] / row["total"] * 100),
           "dont_doublon": r2(dup_par_client.get(c, 0)),
           "doublon_mensuel": [r2(x) for x in dup_mois.get(c, [0.0] * NB_MOIS)]}
          for c, row in v_cli.iterrows()]
top5 = lignes[:5]
part_top5 = r2(sum(l["total"] for l in top5) / total_det * 100)
# le classement change-t-il sans les doublons ?
hors_dup = sorted(lignes, key=lambda l: l["total"] - l["dont_doublon"], reverse=True)
classement_stable = [l["client"] for l in hors_dup[:5]] == [l["client"] for l in top5]
clients = {"lignes": lignes, "top5": [l["client"] for l in top5], "part_top5": part_top5,
           "total_detail": r2(total_det), "classement_top5_stable_hors_doublon": classement_stable,
           "source": "Ventes_Detail (CA HT facturé, doublons non retirés)"}

# ---------------------------------------------------------------- créances
cr = creances.copy()
cr["retard_calc"] = (pd.Timestamp(DATE_ARRETE) - cr["Échéance"]).dt.days.clip(lower=0)


def tranche(j):
    return "Non échu" if j == 0 else "1-30 j" if j <= 30 else "31-60 j" if j <= 60 else "61-90 j" if j <= 90 else "> 90 j"


cr["tranche_calc"] = cr["retard_calc"].map(tranche)
diff_tr = (cr["tranche_calc"] != cr["Tranche"]).sum()
controle("Tranches de la balance âgée recalculées = Excel", diff_tr == 0, f"{diff_tr} facture(s) en écart")
if diff_tr:
    anomalies.append({"gravite": "moyenne", "titre": "Tranches de retard incohérentes",
                      "description": f"{diff_tr} facture(s) n'ont pas la même tranche dans Excel et au recalcul au 30/09.",
                      "impact_eur": None})
inconnues = set(cr["N° facture"]) - set(ventes["N° facture"])
controle("Factures en créance présentes dans Ventes_Detail", not inconnues, f"{len(inconnues)} facture(s) introuvable(s)")
# montant TTC dû vs facture HT x (1+TVA)
tva = {g: float(hyp["Taux de TVA alcools"]) if g == "Crèmes de cassis" else float(hyp["Taux de TVA produits alimentaires"]) for g in GAMMES}
fact_ttc = ventes.drop_duplicates(cles_ligne).assign(ttc=lambda d: d["CA HT"] * (1 + d["Gamme"].map(tva))).groupby("N° facture")["ttc"].sum()
cr["ttc_facture"] = cr["N° facture"].map(fact_ttc)
sup = cr[cr["Montant TTC"] > cr["ttc_facture"] + TOL]
controle("Créance ≤ montant TTC facturé", sup.empty, f"{len(sup)} créance(s) supérieure(s) à la facture d'origine")
for _, row in sup.iterrows():
    anomalies.append({"gravite": "moyenne", "titre": f"Créance {row['N° facture']} > facture",
                      "description": f"{row['Client']} : reste dû {eur(row['Montant TTC'])} pour une facture de {eur(row['ttc_facture'])} TTC.",
                      "impact_eur": r2(row["Montant TTC"] - row["ttc_facture"])})

tot_cr = float(cr["Montant TTC"].sum())
tranches = [{"tranche": t, "montant": r2(cr.loc[cr["tranche_calc"] == t, "Montant TTC"].sum()),
             "nb": int((cr["tranche_calc"] == t).sum())} for t in TRANCHES]
for t in tranches:
    t["part"] = r2(t["montant"] / tot_cr * 100)
cr["plus60"] = cr["retard_calc"] > 60
par_client = []
for c, g in cr.groupby("Client"):
    d = {t: r2(g.loc[g["tranche_calc"] == t, "Montant TTC"].sum()) for t in TRANCHES}
    p60 = r2(g.loc[g["plus60"], "Montant TTC"].sum())
    par_client.append({"client": c, "tranches": d, "total": r2(g["Montant TTC"].sum()), "plus_60": p60,
                       "part_plus_60": r2(p60 / g["Montant TTC"].sum() * 100), "nb_plus_60": int(g["plus60"].sum()),
                       "retard_max": int(g["retard_calc"].max())})
par_client.sort(key=lambda x: (-x["plus_60"], -x["total"]))
m60 = r2(cr.loc[cr["plus60"], "Montant TTC"].sum())
fact60 = cr[cr["plus60"]].sort_values("retard_calc", ascending=False)
factures_plus_60 = [{"facture": r["N° facture"], "client": r["Client"], "date": r["Date facture"].strftime("%d/%m/%Y"),
                     "echeance": r["Échéance"].strftime("%d/%m/%Y"), "montant": r2(r["Montant TTC"]),
                     "retard": int(r["retard_calc"])} for _, r in fact60.iterrows()]

# DSO — méthode par épuisement du CA TTC comptable (gère la saisonnalité)
ca_ttc = [sum(reel["CA " + g].iloc[m] * (1 + tva[g]) for g in GAMMES) for m in range(NB_MOIS)]
jours_mois = [31, 28, 31, 30, 31, 30, 31, 31, 30]
reste, dso = tot_cr, 0.0
for m in range(NB_MOIS - 1, -1, -1):
    if reste >= ca_ttc[m]:
        reste -= ca_ttc[m]
        dso += jours_mois[m]
    else:
        dso += reste / ca_ttc[m] * jours_mois[m]
        reste = 0
        break
dso_simple = tot_cr / sum(ca_ttc[6:9]) * sum(jours_mois[6:9])
obj_dso = float(hyp["Objectif DSO"])
creances_out = {
    "total": r2(tot_cr), "nb_factures": int(len(cr)), "tranches": tranches, "par_client": par_client,
    "plus_60": {"montant": m60, "part": r2(m60 / tot_cr * 100), "nb": int(cr["plus60"].sum()),
                "nb_clients": int(cr.loc[cr["plus60"], "Client"].nunique())},
    "echu": r2(cr.loc[cr["retard_calc"] > 0, "Montant TTC"].sum()),
    "factures_plus_60": factures_plus_60,
    "dso": {"jours": r2(dso), "objectif": obj_dso, "ecart": r2(dso - obj_dso), "jours_simple_3m": r2(dso_simple),
            "methode": "Épuisement : créances TTC imputées sur le CA TTC comptable des mois les plus récents (TVA 5,5 % alimentaire, 20 % crèmes de cassis)."},
    "ca_ttc_mensuel": [r2(x) for x in ca_ttc],
}

# ---------------------------------------------------------------- commentaires board (règles)
def qualif(e_pct):
    if e_pct is None:
        return "n/a"
    if abs(e_pct) < SEUIL_CONFORME_PCT:
        return "conforme"
    return "au-dessus" if e_pct > 0 else "en retrait"


k = kpis
deltas = [e for e in etapes if e["type"] == "delta"]
fav = max(deltas, key=lambda e: e["valeur"])
defav = min(deltas, key=lambda e: e["valeur"])

c_kpi = []
q = qualif(k["ca"]["ytd"]["ecart_pct"])
c_kpi.append(f"À fin septembre, le chiffre d'affaires cumulé atteint {eur(k['ca']['ytd']['reel'])}, "
             + ({"conforme": "conforme au budget", "au-dessus": "au-dessus du budget", "en retrait": "en retrait sur le budget"}[q])
             + f" ({eur(k['ca']['ytd']['ecart'], True)}, {pct(k['ca']['ytd']['ecart_pct'], True)}).")
c_kpi.append(f"Le taux de marge brute ressort à {pct(k['taux_marge']['ytd']['reel'])} contre {pct(k['taux_marge']['ytd']['budget'])} budgété "
             f"({pts(k['taux_marge']['ytd']['ecart'])}), et l'EBITDA à {eur(k['ebitda']['ytd']['reel'])}, "
             f"soit {eur(k['ebitda']['ytd']['ecart'], True)} ({pct(k['ebitda']['ytd']['ecart_pct'], True)}) vs budget.")
c_kpi.append(f"Principal frein sur l'EBITDA : {lc(defav['label'])} ({eur(defav['valeur'], True)}) ; "
             + ("principal soutien" if fav["valeur"] > 0 else "aucun effet favorable, le moins pénalisant étant")
             + f" : {lc(fav['label'])} ({eur(fav['valeur'], True)}).")

ec = k["ca"]["mensuel"]["ecart"]
n_sup = sum(1 for x in ec if x > 0)
i_max, i_min = ec.index(max(ec)), ec.index(min(ec))
eb_m = k["ebitda"]["mensuel"]["ecart"]
n_eb = sum(1 for x in eb_m if x > 0)
t3 = sum(ec[6:9])
if n_sup == 0:
    c_tend = [f"Le CA est sous le budget chaque mois depuis janvier : écart le plus faible en {MOIS_LONG[i_max]} ({eur(ec[i_max], True)}), "
              f"le plus marqué en {MOIS_LONG[i_min]} ({eur(ec[i_min], True)}). Le retard est structurel, pas accidentel."]
else:
    c_tend = [f"Le CA mensuel dépasse le budget {n_sup} mois sur {NB_MOIS} ; meilleur mois : {MOIS_LONG[i_max]} ({eur(ec[i_max], True)}), "
              f"plus faible : {MOIS_LONG[i_min]} ({eur(ec[i_min], True)})."]
c_tend.append(("L'EBITDA mensuel n'a battu le budget aucun mois. " if n_eb == 0 else f"L'EBITDA mensuel bat le budget {n_eb} mois sur {NB_MOIS}. ")
              + f"Sur le T3 (juil.–sept.), l'écart de CA cumulé est de {eur(t3, True)}, "
              f"contre {eur(sum(ec[0:6]), True)} sur le S1.")
if any(a["titre"].startswith("CA ") for a in anomalies):
    c_tend.append("Attention : le détail des ventes ne réconcilie pas avec la comptabilité sur certains mois (voir bloc Réconciliation).")

g_sorted = sorted(gammes, key=lambda g: g["ecart_pct"])
retrait = [g for g in gammes if g["ecart_pct"] <= -SEUIL_CONFORME_PCT]
c_gam = [("Toutes les gammes sont sous le budget. " if all(g["ecart"] < 0 for g in gammes) else "")
         + f"Meilleure gamme vs budget : {g_sorted[-1]['gamme']} ({pct(g_sorted[-1]['ecart_pct'], True)}, {eur(g_sorted[-1]['ecart'], True)}) ; "
         f"la plus en retrait : {g_sorted[0]['gamme']} ({pct(g_sorted[0]['ecart_pct'], True)}, {eur(g_sorted[0]['ecart'], True)})."]
gmax = max(gammes, key=lambda g: g["part_reel"])
c_gam.append(f"{gmax['gamme']} pèse {pct(gmax['part_reel'])} du CA cumulé.")
if retrait:
    c_gam.append(("" if len(retrait) == len(gammes) else f"{len(retrait)} gamme(s) sous le budget de plus de {pct(SEUIL_CONFORME_PCT, dec=0)} : "
                 + ", ".join(g["gamme"] for g in retrait) + ". ")
                 + "Le T4 est saisonnièrement décisif pour le pain d'épices et les crèmes de cassis : le budget y concentre "
                 + f"{pct((sum(bud['CA Pain d\'épices'][MOIS_ALL[9:]]) + sum(bud['CA Crèmes de cassis'][MOIS_ALL[9:]])) / (sum(bud['CA Pain d\'épices']) + sum(bud['CA Crèmes de cassis'])) * 100, dec=0)} de leur CA annuel.")

l1 = lignes[0]
c_cli = [f"Les 5 premiers clients ({', '.join(clients['top5'])}) concentrent {pct(part_top5)} du CA facturé ; "
         f"{l1['client']} est le premier avec {pct(l1['part'])}."]
if part_top5 > 60:
    c_cli.append("Concentration élevée : la perte ou la renégociation d'un seul compte majeur pèserait directement sur l'EBITDA.")
lm = min(lignes, key=lambda l: l["taux_marge"])
lM = max(lignes, key=lambda l: l["taux_marge"])
c_cli.append(f"Taux de marge par client : de {pct(lm['taux_marge'])} ({lm['client']}) à {pct(lM['taux_marge'])} ({lM['client']}).")
if dup_par_client:
    c_cli.append("Les montants incluent " + ", ".join(f"{eur(v)} de doublon chez {c}" for c, v in dup_par_client.items())
                 + (" ; le classement du top 5 reste inchangé hors doublon." if classement_stable else " ; hors doublon, le classement du top 5 change."))

ch_fav = [c for c in charges if c["ecart"] < -TOL]
c_pont = [f"L'EBITDA réel YTD ({eur(eb_r)}) s'écarte du budget ({eur(eb_b)}) de {eur(eb_r - eb_b, True)}.",
          f"L'effet volume CA vaut {eur(etapes[1]['valeur'], True)} et l'effet taux de marge {eur(etapes[2]['valeur'], True)}.",
          ]
ch_def = [c for c in charges if c["ecart"] > 0]
if ch_def:
    c_pont.append("Postes de charges en dépassement : " + ", ".join(f"{c['poste'].lower()} ({eur(c['ecart'], True)}, {pct(c['ecart_pct'], True)})"
                                                                   for c in sorted(ch_def, key=lambda c: -c["ecart"])) + ".")
if ch_fav:
    c_pont.append("Économies : " + ", ".join(f"{c['poste'].lower()} ({eur(-c['ecart'], True)})" for c in ch_fav) + ".")

p60 = creances_out["plus_60"]
c_cre = [f"Encours clients au 30/09 : {eur(tot_cr)} TTC sur {len(cr)} factures, dont {eur(creances_out['echu'])} échus "
         f"({pct(creances_out['echu'] / tot_cr * 100)})."]
if p60["part"] >= 10:
    top_p60 = [c for c in par_client if c["plus_60"] > 0][:2]
    c_cre.append(f"ALERTE : {eur(p60['montant'])} ({pct(p60['part'])} de l'encours, {p60['nb']} factures, {p60['nb_clients']} clients) ont plus de 60 jours de retard ; "
                 f"premiers concernés : " + ", ".join(f"{c['client']} ({eur(c['plus_60'])})" for c in top_p60) + ".")
else:
    c_cre.append(f"Le retard de plus de 60 jours reste contenu : {eur(p60['montant'])} ({pct(p60['part'])} de l'encours).")
c_cre.append(f"DSO de {creances_out['dso']['jours']:.0f} jours pour un objectif de {obj_dso:.0f} jours"
             + (f" : {creances_out['dso']['ecart']:.0f} jours de trop, soit environ {eur(creances_out['dso']['ecart'] * sum(ca_ttc[6:9]) / 92)} de trésorerie immobilisée."
                if creances_out["dso"]["ecart"] > 0 else " : objectif tenu."))

nb_haute = sum(1 for a in anomalies if a["gravite"] == "haute")
c_rec = ([f"{len(anomalies)} anomalie(s) de réconciliation détectée(s), dont {nb_haute} de gravité haute. "
          "Aucune n'a été corrigée : les chiffres du P&L proviennent de la comptabilité (Reel_2026), les ventes par client du détail des factures."]
         if anomalies else ["Aucune anomalie de réconciliation : détail des ventes, P&L et balance âgée concordent."])

# ---------------------------------------------------------------- simulation T4
# Méthode du forecast oct.–déc. (référence unique : le HTML ne fait qu'appliquer simuler()) :
#  1. CA par gamme : budget T4 × ratio réel/budget janv.–sept. de la gamme, réparti entre oct., nov. et déc.
#     selon la saisonnalité 2025 de cette gamme (poids de chaque mois dans son T4 2025).
#  2. Taux de marge brute : taux budget du mois + écart de taux constaté sur janv.–sept.
#  3. Charges : budget du mois × ratio réel/budget janv.–sept. du poste. Transport et marketing sont
#     variables (suivent le curseur CA), personnel suit son curseur, loyers et autres charges sont fixes.
#  4. IS : résultat fiscal assimilé à l'EBIT (EBITDA − dotations) ; taux réduit PME jusqu'au seuil, taux normal
#     au-delà ; acompte de décembre limité à l'IS restant dû ; solde = IS − acomptes.
#  5. Trésorerie au 31/12 : trésorerie au 30/09 + encaissements − décaissements oct.–déc.
#     Encaissements = créances 30/09 + CA TTC T4 − créances 31/12 (= CA TTC T4 × DSO / 92 j).
#     Fournisseurs, TVA et personnel : ratios cash/P&L observés sur janv.–sept. ; loyers et emprunt au dernier
#     montant observé ; aucun investissement prévu au T4.
T4 = MOIS_ALL[9:]
JOURS_T4 = 92
ratio_gamme = {g: float(reel["CA " + g][MOIS].sum() / bud["CA " + g][MOIS].sum()) for g in GAMMES}
saison = {g: [float(n1["CA " + g][m] / n1["CA " + g][T4].sum()) for m in T4] for g in GAMMES}
ca_gamme_t4 = {g: [float(bud["CA " + g][T4].sum()) * ratio_gamme[g] * w for w in saison[g]] for g in GAMMES}
ca_t4 = [sum(ca_gamme_t4[g][i] for g in GAMMES) for i in range(3)]
ttc_t4 = [sum(ca_gamme_t4[g][i] * (1 + tva[g]) for g in GAMMES) for i in range(3)]
ecart_tmb = float(tmb_r - tmb_b)
tmb_t4 = [float(bud["Marge brute"][m] / bud["CA"][m]) + ecart_tmb for m in T4]
ratio_poste = {p_: float(reel[p_][MOIS].sum() / bud[p_][MOIS].sum()) for p_ in POSTES_CHARGES}
charges_t4 = {p_: [float(bud[p_][m]) * ratio_poste[p_] for m in T4] for p_ in POSTES_CHARGES}
dot = pd.read_excel(XLSX, sheet_name="Reel_2026", index_col=0).loc["Dotations aux amortissements", MOIS_ALL]
dot_bud = pd.read_excel(XLSX, sheet_name="Budget_2026", index_col=0).loc["Dotations aux amortissements", MOIS_ALL]
dot_ytd = float(pd.to_numeric(dot[MOIS]).sum())
dot_t4 = [float(dot_bud[m]) for m in T4]

treso = pd.read_excel(XLSX, sheet_name="Tresorerie", index_col=0)[MOIS].apply(pd.to_numeric, errors="coerce")
flux_sortie = ["Décaissements fournisseurs", "Salaires nets", "Charges sociales", "TVA décaissée", "Acomptes d'IS",
               "Loyers", "Investissements", "Remboursement d'emprunt"]
treso_fin = float(treso.loc["Trésorerie début de mois", "Janv"] + treso.loc["Encaissements clients"].sum()
                  - treso.loc[flux_sortie].sum().sum())
treso_cache = pd.read_excel(XLSX, sheet_name="Tresorerie", index_col=0).loc["Trésorerie fin de mois", "Sept"]
controle("Trésorerie au 30/09 recalculée = Excel", abs(treso_fin - float(treso_cache)) <= TOL,
         f"recalcul {eur(treso_fin)} vs Excel {eur(float(treso_cache))}")
achats_ytd = sum(reel[k][MOIS].sum() for k in ("Coût des ventes", "Transport & logistique", "Marketing & commercial", "Autres charges externes"))
acomptes_verses = float(hyp["Acomptes d'IS versés 2026"])
nb_acomptes = int((treso.loc["Acomptes d'IS"] > 0).sum())
modele = {
    "mois": T4,
    "ca_gamme": {g: [r2(x) for x in v] for g, v in ca_gamme_t4.items()},
    "budget_ca_gamme": {g: [r2(x) for x in bud["CA " + g][T4]] for g in GAMMES},
    "ca": [r2(x) for x in ca_t4], "coef_ttc": [round(a / b, 6) for a, b in zip(ttc_t4, ca_t4)],
    "taux_marge": [round(x, 6) for x in tmb_t4],
    "charges": {p_: [r2(x) for x in v] for p_, v in charges_t4.items()},
    "charges_variables": ["Transport & logistique", "Marketing & commercial"],
    "dotations": dot_t4,
    "ytd": {"ca": r2(ca_r), "ebitda": r2(eb_r), "ebit": r2(eb_r - dot_ytd)},
    "budget": {"ca_annuel": r2(bud["CA"].sum()), "ebitda_annuel": r2(bud["EBITDA"].sum()),
               "ca_mensuel": [r2(x) for x in bud["CA"]], "ebitda_mensuel": [r2(x) for x in bud["EBITDA"]]},
    "reel": {"ca_mensuel": kpis["ca"]["mensuel"]["reel"], "ebitda_mensuel": kpis["ebitda"]["mensuel"]["reel"]},
    "is": {"taux_reduit": float(hyp["Taux d'IS réduit PME"]), "seuil": float(hyp["Seuil taux réduit"]),
           "taux_normal": float(hyp["Taux d'IS (normal)"]), "acomptes_verses": acomptes_verses,
           "acompte_unitaire": r2(acomptes_verses / nb_acomptes)},
    "treso": {"debut": r2(treso_fin), "creances_30_09": r2(tot_cr), "jours_t4": JOURS_T4,
              "ratio_fournisseurs": round(float(treso.loc["Décaissements fournisseurs"].sum() / achats_ytd), 6),
              "ratio_tva": round(float(treso.loc["TVA décaissée"].sum() / ca_r), 6),
              "ratio_personnel": round(float((treso.loc["Salaires nets"] + treso.loc["Charges sociales"]).sum() / reel["Frais de personnel"][MOIS].sum()), 6),
              "loyers_mois": r2(treso.loc["Loyers", "Sept"]), "emprunt_mois": r2(treso.loc["Remboursement d'emprunt", "Sept"]),
              "investissements_t4": 0.0},
}


def simuler(d_ca, d_marge_pts, d_perso, dso):
    """Réplique exacte de simuler() côté navigateur. d_ca, d_perso en fraction ; d_marge_pts en points."""
    m = modele
    ca = [x * (1 + d_ca) for x in m["ca"]]
    mb = [c * (t + d_marge_pts / 100) for c, t in zip(ca, m["taux_marge"])]
    ch = []
    for i in range(3):
        tot = 0.0
        for p_, v in m["charges"].items():
            k = (1 + d_ca) if p_ in m["charges_variables"] else (1 + d_perso) if p_ == "Frais de personnel" else 1
            tot += v[i] * k
        ch.append(tot)
    eb = [a - b for a, b in zip(mb, ch)]
    ca_an, eb_an = m["ytd"]["ca"] + sum(ca), m["ytd"]["ebitda"] + sum(eb)
    ebit = m["ytd"]["ebit"] + sum(eb) - sum(m["dotations"])
    I = m["is"]
    impot = 0.0 if ebit <= 0 else I["taux_reduit"] * min(ebit, I["seuil"]) + I["taux_normal"] * max(ebit - I["seuil"], 0)
    acompte_dec = min(I["acompte_unitaire"], max(0.0, impot - I["acomptes_verses"]))
    solde = impot - I["acomptes_verses"] - acompte_dec
    T = m["treso"]
    ttc = [c * k for c, k in zip(ca, m["coef_ttc"])]
    creances_fin = sum(ttc) * dso / T["jours_t4"]
    enc = T["creances_30_09"] + sum(ttc) - creances_fin
    achats = sum(ca[i] - mb[i] + sum(m["charges"][p_][i] * (1 + d_ca) if p_ in m["charges_variables"] else m["charges"][p_][i]
                                      for p_ in ("Transport & logistique", "Marketing & commercial", "Autres charges externes"))
                 for i in range(3))
    perso = sum(m["charges"]["Frais de personnel"]) * (1 + d_perso)
    dec = (achats * T["ratio_fournisseurs"] + sum(ca) * T["ratio_tva"] + perso * T["ratio_personnel"]
           + 3 * (T["loyers_mois"] + T["emprunt_mois"]) + T["investissements_t4"] + acompte_dec)
    return {"ca_annuel": r2(ca_an), "ebitda_annuel": r2(eb_an), "ecart_ca": r2(ca_an - m["budget"]["ca_annuel"]),
            "ecart_ebitda": r2(eb_an - m["budget"]["ebitda_annuel"]), "ebit": r2(ebit), "is": r2(impot),
            "acompte_dec": r2(acompte_dec), "solde_is": r2(solde), "creances_31_12": r2(creances_fin),
            "encaissements": r2(enc), "decaissements": r2(dec), "treso_fin": r2(T["debut"] + enc - dec),
            "ca_t4": [r2(x) for x in ca], "ebitda_t4": [r2(x) for x in eb]}


dso_central = round(float(creances_out["dso"]["jours"]))
scenarios = {
    "prudent": {"label": "Prudent", "d_ca": -10, "d_marge": -2, "d_perso": 3, "dso": 75},
    "central": {"label": "Central", "d_ca": 0, "d_marge": 0, "d_perso": 0, "dso": dso_central},
    "ambitieux": {"label": "Ambitieux", "d_ca": 10, "d_marge": 1.5, "d_perso": 0, "dso": int(obj_dso)},
}
for sc in scenarios.values():
    sc["resultat"] = simuler(sc["d_ca"] / 100, sc["d_marge"], sc["d_perso"] / 100, sc["dso"])
central = scenarios["central"]["resultat"]
simulation = {
    "modele": modele, "scenarios": scenarios,
    "curseurs": {"d_ca": {"min": -20, "max": 20, "pas": 1, "label": "Variation du CA T4", "unite": "%"},
                 "d_marge": {"min": -5, "max": 5, "pas": 0.5, "label": "Taux de marge brute T4", "unite": "pts"},
                 "d_perso": {"min": -10, "max": 10, "pas": 1, "label": "Frais de personnel T4", "unite": "%"},
                 "dso": {"min": 30, "max": 90, "pas": 1, "label": "DSO au 31/12", "unite": "j"}},
    "parametres": {"ratio_ca_gamme": {g: round(v, 4) for g, v in ratio_gamme.items()},
                   "saisonnalite_2025": {g: [round(x, 4) for x in v] for g, v in saison.items()},
                   "ecart_taux_marge_pts": round(ecart_tmb * 100, 2),
                   "ratio_charges": {p_: round(v, 4) for p_, v in ratio_poste.items()}},
    "methode": [
        "CA T4 par gamme = budget T4 de la gamme × ratio réel/budget janv.–sept. de la gamme ; répartition oct./nov./déc. selon la saisonnalité 2025 de la gamme.",
        f"Taux de marge brute T4 = taux budget du mois + écart constaté sur janv.–sept. ({pts(ecart_tmb * 100)}).",
        "Charges T4 = budget du mois × ratio réel/budget janv.–sept. du poste. Transport et marketing suivent le curseur CA ; personnel suit son curseur ; loyers et autres charges sont fixes.",
        f"IS : résultat fiscal assimilé à l'EBIT (aucune charge financière ni retraitement fiscal dans le fichier). {pct(modele['is']['taux_reduit']*100, dec=0)} jusqu'à {eur(modele['is']['seuil'])}, {pct(modele['is']['taux_normal']*100, dec=0)} au-delà. "
        f"Acomptes versés : {eur(acomptes_verses)} ; l'acompte de décembre ({eur(modele['is']['acompte_unitaire'])}) est limité à l'IS restant dû. Solde = IS − acomptes (payé en 2027).",
        f"Trésorerie au 31/12 = trésorerie au 30/09 ({eur(treso_fin)}) + encaissements − décaissements oct.–déc. Encaissements = créances au 30/09 + CA TTC T4 − créances au 31/12 (CA TTC T4 × DSO / {JOURS_T4} j). "
        "Fournisseurs, TVA et personnel : ratios cash/P&L observés sur janv.–sept. Loyers et emprunt au montant de septembre. Aucun investissement au T4 (aucune donnée).",
        "Limite : le taux de marge 2025 (44 %) est sans rapport avec 2026 (55 %) ; seule la saisonnalité du CA 2025 est utilisée, jamais sa marge.",
    ],
}
cs = scenarios["central"]
c_sim = [f"Scénario central (tendance janv.–sept. prolongée) : atterrissage CA 2026 à {eur(central['ca_annuel'])} ({eur(central['ecart_ca'], True)} vs budget) "
         f"et EBITDA à {eur(central['ebitda_annuel'])} ({eur(central['ecart_ebitda'], True)}).",
         f"IS estimé {eur(central['is'])}, solde à payer après acomptes {eur(central['solde_is'])} ; trésorerie fin décembre {eur(central['treso_fin'])}."]
pr, am = scenarios["prudent"]["resultat"], scenarios["ambitieux"]["resultat"]
c_sim.append(f"Fourchette d'EBITDA 2026 : {eur(pr['ebitda_annuel'])} (prudent) à {eur(am['ebitda_annuel'])} (ambitieux)"
             + (" : même le scénario ambitieux ne rattrape pas le budget annuel." if am["ecart_ebitda"] < 0 else "."))

# ---------------------------------------------------------------- export
metrics = {
    "meta": {"societe": "Les Délices de Bourgogne SAS", "exercice": 2026, "date_arrete": DATE_ARRETE.strftime("%d/%m/%Y"),
             "mois": MOIS, "source": XLSX.name, "genere_le": datetime.now().strftime("%d/%m/%Y %H:%M"),
             "seuil_conforme_pct": SEUIL_CONFORME_PCT},
    "kpis": kpis, "gammes": gammes, "charges": charges, "pont_ebitda": pont, "clients": clients,
    "creances": creances_out, "simulation": simulation,
    "reconciliation": {"anomalies": anomalies, "controles": controles, "observations": observations},
    "commentaires": {"kpis": c_kpi, "tendance": c_tend, "gammes": c_gam, "clients": c_cli, "pont": c_pont,
                     "creances": c_cre, "reconciliation": c_rec, "simulation": c_sim},
}
OUT_JSON.write_text(json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8")
html = TEMPLATE.read_text(encoding="utf-8").replace("/*__METRICS_JSON__*/null", json.dumps(metrics, ensure_ascii=False).replace("</", "<\\/"))
OUT_HTML.write_text(html, encoding="utf-8")

print(f"metrics.json et cockpit.html générés depuis {XLSX.name}")
print(f"  CA YTD {eur(ca_r)} | EBITDA YTD {eur(eb_r)} (budget {eur(eb_b)}) | DSO {dso:.1f} j")
print(f"  {len(anomalies)} anomalie(s), {sum(not c['ok'] for c in controles)} contrôle(s) KO sur {len(controles)}")
for a in anomalies:
    print(f"  [{a['gravite']}] {a['titre']}")
