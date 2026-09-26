---
title: "Beyond Words: Stylistic Signals in News Headline Source Classification"
summary: Classifying headlines as Fox News or NBC News from text alone, where punctuation, capitalization and length carry as much signal as vocabulary.
date: 2026-05-06
tags: [python, machine learning, nlp, classification]
thumbnail: ./top_features.png
authors: [Isaac Herman, Katie Steele]
links:
  - label: Code
    url: https://github.com/iherman10/cis-5190-news-classifier
  - label: Paper
    url: https://github.com/iherman10/cis-5190-news-classifier/blob/portfolio-charts/paper/main.pdf
---

## TL;DR

In this project, we investigate whether machine learning models can accurately classify digital news headlines from NBC News and Fox News, two of the most prominent outlets in American news media. Beyond vocabulary and topical content, we hypothesized that outlet signals would be present in the stylistic conventions each organization follows: punctuation choices, capitalization standards, and formatting patterns. Starting from a simple TF-IDF baseline, we built up to a stacking ensemble that achieves 81.2% accuracy on a held-out test set. Our results show that stylistic signals provide meaningful predictive power to complement traditional vocabulary-based features. This was a group project for CIS 5190 (Applied Machine Learning) at Penn in Spring 2026.

## Problem and Hypothesis

The task is binary: predict a headline's source, Fox News or NBC News, using only its text. Because these organizations cover the news from opposing editorial perspectives, we might expect these differences to show up in their headlines. Our style hypothesis was motivated by one group member's background in journalistic copy editing, where an organization's style guide governs punctuation, capitalization, and abbreviation standards, and may even set expectations for headline length and structure — suggesting these signals might vary predictably across outlets.

## Data

