---
layout: page
title: Air Quality Geo Experiments
description: Applying a geo experiment methodology to estimate causal impact of worsening air quality on health outcomes in NYC.
img: assets/img/air_quality_geo_experiments/cover.png
importance: 1
category: work
related_publications: true
---

## **TL;DR**

This project explores whether worsening air quality causally increases emergency department visits for respiratory issues, using a geo experiment framework inspired by marketing attribution methods. By analyzing AQI and health data from the Bronx and Queens, and applying Google's Time-Based Regression (TBR) methodology, I attempt to quantify the causal effect of AQI spikes on health outcomes. While the model shows a positive point estimate (0.18 additional ED visits per 1-point AQI increase), the confidence interval includes zero, indicating the result is not statistically significant. Data limitations and weak pre-treatment matching likely impacted the estimate’s precision.

## **Background**

As the climate crisis worsens, air quality is becoming an increasingly urgent concern worldwide. Rising temperatures, more frequent storms, and intensifying wildfires all contribute to deteriorating air conditions. It is well documented that declines in air quality impact both short- and long-term public health. In particular, elevated concentrations of PM2.5, fine particulate matter measuring 2.5 micrometers or less, have been linked to a range of respiratory and cardiovascular problems. These microscopic particles can be inhaled deeply into the lungs, posing serious health risks.

On a personal note, poor air quality has directly affected my life. A “bad air day” in 2020 triggered a prolonged asthma flare-up, my first since childhood, which led to lingering respiratory issues. Since then, I’ve become more vigilant about tracking air quality, often using sites like PurpleAir.com to avoid flare-ups and observe patterns that tend to coincide with declines in air quality.

While interactive maps offer accessible visualizations, I had never delved into the underlying data. This project began with a question: Can I causally link decreases in air quality to negative health outcomes? While this question has been addressed extensively by experts, I saw an opportunity to explore it through a creative statistical lens, especially since much of the publicly cited air quality data tends to be correlational. Here, I set out to perform a true causal impact analysis.

---

## **Inspiration**

While at Pinterest, I worked primarily on marketing attribution, particularly incremental attribution, determining whether ads shown on the platform actually caused users to purchase a product. If users were going to purchase anyway, the ad had no incremental effect. However, proving that ads _caused_ purchases using data is extremely powerful.

Typically, this kind of causal inference is achieved through large-scale randomized controlled trials (RCTs), in which one group sees ads (treatment) and another does not (control), and their subsequent behaviors are compared.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/air_quality_geo_experiments/meta_conversion_lift.png" title="conversion lift" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Conversion lift experiment logic (source: Meta)
</div>

In recent years, growing privacy constraints have limited access to user-level data, making traditional RCTs more difficult to conduct. This has led to greater interest in geo experiments, or matched market tests. Geo experiments measure causal impact by comparing outcomes across non-overlapping geographic regions that are matched based on similar pre-treatment characteristics. One region in each pair receives the treatment, while the other serves as a control. This structure helps isolate treatment effects while accounting for local variation. Notably, Google and Meta have each released open-source tools for this purpose, `matched_markets` and `GeoLift`, respectively.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/air_quality_geo_experiments/geo_experiment.png" title="geo experiment" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Geo experiment logic (source: Wayfair)
</div>

In 2017, Google published _Estimating Ad Effectiveness using Geo Experiments in a Time-Based Regression Framework_ (Kerman, Wang, Vaver), which outlines an approach using Time-Based Regression (TBR). This methodology models pre-treatment time series data to predict counterfactual outcomes, enabling estimation of cumulative treatment effects, even with as few as one test and one control region.

<div class="row justify-content-sm-center">
    <div class="col-sm-8 mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/air_quality_geo_experiments/tbr_1.png" title="geo based regression" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm-4 mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/air_quality_geo_experiments/tbr_2.png" title="time based regression" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Geo-Based Regression (GBR) and Time-Based Regression (TBR) (source: Google)
</div>

---

## **Approach**

The TBR framework from Google seemed well-suited for estimating the causal impact of poor air quality on public health. Instead of ad spend as the treatment and sales revenue as the outcome, I substituted AQI as the treatment and emergency department (ED) visits for respiratory issues as the outcome. Since it's not feasible (or ethical) to deliberately manipulate air quality, I sought out natural experiments, instances where AQI in one geographic area suddenly diverges from a nearby matched area, likely due to localized events such as wildfires or wind shifts.

This divergence point serves as the treatment “intervention.” Health outcome data from both areas can then be analyzed using TBR to estimate causal impact.

