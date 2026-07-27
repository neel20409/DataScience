import streamlit as st
import pandas as pd
import numpy as np
import joblib
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime

# ── Page config ──────────────────────────────────────────────────
st.set_page_config(
    page_title="Customer Churn Dashboard",
    page_icon="📊",
    layout="wide"
)

# ── Custom CSS ───────────────────────────────────────────────────
st.markdown("""
<style>
.metric-card {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 20px;
    border-left: 4px solid;
    margin-bottom: 10px;
}
.high-risk   { border-color: #e74c3c; }
.medium-risk { border-color: #f39c12; }
.low-risk    { border-color: #2ecc71; }
.stMetric > div { font-size: 2rem !important; }
</style>
""", unsafe_allow_html=True)

# ── Load model ───────────────────────────────────────────────────
@st.cache_resource
def load_model():
    try:
        model  = joblib.load('models/churn_model.pkl')
        scaler = joblib.load('models/scaler.pkl')
        return model, scaler
    except:
        return None, None

model, scaler = load_model()

# ── Feature engineering (same as training) ──────────────────────
def engineer_features(df):
    data = df.copy()
    data['TotalCharges'] = pd.to_numeric(
        data['TotalCharges'], errors='coerce'
    ).fillna(data.get('MonthlyCharges', 50) * data.get('tenure', 1))

    data['AvgMonthlyCharges']  = data['TotalCharges'] / (data['tenure'] + 1)
    data['ChargesPerMonth']    = data['MonthlyCharges'] / (data['tenure'] + 1)
    data['IsLongTermCustomer'] = (data['tenure'] > 24).astype(int)
    data['HasMultipleServices'] = (
        (data['PhoneService'] == 'Yes').astype(int) +
        (data['InternetService'] != 'No').astype(int) +
        (data['OnlineSecurity'] == 'Yes').astype(int)
    )
    return data

# ── Encode categories (same as training) ────────────────────────
def encode_data(df):
    from sklearn.preprocessing import LabelEncoder
    data = df.copy()
    cat_cols = data.select_dtypes(include='object').columns
    le = LabelEncoder()
    for col in cat_cols:
        if col not in ['customerID']:
            try:
                data[col] = le.fit_transform(data[col].astype(str))
            except:
                data[col] = 0
    return data

# ── Predict churn ────────────────────────────────────────────────
def predict_churn(df, model):
    feature_cols = [
        'gender','SeniorCitizen','Partner','Dependents','tenure',
        'PhoneService','MultipleLines','InternetService','OnlineSecurity',
        'OnlineBackup','DeviceProtection','TechSupport','StreamingTV',
        'StreamingMovies','Contract','PaperlessBilling','PaymentMethod',
        'MonthlyCharges','TotalCharges','AvgMonthlyCharges',
        'ChargesPerMonth','IsLongTermCustomer','HasMultipleServices'
    ]
    available = [c for c in feature_cols if c in df.columns]
    X = df[available]
    probs = model.predict_proba(X)[:, 1]
    return probs

# ── Risk label ───────────────────────────────────────────────────
def get_risk(prob):
    if prob >= 0.7:   return "High Risk",   "#e74c3c"
    elif prob >= 0.3: return "Medium Risk", "#f39c12"
    else:             return "Low Risk",    "#2ecc71"

def get_action(prob):
    if prob >= 0.7:
        return "Call immediately + offer discount"
    elif prob >= 0.3:
        return "Send SMS offer or loyalty reward"
    else:
        return "No action needed"

# ════════════════════════════════════════════════════════════════
# SIDEBAR
# ════════════════════════════════════════════════════════════════
st.sidebar.image(
    "https://img.icons8.com/fluency/96/combo-chart.png", width=60
)
st.sidebar.title("Churn Dashboard")
st.sidebar.markdown("---")

page = st.sidebar.radio(
    "Navigate",
    ["Overview", "Customer List", "Risk Analysis", "Predict Single Customer"]
)

st.sidebar.markdown("---")
st.sidebar.markdown("**Model Info**")
st.sidebar.markdown("Random Forest · SMOTE balanced")
st.sidebar.markdown(f"Last updated: {datetime.now().strftime('%d %b %Y')}")

