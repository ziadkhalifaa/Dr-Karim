# Patient Nutrition Assessment — Discovery & Specification

**Project:** Dr. Kareem Eliethy — Clinical Nutrition Platform
**Phase:** Discovery & Specification ONLY
**Status:** For review & approval. No code, no database, no backend implemented.

---

## 0. Context & Guardrails

The assessment is a **data-collection tool**. It feeds a future:
`Landing → Assessment → Patient Profile → Safety Check → Doctor Review → Personalized Nutrition Plan`

Hard rules:
- The platform **does NOT diagnose, prescribe, or recommend treatment** for any medical condition.
- No automatic plan generation. Anything medical requires a licensed doctor.
- The doctor reviews every completed assessment before any plan is produced.
- Red-flag logic only *labels* information for routing (normal queue vs urgent attention). It never decides care.
- **BMI is informational only in this version — it never triggers severity, diagnosis, or routing. Growth percentiles are NOT implemented** (no invented thresholds; any future percentile rule requires an explicitly approved clinical reference).

---

## 1. High-Level Flow

1. **Intro screen** — medical disclaimer (must be read before first question).
2. **Subject branching** — self vs. someone-else (assessed on behalf of another person; may be an adult or a child; contact person is captured separately).
3. **10 assessment sections** (adaptive — only relevant questions shown).
4. **Safety / Doctor Review summary screen** — flags surfaced, two required acknowledgements.
5. **Contact-capture step** (required: full name + phone) — the only handoff mechanism (no auth in this phase).
6. **Success screen** — reference number + next steps.
7. **Backend handoff (future)** — stored session → doctor review queue → profile → plan.

---

## 2. Section Overview (the 10 proposed sections)

| # | Section | Purpose |
|---|---------|---------|
| 01 | Basic Information | Subject + identity (name, age/DOB, sex) + contact-person/guardian branch |
| 02 | Body Measurements | Height/weight kg·cm only, growth context for minors |
| 03 | Goals | Primary goal + branch-specific questions |
| 04 | Medical & Health History | Conditions, pregnancy, red-flag screening |
| 05 | Medications | Meds, supplements, steroids, insulin |
| 06 | Lifestyle & Physical Activity | Activity, sleep, stress, smoking/alcohol |
| 07 | Eating Habits | Meal pattern, hydration, digestion, cooking |
| 08 | Food Preferences & Restrictions | Allergies, intolerances, dietary pattern, cravings |
| 09 | Lifestyle Challenges & Adherence | Barriers, confidence, follow-up preference |
| 10 | Safety / Doctor Review | Flag summary, confirmation + disclaimer acknowledgements |

Plus two steps outside the sections: **Intro (disclaimer)** before §01 and **Contact Capture** after §10.

---

## 3. Question-by-Question Specification

**Legend — Types:** `single` single-choice (radio) · `multi` multi-choice (checkbox) · `number` numeric with unit · `phone` · `email` · `text` short text · `textarea` · `scale` 1–N · `list` repeating rows · `consent` required checkbox · `toggle` yes/no
**Req:** `*` = required · `o` = optional · `c` = conditionally required

> **v2.0 curation note (2026-08):** the shipped form is a **curated subset** of the
> full catalog below to reduce drop-off. Removed questions: `Q02_03`, `Q02_05`,
> `Q02_08`, `Q03_04`, `Q03_L1–L3`, `Q03_G1–G4`, `Q03_M1`, `Q04_D4`, `Q04_IR1`,
> `Q04_H1`, `Q04_GI1`, `Q04_P1`, `Q06_04`, and contact `C07`/`C08` (email,
> best-time). **RS14** now triggers on cortisone/steroid use alone (`Q05_06` =
> `yes`/`previously`) — it no longer combines with the removed `Q03_G4`. Every
> red-flag feeding question is retained. `Contact` step = `C01–C06, C09`
> (C02/C03 shown only when assessing someone else or a minor).

### Section 01 — Basic Information

| Code | Question (AR) | Question (EN) | Type | Req | Branch / Condition | Validation | Data field |
|---|---|---|---|---|---|---|---|
| Q01_01 | هل التقييم ده ليك أنت ولا لشخص تاني (زي طفل)؟ | Is this assessment for yourself or for someone else (e.g., a child)? | single | * | none — **first question, loads intro first** | one of `self` / `someone_else` | `subject` |
| Q01_02 | إيه علاقتك بالشخص ده؟ — تُسجَّل كعلاقة **الشخص المسؤول عن التواصل** بالمريض | What is your relationship to this person? — recorded as the **contact person's** relationship to the patient | single | c | **visible only if `someone_else`** | parent / grandparent / sibling / spouse / legal_guardian / other | `contactPerson.relationship` |
| Q01_03 | الاسم الكامل للمريض | Patient full name | text | * | always | 2–100 chars | `patient.name` |
| Q01_04 | السن (بالسنين) | Age (in years) | number | * | always; **auto-derived from Q01_04a (DOB) when provided — age is retained as derived/calculated data** | 0–120; if <2 also ask months (Q01_04b, 0–11). Minor = <18 ⇒ growth branch in §02 | `patient.ageYears` |
| Q01_04a | (اختياري) تاريخ الميلاد | Date of birth (optional) | date | o | always | **optional — never required**; valid date ≤ today; when provided, age (Q01_04) is derived from it (warning only if mismatched) | `patient.dob` |
| Q01_04b | السن (بالشهور) | Age (in months) | number | c | only if age < 2 (from Q01_04 or derived) | 0–11 | `patient.ageMonths` |
| Q01_05 | الجنس | Sex at birth | single | * | always | female / male | `patient.sex` |
| Q01_06 | (أُزيلت — نُقلت إلى خطوة التواصل) رقم موبايل ولي الأمر | (removed) Guardian phone — **moved to Contact-Capture step (C04)** | — | — | Phone is captured once, at the required final handoff step (contact person's phone for `someone_else`; patient's phone for `self`) | — | — |

### Section 02 — Body Measurements (kg / cm only — no toggle)

