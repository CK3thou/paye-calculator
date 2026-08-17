import streamlit as st

# --- Page Config ---
st.set_page_config(
    page_title="PAYE Tax Calculator 2026",
    page_icon="🇿🇲",
    layout="centered"
)

# --- Custom Styling to match your HTML design ---
st.markdown("""
<style>
:root {
  --bg: #0f0e0c;
  --surface: #1a1814;
  --surface2: #232118;
  --border: #2e2b24;
  --gold: #c9a84c;
  --gold-light: #e8c96a;
  --text: #f0ead8;
  --text-muted: #8a8270;
  --green: #6aab7a;
}
.stApp {
  background-color: var(--bg);
  background-image: radial-gradient(ellipse at 20% 50%, rgba(201,168,76,0.04) 0%, transparent 60%),
                    radial-gradient(ellipse at 80% 20%, rgba(106,171,122,0.03) 0%, transparent 50%);
}
div[data-testid="stVerticalBlock"] > div {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 2px;
  padding: 2rem;
}
h1 {
  font-family: 'DM Serif Display', serif;
  color: #f0ead8 !important;
}
h1 span { color: var(--gold-light); font-style: italic; }
p, label, .stMarkdown { color: #f0ead8 !important; }
</style>
""", unsafe_allow_html=True)

# --- Header ---
st.markdown("""
<div style="margin-bottom:1rem">
  <div style="font-family:monospace; font-size:0.65rem; letter-spacing:0.2em; text-transform:uppercase; color:#c9a84c; opacity:0.8; margin-bottom:0.5rem">
  Effective PAYE Tax Calculator by Chishimba Kabwe
  </div>
  <h1>PAYE Tax <span>Calculator</span></h1>
  <p style="color:#8a8270 !important; font-size:0.85rem; margin-top:0.5rem">Zambia 2026 Tax Year</p>
</div>
""", unsafe_allow_html=True)

# --- Logic (from your HTML) ---
def calc_paye(monthly):
    bands = [
        {"limit": 5100, "rate": 0.0},
        {"limit": 7100, "rate": 0.20},
        {"limit": 9200, "rate": 0.30},
        {"limit": float('inf'), "rate": 0.37},
    ]
    remaining = monthly
    prev = 0
    total_tax = 0
    breakdown = []

    for band in bands:
        if remaining <= 0:
            break
        span = band["limit"] - prev
        taxable = min(remaining, span)
        tax = taxable * band["rate"]
        total_tax += tax
        breakdown.append({
            "rate": band["rate"],
            "taxable": taxable,
            "tax": tax,
            "from": prev,
            "to": band["limit"],
            "active": taxable > 0
        })
        remaining -= taxable
        prev = band["limit"]
    
    return total_tax, breakdown

def fmt(n):
    return f"K{n:,.2f}"

# --- Inputs ---
col1, col2 = st.columns([3, 1])
with col1:
    income = st.number_input("Gross Income (ZMW)", min_value=0.0, value=0.0, step=100.0, format="%.2f")

with col2:
    period = st.radio("Period", ["Monthly", "Annual"], horizontal=True, label_visibility="collapsed")
    st.markdown("<div style='margin-top:0.8rem'></div>", unsafe_allow_html=True)

monthly_income = income / 12 if period == "Annual" else income

if st.button("Calculate Tax", type="primary", use_container_width=True):
    if monthly_income <= 0:
        st.warning("Please enter a valid income amount.")
    else:
        total_tax, breakdown = calc_paye(monthly_income)
        napsa = min(monthly_income * 0.05, 1861.80)
        nhima = monthly_income * 0.01
        total_deductions = total_tax + napsa + nhima
        net = monthly_income - total_deductions
        eff_rate = (total_tax / monthly_income * 100) if monthly_income > 0 else 0

        st.markdown("### Tax Breakdown — 2026")
        
        labels = ["0%", "20%", "30%", "37%"]
        descs = [
            "First K5,100.00",
            "K5,100.01 – K7,100.00",
            "K7,100.01 – K9,200.00",
            "K9,200.01 and above"
        ]

        for i, b in enumerate(breakdown):
            active_style = "border-color: rgba(201,168,76,0.3); background: rgba(201,168,76,0.15);" if b["active"] and b["rate"] > 0 else ""
            active_color = "color:#e8c96a;" if b["active"] and b["rate"] > 0 else "color:#f0ead8;"
            st.markdown(f"""
            <div style="display:flex; align-items:center; gap:0.75rem; padding:0.7rem 1rem; background:#232118; border:1px solid #2e2b24; border-radius:2px; margin-bottom:0.5rem; {active_style}">
                <div style="font-family:monospace; font-size:0.7rem; color:#c9a84c; min-width:2.5rem; font-weight:500">{labels[i]}</div>
                <div style="flex:1; color:#8a8270; font-size:0.75rem">{descs[i]}</div>
                <div style="font-family:monospace; font-size:0.82rem; {active_color}">{fmt(b['tax']) if b['active'] else '—'}</div>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("---")
        
        c1, c2 = st.columns(2)
        with c1:
            st.metric("Gross (Monthly)", fmt(monthly_income))
            st.metric("NAPSA (5%)", fmt(napsa))
        with c2:
            st.metric("Total PAYE", fmt(total_tax))
            st.metric("NHIMA (1%)", fmt(nhima))
        
        st.markdown(f"""
        <div style="background: rgba(106,171,122,0.12); border:1px solid rgba(106,171,122,0.25); border-radius:2px; padding:1rem; display:flex; justify-content:space-between; align-items:center; margin-top:1rem">
            <div>
                <div style="font-family:monospace; font-size:0.65rem; letter-spacing:0.1em; text-transform:uppercase; color:#8a8270">Net Pay</div>
                <div style="font-size:0.6rem; color:rgba(106,171,122,0.6); letter-spacing:0.1em; text-transform:uppercase; font-family:monospace">After All Deductions</div>
            </div>
            <div style="font-family:serif; font-size:1.6rem; color:#6aab7a; font-weight:400">{fmt(net)}</div>
        </div>
        <div style="text-align:center; padding-top:1rem; margin-top:1rem; border-top:1px solid #2e2b24; font-family:monospace; font-size:0.75rem; color:#8a8270">
            Effective Tax Rate: <strong style="color:#c9a84c; font-size:1rem">{eff_rate:.2f}%</strong>
        </div>
        """, unsafe_allow_html=True)

        if period == "Annual":
            st.caption(f"Annual figures: Gross {fmt(income)} | Net Annual {fmt(net*12)} | Annual PAYE {fmt(total_tax*12)}")

st.caption("Bands: K0-5,100 @ 0%, K5,100.01-7,100 @ 20%, K7,100.01-9,200 @ 30%, K9,200.01+ @ 37% | NAPSA capped at K1,861.80")
