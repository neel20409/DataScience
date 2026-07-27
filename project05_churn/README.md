# Project 5 — Customer Churn Predictor

Predicts whether a telecom customer will churn using ML.

## Key Challenge: Imbalanced Data
- 73.5% customers stay, 26.5% churn
- Used SMOTE to balance training data
- Evaluated with F1 score, not just accuracy

## Best Model: Gradient Boosting
| Metric | Score |
|---|---|
| F1 Score | 0.6117 |
| Accuracy | 0.7729 |
| Recall | 0.6738 |
| Precision | 0.5600 |

## Key Findings
- Month-to-month contracts have highest churn rate
- Fibre optic customers churn more than DSL
- New customers (low tenure) are most at risk
- High monthly charges correlate with churn

## Tech Stack
Python • Pandas • Scikit-learn • imbalanced-learn • SMOTE • Seaborn