| Code | Question (AR) | Question (EN) | Type | Req | Branch / Condition | Validation | Data field |
|---|---|---|---|---|---|---|---|
| Q02_01 | الطول (سم) | Height (cm) | number | * | always — **for minors this is height-for-age context** | 20–250 cm | `measures.heightCm` |
| Q02_02 | الوزن الحالي (كجم) | Current weight (kg) | number | * | always — **for minors this is weight-for-age context** | 1–400 kg | `measures.weightKg` |
| Q02_03 | محيط الرقبة (سم) — اختياري | Neck circumference (cm) — optional | number | o | adults only (age ≥ 18) | 20–100 | `measures.neckCm` |
| Q02_04 | محيط الخصر (سم) — اختياري | Waist circumference (cm) — optional | number | o | adults only | 20–250 | `measures.waistCm` |
| Q02_05 | محيط الأرداف (سم) — اختياري | Hip circumference (cm) — optional | number | o | adults only | 20–250 | `measures.hipCm` |
| Q02_06 | وزنك المستهدف (كجم) — اختياري | Target weight (kg) — optional | number | o | always | 1–400; cross-check vs goal (§03) — warning only, never blocking | `measures.targetKg` |
| Q02_07 | هل فيه قلق بخصوص نموه ووزنه؟ | Any concerns about growth or weight? | multi | o | **only if minor** (someone_else & <18) | losing weight / not gaining / gaining too fast / growth concerns / none — **guardian-reported ⇒ STANDARD flag (RS9); NO percentile threshold** | `measures.growthConcerns[]` |
| Q02_08 | ملاحظة عن القياسات | Anything about these measurements? | textarea | o | only if Q02_07 ≠ none | — | `measures.note` |

### Section 03 — Goals

| Code | Question (AR) | Question (EN) | Type | Req | Branch / Condition | Validation | Data field |
|---|---|---|---|---|---|---|---|
| Q03_01 | هدفك الأساسي؟ | What is your primary goal? | single | * | always (drives branches) | weight_loss / weight_gain / maintain_weight / manage_condition / better_habits / sports_performance / general_health | `goals.primary` |
| Q03_02 | صف النتيجة اللي بتتمناها | Describe the outcome you want | textarea | o | always | — | `goals.desiredOutcome` |
| Q03_03 | المدى الزمني المتوقع | Expected timeline | single | o | always | <1m / 1–3m / 3–6m / 6–12m / 12m+ / not_sure | `goals.timeline` |
| Q03_04 | إيه أكتر حاجة محفزاك؟ | What motivates you most? | text | o | always | — | `goals.motivation` |
| **Branch — weight_loss** | | | | | | | |
| Q03_L1 | إنت في وزنك الحالي من امتى؟ | How long have you been at/above this weight? | single | o | only if weight_loss | <1y / 1–3y / 3–5y / 5y+ | `goals.loss.duration` |
| Q03_L2 | جربت إيه قبل كده للخسارة؟ | What have you tried before? | multi | o | weight_loss | diet / exercise / fasting / supplements / medication / none | `goals.loss.attempts[]` |
| Q03_L3 | هل الوزن رجع بيفضل بعد ما ينزل؟ | Does weight usually return after losing? | toggle | o | weight_loss | yes/no | `goals.loss.weightCycling` |
| **Branch — weight_gain** | | | | | | | |
| Q03_G1 | إنت نحيف من امتى؟ | How long have you been underweight? | single | o | weight_gain | <1y / 1–3y / 3y+ | `goals.gain.duration` |
| Q03_G2 | جربت إيه قبل كده للزيادة؟ | What have you tried before? | multi | o | weight_gain | food / supplements / cortisone / nothing / other | `goals.gain.attempts[]` |
| Q03_G3 | شهيتك عامل إيه؟ | How is your appetite? | single | o | weight_gain | poor / normal / high | `goals.gain.appetite` |
| Q03_G4 | هل استخدمت كورتيزون/كورتون قبل كده عشان تزيد وزنك؟ (دلوقتي أو قبل كده) | Have you ever used cortisone/steroids to gain weight (now or before)? | single | * | **weight_gain only** — audience-critical | never / currently / previously | `goals.gain.cortisoneUse` — **prominent STANDARD / doctor-review flag if `currently` (RS14); NOT automatic URGENT — severity configurable in the future** |
| **Branch — maintain_weight** | | | | | | | |
| Q03_M1 | وزنك مستقر حاليًا؟ | Is your weight currently stable? | single | o | maintain_weight | yes / slowly_changing / uncertain | `goals.maintain.stability` |

### Section 04 — Medical & Health History