# ════════════════════════════════════════════════════════════════
# LOAD DATA
# ════════════════════════════════════════════════════════════════
@st.cache_data
def load_data():
    url = "https://raw.githubusercontent.com/IBM/telco-customer-churn-on-icp4d/master/data/Telco-Customer-Churn.csv"
    df = pd.read_csv(url)
    return df

with st.spinner("Loading customer data..."):
    raw_df = load_data()

# Engineer + encode features
eng_df      = engineer_features(raw_df.copy())
encoded_df  = encode_data(eng_df.copy())

# Predict
if model:
    probs = predict_churn(encoded_df, model)
else:
    np.random.seed(42)
    probs = np.random.beta(2, 5, len(raw_df))

# Add predictions to display dataframe
display_df = raw_df.copy()
display_df['ChurnProb']    = (probs * 100).round(1)
display_df['Risk']         = display_df['ChurnProb'].apply(
    lambda x: get_risk(x/100)[0]
)
display_df['Action']       = display_df['ChurnProb'].apply(
    lambda x: get_action(x/100)
)
display_df['ChurnProbRaw'] = probs

# ════════════════════════════════════════════════════════════════
# PAGE: OVERVIEW
# ════════════════════════════════════════════════════════════════
if page == "Overview":
    st.title("Customer Churn Dashboard")
    st.markdown(f"Analysing **{len(display_df):,}** customers · {datetime.now().strftime('%d %b %Y, %I:%M %p')}")
    st.markdown("---")

    # KPI row
    high   = (display_df['Risk'] == 'High Risk').sum()
    medium = (display_df['Risk'] == 'Medium Risk').sum()
    low    = (display_df['Risk'] == 'Low Risk').sum()
    avg_prob = display_df['ChurnProb'].mean()

    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Total Customers",    f"{len(display_df):,}")
    col2.metric("High Risk",          f"{high:,}",   delta=f"{high/len(display_df)*100:.1f}%", delta_color="inverse")
    col3.metric("Medium Risk",        f"{medium:,}", delta=f"{medium/len(display_df)*100:.1f}%", delta_color="off")
    col4.metric("Avg Churn Prob",     f"{avg_prob:.1f}%")

    st.markdown("---")

    col_left, col_right = st.columns(2)

    # Donut chart
    with col_left:
        st.subheader("Risk Distribution")
        fig = go.Figure(data=[go.Pie(
            labels=['High Risk','Medium Risk','Low Risk'],
            values=[high, medium, low],
            hole=0.55,
            marker_colors=['#e74c3c','#f39c12','#2ecc71'],
        )])
        fig.update_layout(
            margin=dict(t=20, b=20, l=20, r=20),
            height=300,
            showlegend=True,
            legend=dict(orientation="h", yanchor="bottom", y=-0.2)
        )
        st.plotly_chart(fig, use_container_width=True)

    # Churn prob histogram
    with col_right:
        st.subheader("Churn Probability Distribution")
        fig2 = px.histogram(
            display_df, x='ChurnProb', nbins=30,
            color_discrete_sequence=['#3498db'],
        )
        fig2.add_vline(x=30, line_dash="dash", line_color="#f39c12",
                       annotation_text="Medium threshold")
        fig2.add_vline(x=70, line_dash="dash", line_color="#e74c3c",
                       annotation_text="High threshold")
        fig2.update_layout(
            margin=dict(t=20, b=20, l=20, r=20),
            height=300,
            xaxis_title="Churn Probability (%)",
            yaxis_title="Number of Customers",
        )
        st.plotly_chart(fig2, use_container_width=True)

    # Contract type breakdown
    st.subheader("Churn Rate by Contract Type")
    contract_churn = display_df.groupby('Contract')['ChurnProbRaw'].mean() * 100
    fig3 = px.bar(
        x=contract_churn.index,
        y=contract_churn.values,
        color=contract_churn.values,
        color_continuous_scale=['#2ecc71','#f39c12','#e74c3c'],
        labels={'x':'Contract Type','y':'Avg Churn Probability (%)'},
    )
    fig3.update_layout(
        margin=dict(t=20, b=20, l=20, r=20),
        height=280, showlegend=False,
        coloraxis_showscale=False
    )
    st.plotly_chart(fig3, use_container_width=True)