In marketing, a key outcome is incremental return on ad spend (iROAS): how much revenue is generated for each additional dollar spent. In this context, the analogous question is: _For every 1-point increase in AQI, how many additional ED visits occur that wouldn’t have happened otherwise?_

---

## **Data**

To perform this analysis, I needed two types of data:

### Air Quality Data

The EPA’s Air Quality System (AQS) provides daily summary data on pollutants and meteorological conditions. I accessed this data via the AQS REST API, which offered flexible, reproducible data collection.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/air_quality_geo_experiments/epa_map.png" title="airnow map" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Interactive map of air quality data from EPA's Air Quality System (AQS) (source: EPA)
</div>

### Health Outcome Data

I used the NYC Department of Health's Syndromic Surveillance Data (SSD), which reports daily ED visits for asthma, respiratory disease, and other conditions. This dataset, covering all NYC ED visits from 2016 onward, can be filtered by zip code and age group. One limitation: the data reflects patient-reported symptoms rather than confirmed diagnoses.

Ideally, both datasets should be at the daily level to support time-series modeling.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/air_quality_geo_experiments/ssd.png" title="syndromic surveillance data" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Syndromic Surveillance Data (SSD) Tableau dashboard (source: NYC Dept. of Health)
</div>

### Notes on the Data

The AQS API was remarkably user-friendly and allowed bulk requests without apparent rate limits. Initially, I collected data at the CBSA level but later pivoted to site-level data focused on NYC boroughs after encountering inconsistencies in national health outcome data. This allowed me to build borough-level daily AQI datasets.

The SSD health data was more difficult to access. There was no API, and the Tableau dashboard required manually downloading small batches of data, one zip code at a time. Without a scraping solution, it was infeasible to collect years of daily data to match the AQI dataset.

---

## **Exploratory Findings**

Before modeling, I performed exploratory data analysis (EDA) to validate assumptions and better understand patterns, many of which aligned with anecdotal observations from years of casually monitoring PurpleAir maps.

At the CBSA level, I examined the 20 most populous areas and grouped them by region. Western CBSAs exhibited more AQI outlier days, likely due to wildfires and extreme weather, while Southeast CBSAs had lower and more stable AQI levels.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/air_quality_geo_experiments/cbsa_daily_data.png" title="daily cbsa aqi data from aqs" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Within each regional subplot are multiple time series for each CBSA within that region
</div>

Seasonally, AQI peaks in the summer months, with more extreme fluctuations. This is consistent with literature showing that sunlight and heat accelerate the formation of ground-level ozone, while stagnant air traps pollutants. Wildfires also tend to peak in the summer.

In the New York region, this seasonal AQI elevation recurs annually. To better visualize this in noisy data, I applied LOWESS smoothing.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/air_quality_geo_experiments/ny_smoothed.png" title="lowess smoothed ny aqi data" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

At the borough level, Brooklyn and Manhattan had substantial missing AQI data, so I focused on the Bronx and Queens. Though proper market-matching wasn’t conducted here, these two boroughs were selected based on data completeness.

The SSD health data was also noisy, and again I used LOWESS smoothing. For geo experiments, the quality of causal estimates depends on how well the pre-treatment time series from control and treatment geographies align. Encouragingly, Bronx and Queens ED visit trends followed each other closely.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/air_quality_geo_experiments/ed_visits_smoothed.png" title="lowess smoothed ny ed visit data" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

## **Final Dataset**

The final dataset consists of daily borough-level records, each with the average AQI and total ED visits due to asthma or respiratory symptoms. The structure is simple but sufficient.

```
<class 'pandas.core.frame.DataFrame'>
DatetimeIndex: 376 entries, 2023-02-09 to 2024-02-19
Data columns (total 4 columns):
 #   Column      Non-Null Count  Dtype
---  ------      --------------  -----
 0   bronx_aqi   376 non-null    float64
 1   queens_aqi  376 non-null    float64
 2   bronx_ed    376 non-null    float64
 3   queens_ed   376 non-null    float64
dtypes: float64(4)
memory usage: 14.7 KB
```

## **Analysis**

### Identify Natural Experiments

The key is to identify time periods when AQI in one borough (e.g., Queens) significantly diverges from the other (e.g., Bronx). These deviations serve as natural experiments.

I normalized AQI values using Z-scores and flagged days with a Z-score gap ≥ 0.5 as “divergent.” Only 16 such periods emerged, the longest being seven days starting on 2020-03-16, coinciding with the early COVID-19 outbreak, a major confounder.

A three-day period beginning on 2024-02-10 stood out as relatively clean.

**Geo experiment testing parameters:**

- Start date: February 10, 2024
- End date: February 12, 2024
- Pre-test window: 365 days
- Cooldown period: 7 days