| Code | Question (AR) | Question (EN) | Type | Req | Branch / Condition | Validation | Data field |
|---|---|---|---|---|---|---|---|
| Q04_01 | عندك أي أمراض حاليًا أو سابقة؟ | Do you have any current or past medical conditions? | single | * | always — **if "No" skip Q04_02 details** | no / yes / prefer_not_to_say | `medical.hasConditions` |
| Q04_02 | اختار الأمراض اللي بتتعامل معاها | Select the conditions you are dealing with | multi | c | only if `yes`; **list is long → rendered as chips/dropdown, shown to all when yes** | diabetes / insulin_resistance / thyroid / hypertension / high_cholesterol / heart / kidney / fatty_liver / GI / celiac / PCOS / anemia / osteoporosis / autoimmune / eating_disorder / mental_health / cancer / other | `medical.conditions[]` |
| Q04_02o | (أمراض تانية) — لو اخترت "غير ذلك" | Other condition | text | c | required if `other` selected | 2–100 chars | `medical.otherCondition` |
| **Conditional detail blocks (doctor-review data, all optional unless noted)** | | | | | | | |
| Q04_D1 | نوع السكري | Diabetes type | single | c | only if `diabetes` | type1 / type2 / prediabetes / gestational | `medical.diabetes.type` |
| Q04_D2 | آخر تحليل سكر تراكمي HbA1c | Last HbA1c | number | o | diabetes | 3–20 (%) | `medical.diabetes.hba1c` |
| Q04_D3 | بيحصل معاك انخفاض سكر (هبوط)؟ كام مرة؟ | How often do you get hypoglycemia? | single | c | diabetes | never / monthly / weekly / daily — **`daily` + type 1 ⇒ URGENT (RU4); recurring hypo while on insulin ⇒ URGENT (RU9)** | `medical.diabetes.hypoFrequency` |
| Q04_D4 | إيه طريقة العلاج الحالية؟ | Current treatment | multi | o | diabetes | diet_only / tablets / insulin / other | `medical.diabetes.treatment[]` |
| Q04_IR1 | أعراض مقاومة الإنسولين؟ | Insulin-resistance symptoms? | multi | o | insulin_resistance | dark_patches / fatigue / cravings / weight_middle / none | `medical.insulinResistance.symptoms[]` |
| Q04_T1 | نوع الغدة؟ | Thyroid type | single | c | thyroid | hypo / hyper | `medical.thyroid.type` |
| Q04_H1 | آخر قراءة للضغط | Latest blood pressure | text | o | hypertension | e.g. "130/85" | `medical.hypertension.reading` |
| Q04_GI1 | إيه مشاكل الجهاز الهضمي؟ | Which GI issues? | multi | o | GI | IBS / IBD / GERD / gastritis / other | `medical.gi.types[]` |
| Q04_P1 | هل عندك تكيس المبايض؟ | PCOS | toggle | o | PCOS | yes/no | `medical.pcos` |
| Q04_E1 | هل عندك تاريخ مع اضطرابات الأكل؟ | Do you have a history of eating disorders? | single | * | always — **sensitive, always phrased gently** | never / currently / past / prefer_not_to_say — **`currently` ⇒ URGENT (RU1)** | `medical.eatingDisorder` |
| Q04_MH1 | بتتعامل مع اكتئاب أو قلق؟ | Do you deal with depression or anxiety? | single | o | always | no / currently / past / prefer_not_to_say — Standard flag | `medical.mentalHealth` |
| Q04_C1 | هل بتاخد علاج كيماوي/إشعاعي حاليًا؟ | Are you in active cancer treatment? | toggle | o | cancer | yes/no — **yes ⇒ URGENT (RU8)** | `medical.cancerActive` |
| Q04_03 | هل أنتِ حامل أو مرضع؟ | Are you pregnant or breastfeeding? | single | c | **females 12–55 only — visibility rule configurable for future clinical review** | not_applicable / not_pregnant / pregnant / breastfeeding / prefer_not_to_say — **pregnant + chronic condition ⇒ URGENT (RU7); pregnancy alone ⇒ STANDARD / doctor-required review (RS7)** | `medical.pregnancy` |
| Q04_04 | هل حصل تغير كبير في وزنك آخر 6 شهور **من غير قصد**؟ | Any large unintentional weight change in the last 6 months? | single | * | always | lost / gained / stable / prefer_not_to_say | `medical.weightChange` |
| Q04_04b | تقريبًا كام كيلو (غير مقصود)؟ | Approx. how many kg (unintentional)? | number | c | only if lost/gained | 0–100 — **lost >10% body weight ⇒ URGENT (RU3)**; **applies to all ages including minors (no separate child rule)** | `medical.weightChangeKg` |
| Q04_05 | هل عملت عملية تحويل مسار/تكميم سابقة، أو مخطّط لها؟ | Past or planned bariatric surgery? | single | o | always | none / past / ongoing / planned — **`ongoing` (≤12m) or `planned` ⇒ URGENT (RU6)** | `medical.bariatric` |
| Q04_06 | هل تعاني حاليًا من أي عرض من دول؟ | Do you currently have any of these? | multi | o | always | chest_pain / breathlessness_at_rest / fainting / severe_abdominal_pain / none — **any symptom ⇒ URGENT (RU2)** | `medical.acuteSymptoms[]` |
| Q04_07 | هل سبق واستشرت استشاري تغذية؟ | Have you consulted a nutritionist before? | toggle | o | always | yes/no | `medical.priorNutrition` |

### Section 05 — Medications

| Code | Question (AR) | Question (EN) | Type | Req | Branch / Condition | Validation | Data field |
|---|---|---|---|---|---|---|---|
| Q05_01 | هل بتاخد أدوية حاليًا؟ | Do you currently take any medication? | single | * | always | no / yes / prefer_not_to_say | `medications.onMedications` |
| Q05_02 | الأدوية (اسم / جرعة / سبب) | Medications (name / dose / reason) | list | c | **at least one row required if `yes`** | name required ≤100ch; dose/purpose optional | `medications.items[]` |
| Q05_03 | مكملات غذائية؟ | Supplements? | list | o | always | name optional | `medications.supplements[]` |
| Q05_04 | بتاخد إنسولين؟ | Do you take insulin? | toggle | o | only if diabetes | yes/no | `medications.insulin` |
| Q05_05 | أعشاب أو أدوية بدون وصفة؟ | Herbal / over-the-counter products? | list | o | always | name optional | `medications.herbal[]` |
| Q05_06 | هل بتاخد كورتيزون حاليًا؟ | Do you currently take cortisone/steroids? | single | * | always | never / yes / previously | `medications.steroids` — **`yes` or `previously` ⇒ prominent STANDARD / doctor-review flag (RS14); NOT automatic URGENT** |

### Section 06 — Lifestyle & Physical Activity

| Code | Question (AR) | Question (EN) | Type | Req | Branch / Condition | Validation | Data field |
|---|---|---|---|---|---|---|---|
| Q06_01 | كام مرة بتمارس نشاط بدني في الأسبوع؟ | Exercise frequency per week? | single | * | always | none / 1–2 / 3–4 / 5+ | `lifestyle.activityFrequency` |
| Q06_02 | نوع النشاط؟ | Type of activity? | multi | o | always | walking / cardio / strength / gym / sports / home | `lifestyle.activityTypes[]` |
| Q06_03 | كام ساعة قاعد بدون حركة يوميًا؟ | Sedentary hours per day? | number | o | show emphasized if `none` | 0–24 | `lifestyle.sedentaryHours` |
| Q06_04 | طبيعة شغلك؟ | Occupation type? | single | o | adults | sedentary / light / moderate / heavy / student / retired | `lifestyle.occupation` |
| Q06_05 | كام ساعة نوم يوميًا؟ | Hours of sleep per night? | number | o | adults | 0–24 (0.5 steps) — **<6 ⇒ Standard flag** | `lifestyle.sleepHours` |
| Q06_06 | نظام شغلك؟ | Work schedule? | single | o | always | regular / shifts / night / other | `lifestyle.schedule` |
| Q06_07 | مستوى التوتر؟ | Stress level? | single | o | always | low / moderate / high | `lifestyle.stress` |
| Q06_08 | التدخين؟ | Smoking? | single | o | adults | no / yes / former — Standard flag | `lifestyle.smoking` |
| Q06_09 | الكحول؟ | Alcohol? | single | o | adults | never / occasionally / weekly / daily — Standard flag | `lifestyle.alcohol` |