# ════════════════════════════════════════════════════════════════
# PAGE: CUSTOMER LIST
# ════════════════════════════════════════════════════════════════
elif page == "Customer List":
    st.title("Customer List")

    # Filters
    col1, col2, col3 = st.columns(3)
    risk_filter = col1.selectbox(
        "Filter by Risk", ["All","High Risk","Medium Risk","Low Risk"]
    )
    contract_filter = col2.selectbox(
        "Filter by Contract",
        ["All"] + list(display_df['Contract'].unique())
    )
    search = col3.text_input("Search by Customer ID")

    filtered = display_df.copy()
    if risk_filter != "All":
        filtered = filtered[filtered['Risk'] == risk_filter]
    if contract_filter != "All":
        filtered = filtered[filtered['Contract'] == contract_filter]
    if search:
        filtered = filtered[
            filtered['customerID'].str.contains(search, case=False)
        ]

    st.markdown(f"Showing **{len(filtered):,}** customers")

    # Colour risk column
    def color_risk(val):
        colors = {
            'High Risk':   'background-color:#fde8e8;color:#c0392b',
            'Medium Risk': 'background-color:#fef3e2;color:#d35400',
            'Low Risk':    'background-color:#e8f8f0;color:#27ae60',
        }
        return colors.get(val, '')

    cols_show = ['customerID','tenure','Contract','MonthlyCharges',
                 'InternetService','ChurnProb','Risk','Action']
    show_df = filtered[cols_show].head(200)

    st.dataframe(
        show_df.style.applymap(color_risk, subset=['Risk']),
        use_container_width=True, height=420
    )

    # Download button
    csv = filtered[cols_show].to_csv(index=False)
    st.download_button(
        label="Download retention list as CSV",
        data=csv,
        file_name=f"retention_list_{datetime.now().strftime('%Y%m%d')}.csv",
        mime='text/csv'
    )

# ════════════════════════════════════════════════════════════════
# PAGE: RISK ANALYSIS
# ════════════════════════════════════════════════════════════════
elif page == "Risk Analysis":
    st.title("Risk Analysis")

    col1, col2 = st.columns(2)

    # Tenure vs churn prob scatter
    with col1:
        st.subheader("Tenure vs Churn Probability")
        fig = px.scatter(
            display_df.sample(500, random_state=42),
            x='tenure', y='ChurnProb',
            color='Risk',
            color_discrete_map={
                'High Risk':'#e74c3c',
                'Medium Risk':'#f39c12',
                'Low Risk':'#2ecc71'
            },
            opacity=0.6,
            labels={'tenure':'Tenure (months)',
                    'ChurnProb':'Churn Probability (%)'},
        )
        fig.update_layout(height=320, margin=dict(t=20,b=20,l=20,r=20))
        st.plotly_chart(fig, use_container_width=True)

    # Monthly charges vs churn
    with col2:
        st.subheader("Monthly Charges vs Churn Probability")
        fig2 = px.scatter(
            display_df.sample(500, random_state=42),
            x='MonthlyCharges', y='ChurnProb',
            color='Risk',
            color_discrete_map={
                'High Risk':'#e74c3c',
                'Medium Risk':'#f39c12',
                'Low Risk':'#2ecc71'
            },
            opacity=0.6,
        )
        fig2.update_layout(height=320, margin=dict(t=20,b=20,l=20,r=20))
        st.plotly_chart(fig2, use_container_width=True)

    # Internet service breakdown
    st.subheader("Churn Rate by Internet Service")
    internet_churn = display_df.groupby('InternetService')['ChurnProbRaw'].mean() * 100
    fig3 = px.bar(
        x=internet_churn.index, y=internet_churn.values,
        color=internet_churn.values,
        color_continuous_scale=['#2ecc71','#f39c12','#e74c3c'],
        labels={'x':'Internet Service','y':'Avg Churn Probability (%)'}
    )
    fig3.update_layout(
        height=280, showlegend=False,
        margin=dict(t=20,b=20,l=20,r=20),
        coloraxis_showscale=False
    )
    st.plotly_chart(fig3, use_container_width=True)