### Model Pretest Relationship

I trained two linear regression models using pre-test data (Bronx as predictor, Queens as target) to forecast counterfactual values for AQI and ED visits in Queens.

Here are the results of the model for AQI data:

```
                            OLS Regression Results
==============================================================================
Dep. Variable:             queens_aqi   R-squared:                       0.978
Model:                            OLS   Adj. R-squared:                  0.978
Method:                 Least Squares   F-statistic:                 1.631e+04
Date:                Sun, 08 Jun 2025   Prob (F-statistic):          2.23e-304
Time:                        23:14:28   Log-Likelihood:                -982.93
No. Observations:                 366   AIC:                             1970.
Df Residuals:                     364   BIC:                             1978.
Df Model:                           1
Covariance Type:            nonrobust
==============================================================================
                 coef    std err          t      P>|t|      [0.025      0.975]
------------------------------------------------------------------------------
const         -0.3103      0.391     -0.794      0.428      -1.079       0.458
bronx_aqi      1.0428      0.008    127.700      0.000       1.027       1.059
==============================================================================
Omnibus:                       18.499   Durbin-Watson:                   1.846
Prob(Omnibus):                  0.000   Jarque-Bera (JB):               44.825
Skew:                          -0.165   Prob(JB):                     1.85e-10
Kurtosis:                       4.682   Cond. No.                         101.
==============================================================================

Notes:
[1] Standard Errors assume that the covariance matrix of the errors is correctly specified.
```

And here are the results of the second model for ED visit data:

```
  OLS Regression Results
==============================================================================
Dep. Variable:              queens_ed   R-squared:                       0.604
Model:                            OLS   Adj. R-squared:                  0.603
Method:                 Least Squares   F-statistic:                     554.8
Date:                Sun, 08 Jun 2025   Prob (F-statistic):           3.48e-75
Time:                        23:14:28   Log-Likelihood:                -1467.9
No. Observations:                 366   AIC:                             2940.
Df Residuals:                     364   BIC:                             2948.
Df Model:                           1
Covariance Type:            nonrobust
==============================================================================
                 coef    std err          t      P>|t|      [0.025      0.975]
------------------------------------------------------------------------------
const         10.1533      2.576      3.941      0.000       5.087      15.219
bronx_ed       0.6247      0.027     23.555      0.000       0.573       0.677
==============================================================================
Omnibus:                       11.289   Durbin-Watson:                   1.424
Prob(Omnibus):                  0.004   Jarque-Bera (JB):               11.450
Skew:                           0.419   Prob(JB):                      0.00326
Kurtosis:                       3.223   Cond. No.                         358.
==============================================================================

Notes:
[1] Standard Errors assume that the covariance matrix of the errors is correctly specified.
```

### Generate Counterfactual Predictions

Counterfactuals were generated across pre-test, test, and cooldown windows. Minimal difference during the pre-test period validates model fit.

The AQI model had a very high R² of 0.98, indicating a robust counterfactual. The ED visit model had a more modest R² of 0.60, which, although statistically significant, suggests greater uncertainty and wider confidence intervals around causal estimates.

### Estimate Effects

Causal effects are summarized with three visuals:

1. **Observed vs. counterfactual**
2. **Pointwise differences**
3. **Cumulative effect** over test + cooldown

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/air_quality_geo_experiments/aqi_panels.png" title="incrementality results for aqi" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/air_quality_geo_experiments/aqi_panels_zoomed.png" title="zoomed in incrementality results for aqi" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Counterfactual and incrementality results for AQI data, zoomed in results on right for clarity
</div>

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/air_quality_geo_experiments/ed_panels.png" title="incrementality results for ed" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/air_quality_geo_experiments/ed_panels_zoomed.png" title="zoomed in incrementality results for ed" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Counterfactual and incrementality results for ED visit data, zoomed in results on right for clarity
</div>

The result: a ratio of 0.18 ED visits per AQI point, with a 95% CI of [-1.09, 1.44]. Though the point estimate is positive, the confidence interval includes zero, indicating no statistically significant effect.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/air_quality_geo_experiments/incremental_estimate.png" title="final incremental estimate" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

---

## **Takeaways**

The primary limitation was the weaker-than-expected relationship between Bronx and Queens ED visits. This may stem from:

- A genuinely weaker correlation between the boroughs than hypothesized
- Incomplete or noisy data that masks the true relationship

While the adverse health impacts of PM2.5 are well-established, demonstrating this causal link at a borough-level scale using geo experiments is difficult. Data quality, availability, and geographic granularity present real challenges, ones that likely affect broader public health research as well.