### Section 07 — Eating Habits

| Code | Question (AR) | Question (EN) | Type | Req | Branch / Condition | Validation | Data field |
|---|---|---|---|---|---|---|---|
| Q07_01 | كام وجبة في اليوم؟ | Meals per day? | number | o | always | 0–10 | `eating.mealCount` |
| Q07_02 | كام سناكس؟ | Snacks per day? | number | o | always | 0–10 | `eating.snackCount` |
| Q07_03 | بتفوت وجبات؟ | Do you skip meals? | single | o | always | no / yes | `eating.skipMeals` |
| Q07_03b | أي وجبات؟ | Which meals? | multi | c | only if yes | breakfast / lunch / dinner | `eating.skippedMeals[]` |
| Q07_04 | بتاكل فين غالبًا؟ | Where do you mostly eat? | single | o | always | home / outside / delivery / mixed | `eating.mealSource` |
| Q07_05 | كام كوباية ميه في اليوم؟ | Glasses of water per day? | number | o | always | 0–30 | `eating.waterGlasses` |
| Q07_06 | مشروبات غازية/سكرية في اليوم؟ | Sugary drinks per day? | number | o | always | 0–20 | `eating.sugaryDrinks` |
| Q07_07 | وجبات سريعة في الأسبوع؟ | Fast food per week? | number | o | always | 0–14 | `eating.fastFoodWeekly` |
| Q07_08 | بتاكل بالليل؟ | Late-night eating? | single | o | always | never / rarely / sometimes / often | `eating.nightEating` |
| Q07_09 | شهيتك؟ | Appetite? | single | o | always | poor / normal / high | `eating.appetite` |
| Q07_10 | مشاكل هضمية؟ | Digestive issues? | multi | o | always | bloating / constipation / diarrhea / reflux / none — doctor-review | `eating.digestive[]` |
| Q07_11 | كافيين (كوبايات في اليوم)؟ | Caffeine (cups/day)? | number | o | always | 0–20 | `eating.caffeineCups` |
| Q07_12 | بتعرف تطبخ؟ | Cooking ability? | single | o | always | i_cook / partially / limited / no_cooking | `eating.cooking` |

### Section 08 — Food Preferences & Restrictions

| Code | Question (AR) | Question (EN) | Type | Req | Branch / Condition | Validation | Data field |
|---|---|---|---|---|---|---|---|
| Q08_01 | عندك حساسية من أكلة معينة؟ | Do you have food allergies? | single | * | always | no / yes / prefer_not_to_say | `preferences.allergies.has` |
| Q08_02 | الحساسية (اسم / رد الفعل) | Allergies (name / reaction) | list | c | **at least one required if `yes`** | name required; reaction: mild / moderate / severe / **anaphylaxis** — **anaphylaxis ⇒ URGENT (RU5)** | `preferences.allergies.items[]` |
| Q08_03 | حساسية لبن/غلوتين (عدم تحمّل)؟ | Intolerances? | multi | o | always | lactose / gluten / fructose / FODMAP / none / other | `preferences.intolerances[]` |
| Q08_04 | النمط الغذائي؟ | Dietary pattern? | multi | o | always | balanced / vegetarian / vegan / keto / low_carb / low_fat / high_protein / intermittent_fasting / other | `preferences.dietPattern[]` |
| Q08_05 | عادات دينية/ثقافية؟ | Religious/cultural practices? | multi | o | always | halal / kosher / ramadan_fasting / none / other | `preferences.cultural[]` |
| Q08_06 | أكلات مش بتحبها | Foods you avoid | text | o | always | — | `preferences.disliked` |
| Q08_07 | أكلات بتحبها | Foods you love | text | o | always | — | `preferences.favorites` |
| Q08_08 | رغبات معينة؟ | Cravings? | multi | o | always | sweet / salty / carbs / chocolate / none | `preferences.cravings[]` |
| Q08_09 | ميزانية الأكل؟ | Food budget? | single | o | always | strict / moderate / flexible | `preferences.budget` |
| Q08_10 | الأكل برة البيت كام مرة في الأسبوع؟ | Dining out per week? | number | o | always | 0–14 | `preferences.diningOut` |

### Section 09 — Lifestyle Challenges & Adherence

| Code | Question (AR) | Question (EN) | Type | Req | Branch / Condition | Validation | Data field |
|---|---|---|---|---|---|---|---|
| Q09_01 | إيه أكبر تحدي عندك؟ | Biggest challenges? | multi | o | always | time / cravings / stress_eating / social / support / cooking / budget / medical / motivation / none | `adherence.challenges[]` |
| Q09_02 | ثقتك إنك تلتزم بخطة (1–5)؟ | Confidence to follow a plan (1–5)? | scale | o | always | 1–5 | `adherence.confidence` |
| Q09_03 | تتوقع تلتزم قد إيه؟ | Expected adherence? | single | o | always | strict / mostly / sometimes / flexible | `adherence.expectation` |
| Q09_04 | فيه حد بيدعمك؟ | Support system? | single | o | always | family_supports / family_not / friends / none | `adherence.support` |
| Q09_05 | تجربتك مع الدايتات قبل كده؟ | Previous diet experience? | single | o | always | none / 1–2 / 3+ / many | `adherence.priorDiets` |
| Q09_06 | حابب المتابعة تكون قد إيه؟ | Preferred follow-up frequency? | single | o | always | weekly / biweekly / monthly / not_sure | `adherence.followupPref` |
| Q09_07 | أي حاجة تانية عايز توضحها؟ | Anything else? | textarea | o | always | optional, becomes doctor note | `adherence.note` |

### Section 10 — Safety / Doctor Review