The final dataset is published on [Hugging Face](https://huggingface.co/datasets/iherman10/cis-5190-news-classifier-expanded-headlines).

### Scraping

We began with a course-supplied list of 3,805 article URLs split between Fox News and NBC News, scraping each with `requests` and `BeautifulSoup` and extracting the article headline from `<h1 class="headline speakable">` on Fox pages and the leading `<h1>` on NBC pages.

### Expansion

After our first leaderboard submission revealed a substantial accuracy drop relative to local cross-validation, we hypothesized distribution shift: the hidden test set appeared to draw from a later news cycle than the course-supplied URL list. To narrow that gap, we expanded the corpus by querying Google News RSS one `(source, topic, day)` slice at a time, combining the `site:foxnews.com` and `site:nbcnews.com` operators with twenty broad topics (politics, immigration, economy, foreign policy, sports, and similar) across every calendar day from 2025-11-01 through 2026-04-30; per-day slicing keeps each query under Google's roughly 100-result cap.

To prevent label leakage, we stripped trailing source-identifying suffixes such as "- Fox News" and "|NBC News" from RSS titles before retaining them. We then deduplicated the new rows exactly within source, downsampled per source to balance the new Fox/NBC counts, and removed any near-duplicates of the base scrape using a normalized (lowercased, alphanumerics-only) key.

### Cleaning

Exploratory analysis of the raw scraped text revealed several categories of invalid entries. We first removed Spanish-language content scraped from Fox's Latino News pages with a two-step filter combining Spanish word/character frequency counts with a ratio-based threshold. We then removed structural artifacts, including index pages, radio schedules, and podcast and episode titles. As a final safeguard, we dropped headlines outside a 25–140-character range, as these were typically bylines, page titles, or episode descriptions that would only introduce noise.

![Histogram and box plots of headline length by outlet before cleaning, 28,632 English headlines: NBC peaks around 75–80 characters and Fox around 80–100, with a spike of about 600 Fox entries under 20 characters and a thin right tail out past 150 characters.](./headline_length_raw.png)

*Headline length before cleaning. Note the cluster of very short Fox headlines (bylines, page titles) and the long right tail from Fox News Radio and other streaming/video episode titles.*

After cleaning, our dataset contained approximately 26,900 headlines (Fox: 12,338; NBC: 14,553). To address the moderate class imbalance, all of our modeling used a stratified 80/20 train/test split.

## Stylistic Signals

Before modeling, we investigated whether Fox and NBC headlines differed systematically in style. We computed chi-squared statistics and Cramér's V effect sizes across a set of candidate formatting features extracted from the raw headline text. We intentionally ran this analysis before applying our full cleaning pipeline, since that would have removed many of the stylistic cues we were interested in.

Our findings confirmed our hypothesis. Every feature below is significant at $p < 0.001$:

| Feature | $\chi^2$ | Cramér's V | NBC | Fox |
| --- | --: | --: | --: | --: |
| Length (mean chars) | 3171.66 | 0.333 | 72.0 | **78.4** |
| Capital letter count | 1787.39 | 0.250 | 3.8 | **5.3** |
| Period count | 1448.73 | 0.225 | **0.3** | 0.1 |
| All-caps word count | 400.64 | 0.118 | 0.3 | **0.4** |
| Uses "U.S." | 882.33 | 0.176 | **7.3%** | 0.4% |
| Is title case | 817.70 | 0.169 | 0.7% | **7.3%** |
| Uses "US" | 721.23 | 0.159 | 0.2% | **5.3%** |
| Contains colon | 526.81 | 0.136 | 11.5% | **21.5%** |
| Ends with period | 297.20 | 0.102 | **2.3%** | 0.1% |
| Contains double quote | 187.15 | 0.081 | 27.1% | **34.5%** |
| Contains single quote | 170.21 | 0.077 | 27.0% | **34.1%** |
| Contains hyphen | 47.94 | 0.041 | 9.6% | **12.1%** |

*The first four rows are counts (per-headline means); the rest are binary (share of headlines).*

On average, Fox headlines tended to be longer, used more colons and capital letters (including all-caps words), and favored "US" when referencing the United States. NBC headlines by contrast were more likely to use periods, both as a general punctuation style (including headline-ending periods) and in following the Associated Press Stylebook convention of "U.S." with internal punctuation.

These findings drove our modeling approach. Rather than stripping all punctuation and formatting during preprocessing, we normalized text by converting to lowercase and resolving encoding inconsistencies but otherwise deliberately preserved the stylistic differences we identified as predictive. The analysis motivated two key components of our pipeline: a character n-gram branch to capture subword punctuation patterns, and a dedicated style branch operating on raw text to encode the 12 handcrafted features above.

## Model Design

We developed the model in two phases so that gains could be attributed to specific changes: first, holding the classifier fixed at logistic regression and iterating on the feature representation, then holding the best feature pipeline fixed and iterating on the classifier. Models were promoted at each phase boundary by 5-fold cross-validation macro F1 on the training split.

### Feature Engineering

Working from a stopword-filtered TF-IDF baseline of 100 features (macro F1 = 0.5805), applying our text normalizer alone yielded no improvement (F1 = 0.5792), indicating that capacity, not normalization, was the binding constraint. Scaling the vocabulary to 5,000 features with bigrams and sublinear term frequencies jumped performance to F1 = 0.7389; character `wb` n-grams of length 3–5 captured the subword punctuation and capitalization signals identified in our EDA, lifting F1 to 0.7583.

Combining the word and character branches via `FeatureUnion` (our Hybrid pipeline) reached F1 = 0.7766, and adding the 12-feature style branch on *raw* text, since style features rely on caps and punctuation that the normalizer would otherwise smooth away, pushed our Hybrid v2 + style pipeline to F1 = 0.7899. A feature-level grid search on this final pipeline confirmed 5,000 word features, word n-grams of $(1,2)$, and character n-grams of $(4,6)$ as optimal, giving F1 = 0.7939.

![Dot plot of macro F1 and accuracy for 8 feature pipelines, each feeding logistic regression, with ±1 SD whiskers across 5 CV folds: Baseline and Cleaned sit near 0.58 F1, the Optimized v2 pipelines near 0.74, character n-grams near 0.76, the two Hybrid pipelines near 0.78, and Hybrid v2 + style highest at about 0.79.](./f1_accuracy_feature_pipelines.png)

*Feature-pipeline progression (5-fold CV on the training split)*

### Classifier Selection and Tuning

With the feature pipeline fixed, we swept nine classifier families. Logistic regression led at F1 = 0.7939, with SGD (0.7875), LinearSVC (0.7707), and random forest (0.7677) close behind; the Naive Bayes variants landed near 0.73, while AdaBoost, decision trees, and KNN trailed in the 0.65–0.69 range. That the linear models clustered at the top suggested that representation, not classifier capacity, was the binding constraint.

![Dot plot of macro F1 and accuracy for 9 classifiers on the tuned Hybrid v2 + style features: logistic regression and SGD lead near 0.79, Linear SVC and random forest follow near 0.77, the two Naive Bayes variants sit near 0.73, and AdaBoost, decision tree and KNN trail between 0.65 and 0.69.](./f1_accuracy_classifier_sweep.png)

*Classifier sweep on the tuned Hybrid v2 + style pipeline (5-fold CV)*

A hyperparameter grid search over the top four classifiers produced modest but uneven gains: LinearSVC saw the largest absolute lift (+0.022 to F1 = 0.7929), followed by SGD (+0.010 to 0.7972), random forest (+0.006 to 0.7737), and logistic regression, which was essentially flat at its default optimum. We excluded XGBoost because the grading environment ships only `numpy`, `pandas`, `torch`, `scikit-learn`, and `opencv-python`, so a pipeline including `xgboost` would fail at load.

### Ensembles

Finally, we explored three ensembling strategies on top of the four tuned base learners. A soft vote over the three probability-native classifiers (LR, SGD, RF) reached F1 = 0.8024; adding LinearSVC via `CalibratedClassifierCV` gave F1 = 0.8013; and a stacking classifier feeding all four into a logistic-regression meta-learner topped the group at F1 = 0.8030. Stacking won by only a hair, but we chose it because the meta-learner can learn non-uniform weights over base classifiers rather than averaging them, which is a better fit for a setting where the base models differ noticeably in CV F1.

![Dot plot of macro F1 and accuracy for 4 tuned classifiers and 3 ensembles: the stacking ensemble and both soft votes cluster just above 0.80 F1, tuned SGD, logistic regression and Linear SVC sit between 0.79 and 0.80, and random forest trails near 0.77, with overlapping whiskers among the top six.](./f1_accuracy_tuned_and_ensembles.png)

*Tuned classifiers and ensembles (5-fold CV)*

![ROC curves on the 20% held-out test split for 4 tuned classifiers and 3 ensembles: the stacking ensemble (AUC 0.892) and SGD (AUC 0.884) nearly overlap, and the other five models fall in a tight band with AUCs from 0.864 to 0.892, all well above the chance diagonal.](./roc_tuned_and_ensembles.png)

*ROC curves for the four tuned classifiers and three ensembles on the held-out test split*

The final submission combines the Hybrid v2 + style feature pipeline with the four-learner stacking ensemble.

### Neural Exploration

To investigate whether learned representations could improve on the traditional ensemble, we built a lightweight neural classifier in PyTorch. Unlike TF-IDF, which treats tokens independently, this model maps inputs to a 128-dimensional embedding, followed by a pooling layer and a two-layer MLP. We evaluated a text-only model and a hybrid model that concatenates our 12 stylistic features prior to the classification layer. The hybrid model achieved a macro F1 of 0.781 on the held-out test set, outperforming the text-only model (F1 = 0.769) and confirming that stylistic signals provide gains across model families. However, both models underperformed our stacking ensemble. Given the shortness of headlines and our dataset's scale, this was not particularly surprising.

## Results

The final stacking ensemble was evaluated once on the held-out 20% test split ($n = 5{,}379$), reaching **81.2% accuracy** with a macro F1 of 0.81. Per-class scores were balanced:

| Class | Precision | Recall | F1 | n |
| --- | --: | --: | --: | --: |
| NBC | 0.82 | 0.84 | 0.83 | 2,911 |
| Fox | 0.81 | 0.78 | 0.79 | 2,468 |

The model is slightly more conservative on Fox, given that precision exceeds recall. Test accuracy (0.8119) tracks the CV macro F1 of the same pipeline (0.8030) closely, suggesting our held-out estimate is well-calibrated and that we are not overfitting through grid search or ensemble selection.

Inspecting the logistic regression coefficients of the tuned Hybrid v2 + style pipeline confirms our central EDA hypothesis: stylistic features dominate the highest-weighted coefficients. Five of the ten highest-weighted features are handcrafted style signals, including headline length (+6.54), period count (−5.05), capitalization counts, and the binary "US" indicator (+3.20), recovering the same patterns surfaced by chi-squared testing. The remaining top features are vocabulary-based, with `fox` and `dem` weighted toward Fox and `kornacki` weighted toward NBC.

![Horizontal bar chart of the 10 largest logistic regression coefficients: headline length (about +6.5), capital letter count, all-caps word count, the word "fox", uses "US", the word "dem" and the word "dc" push toward Fox News; the word "kornacki", the character n-gram " a " and period count (about −5) push toward NBC.](./top_features.png)

*Top 10 features by absolute weight for the tuned logistic regression pipeline*

## Conclusion

News headlines carry distinct, learnable stylistic signatures that enable reliable source classification from text alone. The improvement from a simple TF-IDF baseline (macro F1 = 0.58) to our final model (+0.23 macro F1) was driven overwhelmingly by scaling vocabulary capacity, adding character n-grams, and incorporating handcrafted style features. Classifier selection and hyperparameter tuning contributed modestly by comparison.

Beyond topical differences, Fox and NBC headlines diverge systematically in capitalization, punctuation, and formatting that align with distinct editorial standards, and the consistency of these signals across both traditional and neural models reinforces this finding.

## Limitations and Future Work

Our dataset captures a single time window (2025-11 to 2026-04), and the model partially depends on time-sensitive vocabulary (e.g., anchor names like Kornacki, ongoing conflicts, and current political figures) that may not generalize to future news cycles. Similarly, style conventions could evolve as outlets update their guidelines, and model performance may degrade if they do. Future work should examine the temporal stability of both stylistic and topical features using longitudinal or rolling datasets, or explore pretrained transformer models to better disentangle style from content at larger scales.