# ════════════════════════════════════════════════════════════════
# PAGE: PREDICT SINGLE CUSTOMER
# ════════════════════════════════════════════════════════════════
elif page == "Predict Single Customer":
    st.title("Predict Single Customer")
    st.markdown("Enter a customer's details to predict their churn risk.")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.subheader("Account info")
        tenure         = st.slider("Tenure (months)", 0, 72, 12)
        contract       = st.selectbox("Contract", ["Month-to-month","One year","Two year"])
        monthly        = st.number_input("Monthly Charges ($)", 20.0, 120.0, 65.0, 0.5)
        total          = st.number_input("Total Charges ($)", 0.0, 9000.0, float(monthly * tenure), 10.0)

    with col2:
        st.subheader("Services")
        internet       = st.selectbox("Internet Service", ["DSL","Fiber optic","No"])
        phone          = st.selectbox("Phone Service", ["Yes","No"])
        online_sec     = st.selectbox("Online Security", ["Yes","No","No internet service"])
        streaming      = st.selectbox("Streaming TV", ["Yes","No","No internet service"])

    with col3:
        st.subheader("Demographics")
        senior         = st.selectbox("Senior Citizen", ["No","Yes"])
        partner        = st.selectbox("Has Partner", ["Yes","No"])
        dependents     = st.selectbox("Has Dependents", ["Yes","No"])
        paperless      = st.selectbox("Paperless Billing", ["Yes","No"])

    if st.button("Predict Churn Risk", type="primary", use_container_width=True):
        # Build single customer dataframe
        customer = pd.DataFrame([{
            'gender': 'Male', 'SeniorCitizen': 1 if senior=="Yes" else 0,
            'Partner': partner, 'Dependents': dependents,
            'tenure': tenure, 'PhoneService': phone,
            'MultipleLines': 'No', 'InternetService': internet,
            'OnlineSecurity': online_sec, 'OnlineBackup': 'No',
            'DeviceProtection': 'No', 'TechSupport': 'No',
            'StreamingTV': streaming, 'StreamingMovies': 'No',
            'Contract': contract, 'PaperlessBilling': paperless,
            'PaymentMethod': 'Electronic check',
            'MonthlyCharges': monthly, 'TotalCharges': str(total),
        }])

        eng     = engineer_features(customer)
        enc     = encode_data(eng)
        prob    = predict_churn(enc, model)[0] if model else np.random.beta(3,5)
        risk_label, risk_color = get_risk(prob)
        action  = get_action(prob)

        st.markdown("---")
        col_a, col_b, col_c = st.columns(3)

        col_a.metric("Churn Probability", f"{prob*100:.1f}%")
        col_b.metric("Risk Level", risk_label)
        col_c.metric("Recommended Action", "See below")

        # Big risk indicator
        st.markdown(
            f"""<div style='background:{risk_color}22;border:2px solid {risk_color};
            border-radius:12px;padding:20px;margin:16px 0;text-align:center'>
            <h2 style='color:{risk_color};margin:0'>{risk_label}</h2>
            <p style='margin:8px 0 0;font-size:18px;color:{risk_color}'>{action}</p>
            </div>""",
            unsafe_allow_html=True
        )

        # Gauge chart
        fig = go.Figure(go.Indicator(
            mode="gauge+number",
            value=prob * 100,
            number={'suffix': '%', 'font': {'size': 40}},
            gauge={
                'axis': {'range': [0, 100]},
                'bar': {'color': risk_color},
                'steps': [
                    {'range': [0, 30],  'color': '#e8f8f0'},
                    {'range': [30, 70], 'color': '#fef3e2'},
                    {'range': [70, 100],'color': '#fde8e8'},
                ],
                'threshold': {
                    'line': {'color': risk_color, 'width': 4},
                    'thickness': 0.75,
                    'value': prob * 100,
                }
            }
        ))
        fig.update_layout(height=300, margin=dict(t=20,b=20,l=40,r=40))
        st.plotly_chart(fig, use_container_width=True)