| Code | Text | Type | Req | Condition |
|---|---|---|---|---|
| Q10_01 | أكد إن المعلومات اللي قدمتها صحيحة | I confirm the information provided is accurate | consent | * always |
| Q10_02 | أنا فاهم إن التقييم ده أداة تجميع بيانات ومش تشخيص أو وصف علاج، وهيتراجع من الدكتور قبل أي خطة | I understand this is a data-collection tool — not diagnosis or treatment — and will be reviewed by the doctor before any plan | consent | * always |
| Q10_03 | فاهم إن في علامات تستدعي **مراجعة سريعة** وأنه ممكن يتم التواصل معايا بأسرع وقت | I understand some answers flag an **urgent review** and I may be contacted sooner | consent | * **only if ≥1 URGENT flag** |
| Q10_04 | (إشعار، ليس سؤالًا) إذا كانت أي أعراض حادة مميزة: "إذا كنت تعاني من ألم صدر أو صعوبة تنفس الآن، تواصل مع الإسعاف فورًا ولا تنتظر التقييم." | If any acute symptom flagged: "If you have chest pain or breathing difficulty right now, contact emergency services immediately — do not wait for this assessment." | notice | only if RU2 triggered |

### Contact-Capture Step (required — the only handoff mechanism)

| Code | Question | Type | Req | Validation | Data field |
|---|---|---|---|---|---|
| C01 | الاسم الكامل **للمريض** (معبأ من Q01_03 — قابل للتعديل) | **Patient** full name (prefilled from Q01_03, editable) | text | * | 2–100 chars | `contact.patientName` |
| C02 | اسم **الشخص المسؤول عن التواصل** — يظهر فقط لو `someone_else` | **Contact person** name — shown only if `someone_else` | text | c | 2–100 chars (required if `someone_else`) | `contact.contactPerson.name` |
| C03 | علاقة الشخص المسؤول بالمريض (من Q01_02 — تأكيد فقط) | Contact person relationship (from Q01_02 — confirm only) | single | c | parent / grandparent / sibling / spouse / legal_guardian / other — **for a minor = guardian/caregiver** | `contact.contactPerson.relationship` |
| C04 | رقم الموبايل (واتساب) — **رقم الشخص المسؤول** لو `someone_else`، ورقم المريض لو `self` (رقم الـhandoff الإلزامي) | Mobile phone (WhatsApp) — **contact person's for `someone_else`, patient's for `self`** — the required handoff number | phone | * | Egyptian: `01[0125][0-9]{8}` or `+20…`; 10–15 digits | `contact.handoffPhone` |
| C05 | (اختياري) موبايل المريض نفسه | Patient phone (optional) | phone | o | Egyptian format | `contact.patientPhone` |
| C06 | طريقة التواصل المفضلة | Preferred contact method | single | o | whatsapp / call / both — default whatsapp | `contact.preference` |
| C07 | (اختياري) الإيميل | Email (optional) | email | o | standard email regex | `contact.email` |
| C08 | أفضل وقت للتواصل | Best time to contact | text | o | — | `contact.bestTime` |
| C09 | موافقة: أوافق على التواصل بخصوص التقييم | Consent: I agree to be contacted about my assessment | consent | * | must be checked | `contact.consent` |

**Model (CL17):** patient ≠ contact person. For `self`, patient and contact person are the same (C04 = patient's phone; C02–C03 hidden). For `someone_else`, contact person is separate and C04 = their phone; for a minor, the contact person is the guardian/caregiver. **`someone_else` does NOT imply child** — another adult may be assessed on behalf of.

### Success Screen
- Reference number (e.g. `DK-2026-XXXXXX`), "happens next" copy, note the doctor team will contact you, note data stays on their device until submitted.

---

## 4. Conditional Logic Map (rule → consequence)

| # | When | Do |
|---|---|---|
| CL1 | Q01_01 = `someone_else` | Show Q01_02 (contact-person relationship); phone is captured once at Contact-Capture (C04 = contact person's). **If the subject is a minor (<18):** §02 interprets height/weight as growth-for-age context, adult-only questions (neck/waist/hip Q02_03–05) hidden, Q02_07 growth concerns shown, goals minor-appropriate, §06 occupation hidden. **If the subject is an adult: normal adult path** — someone_else does NOT imply child |
| CL2 | Q01_01 = `self` | Patient = contact person; hide contact-person fields (C02–C03); C04 = patient's own phone; normal adult (or adolescent) path |
| CL3 | Q01_04 age < 2 | Ask Q01_04b (months) |
| CL4 | Q03_01 = `weight_loss` | Show Q03_L1–L3; hide weight-gain block |
| CL5 | Q03_01 = `weight_gain` | Show Q03_G1–G4; hide weight-loss block; Q07_09 appetite emphasized |
| CL6 | Q03_01 = `maintain_weight` | Show Q03_M1 |
| CL7 | Q04_01 = `no` | Skip all Q04_02 detail blocks; still show Q04_03/E1/04/05/06/07 red-flag screens |
| CL8 | Q04_01 = `yes` | Show Q04_02 multi-select; each selected condition opens its detail block (only those selected) |
| CL9 | `diabetes` selected | Show Q04_D1–D4 (type required) + Q05_04 |
| CL10 | `thyroid` selected | Show Q04_T1 (type required) |
| CL11 | `GI` selected | Show Q04_GI1 |
| CL12 | Q05_06 = `yes`/`previously` (cortisone/steroid use) | → **prominent STANDARD / doctor-review flag (RS14)** — NOT automatic URGENT; severity kept configurable for future clinical decision |
| CL13 | Q04_E1 = `currently` | URGENT (RU1) + show sensitive support line (no judgemental copy) |
| CL14 | Q04_03 relevant (female 12–55) | Require answer; pregnancy alone → doctor-required STANDARD (RS7); pregnant + chronic condition → URGENT (RU7). Visibility rule configurable |
| CL15 | Q04_06 any acute symptom | Show Q10_04 emergency notice + URGENT (RU2) |
| CL16 | Subject = minor (<18) | Growth questions (Q02_07); guardian-reported growth concern → **STANDARD (RS9)**; rapid/unintentional weight loss is already covered by generic **RU3** — **NO invented percentile thresholds; no child-specific URGENT routing**; child data remains doctor-review data |
| CL17 | Q01_01 = `someone_else` (contact separation) | **Patient ≠ contact person.** Patient identity stays as C01/§01; contact person collected separately (C02 name, C03 relationship prefilled from Q01_02); handoff phone (C04) = contact person's; patient phone optional (C05). For a minor, contact person is the guardian/caregiver. Doctor always sees patient vs contact person distinctly. **`someone_else` ≠ child** |

---

## 5. Validation Rules

| Field class | Rule |
|---|---|
| Required | Must be non-empty before proceeding; error inline + `role="alert"` |
| Number ranges | weight 1–400 · height 20–250 · neck 20–100 · waist/hip 20–250 · age 0–120 · sleep 0–24 · water 0–30 · meals/snacks 0–10 · sugary drinks 0–20 · fast food 0–14 · caffeine 0–20 · dining out 0–14 · sedentary 0–24 · HbA1c 3–20 |
| Phone | `^\+?\d[\d\s\-]{8,14}$` base; Egyptian hint `01[0125]xxxxxxxx`; digits-only normalization on submit |
| Email | `^[^\s@]+@[^\s@]+\.[^\s@]{2,}$` (if provided) |
| Text | min 2 / max 100 (name, condition, allergy); textarea ≤ 1000 |
| Date | Q01_04a DOB optional; must be ≤ today; age derived when present |
| Dynamic lists | allergy: reaction required per row; medications: at least 1 row if yes; cancel/remove rows allowed |
| Consent | must be checked to advance past §10 / contact |
| Conditionally required | relationship (`someone_else`), contact-person name (`someone_else`), handoff phone, other-condition text, skipped-meals list, diabetes type, thyroid type |
| Cross-field (warnings only, never blocking) | goal=weight_loss & target ≥ current ⇒ "review target"; goal=weight_gain & target ≤ current ⇒ warning; extreme height/weight combos ⇒ note only, no advice |
| BMI | Computed + displayed as **informational only**. **NEVER triggers severity, routing, diagnosis, or treatment.** Stored as derived data only. No BMI-based routing unless explicitly approved later with a clinical source |

---

## 6. Red-Flag Severity Matrix (two tiers)

> Flags are **routing metadata only**. They never diagnose, prescribe, recommend treatment, compute a plan, or make a medical decision. All medical data and all flags remain subject to doctor review.
>
> **Guardrails for this version:** BMI is informational only and never a routing input. No percentile-based (growth) routing is implemented. Severity tiers (RU/RS) are configurable metadata, not clinical protocols.

### URGENT (immediate doctor attention — routed first, doctor contacted promptly)

| ID | Trigger | Notes |
|---|---|---|
| RU1 | Q04_E1 = `currently` (active eating disorder) | Sensitive; support-first wording |
| RU2 | Q04_06 = any of chest_pain / breathlessness_at_rest / fainting / severe_abdominal_pain | Emergency notice Q10_04 shown |
| RU3 | Unintentional loss >10% of body weight in last 6 months (Q04_04 + Q04_04b) — **all ages, including minors** | |
| RU4 | Type 1 diabetes + hypoglycemia `daily` (Q04_D1 + Q04_D3) | |
| RU5 | Any food allergy with history of **anaphylaxis** (Q08_02) | |
| RU6 | Bariatric surgery `ongoing` (≤12 months) or `planned` (Q04_05) | |
| RU7 | Pregnant + **any chronic condition** (Q04_03 + Q04_02) — **BMI is NOT a routing input** | |
| RU8 | Active cancer treatment (Q04_C1 = yes) | |
| RU9 | Daily/weekly insulin + recurring hypoglycemia (Q05_04 + Q04_D3) | |

### STANDARD (normal doctor-review queue)

| ID | Trigger |
|---|---|
| RS1 | Type 2 diabetes / prediabetes (any) |
| RS2 | Insulin resistance, thyroid, PCOS, fatty liver, hypertension, high cholesterol, anemia, osteoporosis, GI conditions, autoimmune, mental health |
| RS3 | Allergies with mild/moderate reaction (no anaphylaxis) |
| RS4 | Food intolerances |
| RS5 | Overweight/obesity without co-morbid flags |
| RS6 | Underweight without red-flag symptoms |
| RS7 | Pregnancy alone (drives doctor-required review; plan not auto-generated) |
| RS8 | Smoking / alcohol use |
| RS9 | Minor growth concerns reported by parent/guardian (Q02_07) — **no percentile threshold** |
| RS10 | Unintentional weight change <10% |
| RS11 | Bariatric history >12 months ago |
| RS12 | Past (not current) eating disorder |
| RS13 | Sleep <6h (Q06_05) |
| RS14 | **Cortisone/steroid — current use (`yes`) or previous (`previously`) on Q05_06. Prominent doctor-review flag.** Severity configurable in the future — not URGENT in this version |

**Severity combination rule:** if ≥1 URGENT and ≥1 STANDARD, overall tier = **URGENT**. Any URGENT flag blocks automatic review sorting and requires a doctor/expert to open the case first.

---

## 7. Proposed JSON Data Structure (annotated pseudo-JSON)

```jsonc
{
  "meta": {
    "sessionId": "uuid-v4",
    "assessmentVersion": "0.1.0",
    "language": "ar",                       // or "en"
    "startedAt": "ISO-8601",
    "lastSavedAt": "ISO-8601",
    "status": "draft | submitted",
    "referenceNumber": "DK-2026-XXXXXX"      // generated at submit
  },

  "subject": "self | someone_else",          // Q01_01 (branching driver)

  // ---- PATIENT PROFILE FIELDS (become the future Patient record after doctor review) ----
  "patient": {
    "name": "",                          // Q01_03 — the PATIENT (never the contact person)
    "dob": null,                         // Q01_04a — OPTIONAL
    "ageYears": null, "ageMonths": null, // Q01_04 / Q01_04b — age is DERIVED from dob when present
    "sex": "female | male"
  },
  "measures": {
    "heightCm": null, "weightKg": null, "neckCm": null,
    "waistCm": null,  "hipCm":  null,   "targetKg": null,
    "growthConcerns": [], "note": null
  },
  "goals": { "primary": null, "desiredOutcome": null, "timeline": null,
             "motivation": null, "loss": {...}, "gain": {...}, "maintain": {...} },
  "lifestyle": { "activityFrequency": null, "activityTypes": [], "sleepHours": null,
                 "stress": null, "smoking": null, "alcohol": null, ... },
  "preferences": { "allergies": {...}, "intolerances": [], "dietPattern": [],
                   "cultural": [], "cravings": [], "budget": null, ... },
  "eating": { "mealCount": null, "waterGlasses": null, "digestive": [], ... },

  // ---- ASSESSMENT-SESSION DATA (raw answers, source of truth for re-derivation) ----
  "answers": {
    "Q01_01": "someone_else",
    "Q02_02": 67,
    "Q04_D3": "daily",
    /* ... every question id -> its stored answer ... */
  },

  "medical": {                               // DOCTOR-REVIEW DATA
    "conditions": [], "pregnancy": null, "weightChange": null,
    "weightChangeKg": null, "bariatric": null, "acuteSymptoms": [],
    "eatingDisorder": null, "mentalHealth": null, "cancerActive": null,
    "diabetes": {...}, "thyroid": {...}, "gi": {...}, "insulinResistance": {...}
  },
  "medications": { "onMedications": null, "items": [], "supplements": [],
                   "herbal": [], "insulin": null, "steroids": null },

  "flags": [                                  // ROUTING METADATA ONLY — never a diagnosis/treatment decision
    { "ruleId": "RU4", "tier": "urgent", "questionRefs": ["Q04_D1","Q04_D3"],
      "message": { "ar": "...", "en": "..." }, "status": "pending | acknowledged" }
  ],                                          // NOTE: BMI and growth percentiles generate NO flags in this version

  "acknowledgements": { "accurate": false, "noDiagnosis": false, "urgent": false },
  "contact": {                                // CL17: patient ≠ contact person
    "patientName": null,                      // C01
    "contactPerson": {                        // required when subject = someone_else
      "name": null,                           // C02
      "relationship": null,                   // C03 (prefilled from Q01_02) — guardian/caregiver for a minor
      "isGuardian": false                     // derived: someone_else && minor
    },
    "handoffPhone": null,                     // C04 — REQUIRED (contact person's for someone_else; patient's for self)
    "patientPhone": null,                     // C05 — optional
    "preference": "whatsapp",                 // C06
    "email": null,                            // C07 — optional
    "bestTime": null,                         // C08
    "consent": false                          // C09
  },
  "derived": {                                // COMPUTED — informational + audit only, NEVER routing
    "bmi": 24.5,                              // from height/weight; displayed to patient; never drives severity/routing
    "ageFromDob": "computed when dob present",
    "overallTier": "standard | urgent"        // derived at submit from flags[] only
  },
  "submittedAt": null,
  "htmlStatus": "draft",                      // for save/resume (localStorage)
  "draftKey": "drke.assessment.<sessionId>"
}
```

### Profile vs session vs review vs never-auto (items 11–14)

| Bucket | Fields | Notes |
|---|---|---|
| **Patient profile fields** (11) — durable after doctor review | name, DOB (optional), age (derived), sex, patient phone (optional), height, weight, target, primary goal, doctor-confirmed conditions, allergies, dietary pattern, activity level, challenges | Become the future `Patient` record; only after a doctor opens/reviews the case. Contact person (guardian/caregiver) data goes to a separate `ContactPerson` relation |
| **Assessment-session data** (12) — not profile | `answers` map, per-condition details, flags, timestamps, reference number, draft, language, page state | Discardable; kept for audit/re-derivation |
| **Requires doctor review** (13) | all `medical.*`, `medications.*`, allergies, pregnancy, lab values, eating-disorder history, mental health, growth concerns, acute symptoms, extreme measurements, bariatric history, steroid use, recent weight change, digestive complaints | No plan touches these without review |
| **NEVER used to auto-generate treatment** (14) | EVERYTHING medical + all flag content. Also: even non-medical fields produce only a *draft outline* — final plan requires doctor sign-off | Hard rule: no automatic diagnosis, no automatic prescribing, no automatic treatment recommendation |

---

## 8. Future Database Entities / Relationships (HIGH LEVEL ONLY — not implemented)

```
Doctor ──1:N── Review ──N:1── AssessmentSession ──1:N── AssessmentAnswer
                                            │
AssessmentSession ──1:0..1── Patient
Patient ──1:N── NutritionPlan
AssessmentSession ──1:0..1── ContactCapture    // handoff phone + consent + contact-person
Patient ──1:0..1── ContactPerson                // distinct from Patient; guardian/caregiver for a minor

QuestionCatalog (code, section, type, labels_ar/en, conditional rules, validation)
Flag (session_id, rule_id, tier, message, status)        // routing metadata only
```

- No schema DDL produced yet. No auth/doctor-dashboard designed in this phase.
- Key entity notes: `AssessmentSession` is append-only and keeps `answers` JSON for audit; `Flag` is derived at submit and re-derivable; `QuestionCatalog` keeps the screening logic maintainable and versionable; future `NutritionPlan` only ever links to a `Patient` whose case was reviewed by a `Doctor`. `ContactCapture` is adopted into `Patient` + `ContactPerson` on review — **patient identity and contact person stay distinct**; for `someone_else`/minors the contact person carries guardian/caregiver semantics via `ContactPerson.relationship`.

---

## 9. User Experience & Step Progression

1. **Intro (disclaimer)** → CTA "ابدأ التقييم / Start Assessment".
2. **Stepper flow** — one section per screen; one *primary question* per screen on mobile, grouped cards on desktop.
3. **Navigation:** Back / Next; **Next disabled until required fields of the current step validate**. If a URGENT flag was triggered earlier, a subtle persistent notice "سيتم التواصل عاجلًا بعد الإرسال".
4. On the final section: **Safety Summary screen** lists any flags (tier-colored, non-clinical wording), then the two required acknowledgements, then **Contact step**, then **Submit**.
5. After submit: success screen with reference number + "what happens next". Submit disabled if contact consent missing.

## 10. Progress Indicator

- Sticky top bar: `01/10` sections, thin progress bar (`progress % = answered fields / required+expected fields` for shown path), labeled section title.
- Accessible: `aria-valuenow`, `role="progressbar"`, and `aria-live="polite"` announcement on step change.
- Branching smartly recomputes total (e.g., minor path shows different section count emphasis but keeps the 10-section identity).
- Progress persists with the draft in localStorage so reload restores both answers and position.

## 11. Save / Resume Behavior (no backend/auth yet)

- **On learn trigger (per field):** debounce-write the whole draft to `localStorage` under `drke.assessment.<sessionId>`.
- **On reload:** banner "لديك تقييم لم يكتمل — متابعة / بدء من جديد" (Continue / Start over). Restores answers + current step.
- **On submit:** mark `status=submitted`, write a read-only snapshot + reference number; further edits blocked; user shown where to find their reference.
- **Limitations documented in copy:** data lives on this device only; clearing browser data or switching devices loses the draft; nothing is sent to any server until Submit.
- Storage key uses the session id; a new user gets a new id.

## 12. Units

- **kg / cm only.** No inch/lb toggle (target audience is Egypt).
- Unit always rendered next to numeric input and repeated in confirm/summary steps.
- Arabic: كجم / سم · English: kg / cm.

## 13. RTL / LTR

- `dir` follows app language (already handled by `AppProvider`). All layout uses **logical properties** (`inset-inline-start`, `margin-inline`, `text-align: start`) so RTL mirrors automatically.
- Progress bar fills from inline-start; stepper arrows flip (already practiced in the landing page pattern `html[dir="rtl"] .assessment__arrow { transform: scaleX(-1) }`).
- Phone/number inputs keep LTR glyph direction (wrap in `dir="ltr"` container, aligned inline-end).
- Section numbers keep Western digits on both; question numbering consistent per language.

## 14. Mobile UX

- **One question per view on ≤767px** — large cards, no dense grids (allergies/conditions use chips).
- Keyboard: numeric fields use `inputMode="decimal"`/`"numeric"`; no hover-dependent controls.
- Touch targets ≥48px; sticky progress + bottom action bar (Back/Next) for thumb reach.
- Inputs ≥16px font to prevent iOS zoom.

## 15. Accessibility

- Semantic: `fieldset`/`legend` for radio groups, `label`+`for`, `aria-describedby` for hints.
- Focus moves to the section title on each step; keyboard fully navigable (native radio/checkbox UX).
- Errors: inline `<p role="alert">` + summary; focus returns to first invalid field.
- Progress: `role="progressbar"` + live announcements; not color-only (icons + labels).
- Contrast ≥ 4.5:1; `prefers-reduced-motion` respected (existing `anim-` helpers already gated).
- Sensitive screens (eating disorder, mental health) use neutral, non-judgemental copy.

---

## 16. Medical Disclaimer Copy

### Intro screen (before Q01_01)

**Arabic**
> **قبل ما تبدأ … معلومة مهمة**
>
> التقييم ده أداة لجمع بيانات غذائية، مش تشخيص طبي ولا وصف علاج.
> الإجابات اللي هتقدمها هتتتراجع من دكتور/استشاري تغذية مؤهل، وبعد المراجعة بس ممكن تُقترح أي خطة غذائية.
> التقييم مش بديل عن استشارة طبية.
> لو عندك حالة طبية، أو حامل، أو بتاخد أدوية، أو حصلت معاك أي أعراض خطيرة — التقييم ده مش ليه بديل للطبيب: تواصل مع طبيبك أو الإسعاف فورًا، ولا تنتظر التقييم.
> بشرح: معلوماتك هتتسجل بسرية تامة، ومش هتتشارك مع أي حد غير فريق الدكتور كريم الليثي.

**English**
> **Before you start — important note**
>
> This assessment is a data-collection tool for your nutrition profile, not a medical diagnosis and not a treatment recommendation.
> Your answers will be reviewed by a licensed doctor / nutrition consultant. No nutrition plan can be suggested until that review is complete.
> This assessment does not replace medical care.
> If you have a medical condition, are pregnant, take medication, or have any serious symptoms — this tool is not a substitute for a doctor: contact your doctor or emergency services immediately, and do not wait for this assessment.
> Your information is kept confidential and is only shared with Dr. Kareem Eliethy's team.

### Near final submit (end of §10 / just before Contact/Submit)

**Arabic**
> **تذكير مهم قبل الإرسال**
>
> بياناتك هتتتراجع من دكتور/استشاري تغذية مؤهل قبل أي خطة.
> التقييم ده مش تشخيص طبي ولا بيوصف علاج لأي حالة.
> لو علامة تتطلب مراجعة عاجلة (زي أعراض حادة) — فريق الدكتور هيتواصل معاك بأسرع وقت، ولو عندك أي أعراض خطيرة دلوقتي فتواصل مع الإسعاف فورًا.

**English**
> **Reminder before submitting**
>
> Your data will be reviewed by a licensed doctor / nutrition consultant before any plan.
> This tool does not diagnose or prescribe treatment for any condition.
> If your answers trigger an urgent review (e.g., acute symptoms), the doctor's team will contact you promptly. If you have any serious symptoms right now, contact emergency services immediately.

---

## 17. Decisions Recorded (approved for implementation) & Remaining Open Items

### Approved decisions

1. **10-section structure** — approved (one section = one screen).
2. **Child / contact** — approved: guardian/caregiver phone required; patient phone optional; contact person is separate from patient identity.
3. **Date of birth** — approved: optional DOB added (Q01_04a); age derived from DOB when present; age retained as derived data; DOB not required.
4. **Pregnancy visibility** — approved: females 12–55 rule retained; kept configurable for future clinical review.
5. **Cortisone / steroid** — approved as clinic-relevant, **prominent STANDARD / doctor-review flag (RS14), NOT automatically URGENT**; severity configurable in the future.
6. **Two severity tiers** — approved (STANDARD, URGENT); no medium tier at this stage.
7. **Contact** — approved: WhatsApp default, reference format `DK-2026-XXXXXX`, contact person separate from patient (CL17).

### Remaining open items (non-blocking, for future phases)

1. **Save/resume via localStorage** — still awaiting explicit approval; proposed as device-only draft persistence with documented limitation.
2. **Minor / adolescent boundaries** — confirm cutoff (<18 = minor with growth questions; growth path alongside adult-style questions for 13–17 adolescents).
3. **Configurable severity register** — pregnancy visibility and cortisone severity are future-configurable items; no clinical thresholds invented in this version (**BMI and growth percentiles produce no routing**).