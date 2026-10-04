---
title: Trigonometry — Complete Notes
subject: mathematics
grade: 12
topic: Trigonometry
slug: grade-12-mathematics-trigonometry
description: Grade 12 CAPS trigonometry notes covering compound and double angle formulae, general solutions, identities and reduction formulae with worked examples.
license: all-rights-reserved
order: 3
---

## What you'll learn

- The special-angle values you must know by heart.
- The compound angle formulae for sine, cosine and tangent.
- The double angle formulae and how they are derived.
- How to write general solutions for trigonometric equations.
- How to prove trigonometric identities step by step.
- How to simplify expressions using reduction formulae.

## The big picture

Grade 12 trigonometry extends what you learned in earlier grades. In Grades 10 and 11 you solved simple equations like sinθ = 1/2. In Grade 12 the angles become more complicated: sums and differences of angles, double angles, and equations that need a **general solution** because they repeat forever.

The whole chapter rests on a handful of formulae. Learn them, then practise proving identities — proving an identity is a favourite CAPS question because it tests both memory and logic.

## Special angles

Know these values exactly — no calculator needed:

| θ | 0° | 30° | 45° | 60° | 90° |
|---|---|---|---|---|---|
| sin θ | 0 | 1/2 | √2/2 | √3/2 | 1 |
| cos θ | 1 | √3/2 | √2/2 | 1/2 | 0 |
| tan θ | 0 | 1/√3 | 1 | √3 | undefined |

For signs by quadrant, remember **CAST**: All ratios positive in the first quadrant, only Sine in the second, only Tangent in the third, only Cosine in the fourth.

## Fundamental identities

- sin²θ + cos²θ = 1 (the Pythagorean identity)
- tanθ = sinθ / cosθ

From the first identity:

- sin²θ = 1 − cos²θ
- cos²θ = 1 − sin²θ

## Compound angle formulae

These express the sine, cosine and tangent of a sum or difference of two angles:

- sin(A + B) = sinA·cosB + cosA·sinB
- sin(A − B) = sinA·cosB − cosA·sinB
- cos(A + B) = cosA·cosB − sinA·sinB
- cos(A − B) = cosA·cosB + sinA·sinB
- tan(A + B) = (tanA + tanB) / (1 − tanA·tanB)
- tan(A − B) = (tanA − tanB) / (1 + tanA·tanB)

Notice the **sign flip**: in the sine and tangent formulae the signs on the right match the sign inside the bracket, but in the cosine formula the sign on the right is **opposite** to the sign in the bracket.

## Double angle formulae

Set B = A in the compound formulae:

- sin2A = 2·sinA·cosA
- cos2A = cos²A − sin²A
- cos2A = 1 − 2sin²A
- cos2A = 2cos²A − 1
- tan2A = 2tanA / (1 − tan²A)

The three forms of cos2A are all the same thing — choose the one that helps you cancel or substitute.

## General solutions

Because trigonometric functions repeat, equations usually have infinitely many solutions. We give a **general solution** using an integer n:

| Equation | General solution |
|---|---|
| sinθ = k | θ = arcsin(k) + 360°n  or  θ = 180° − arcsin(k) + 360°n |
| cosθ = k | θ = ±arccos(k) + 360°n |
| tanθ = k | θ = arctan(k) + 180°n |

If you must solve within a restricted interval (for example 0° ≤ θ ≤ 360°), generate values by choosing n = 0, ±1, ±2, ... and keep only those inside the interval.

Sine and cosine repeat every 360°, while tangent repeats every 180° — that is exactly why the "+ 360°n" and "+ 180°n" appear.

## Worked example 1 — exact value of a compound angle

Find sin 75° without a calculator.

**Step 1 — split 75° into known angles.**
75° = 45° + 30°.

**Step 2 — apply the sine addition formula.**
sin 75° = sin(45° + 30°) = sin45°·cos30° + cos45°·sin30°

**Step 3 — substitute the special values.**
= (√2/2)(√3/2) + (√2/2)(1/2)
= (√6)/4 + (√2)/4
= (√6 + √2) / 4

So sin 75° = (√6 + √2)/4 ≈ 0,966.

## Worked example 2 — general solution

Solve cos 2x = 1/2 for the general solution.

**Step 1 — take the inverse cosine.**
arccos(1/2) = 60°.

**Step 2 — apply the cosine general solution.**
2x = ±60° + 360°n

**Step 3 — divide every part by 2.**
x = ±30° + 180°n

So x = 30° + 180°n or x = −30° + 180°n, which can also be written as x = 150° + 180°n.

**Check:** for n = 0 we get 30° and 150°; doubling each gives 60° and 300°, and cos 60° = cos 300° = 1/2. Correct.

## Worked example 3 — prove an identity

Prove that sin2A / (1 + cos2A) = tanA.

**Step 1 — work on the left-hand side only.**
LHS = sin2A / (1 + cos2A)

**Step 2 — replace with double angle formulae.**
sin2A = 2·sinA·cosA and cos2A = 2cos²A − 1, so:
1 + cos2A = 1 + (2cos²A − 1) = 2cos²A

**Step 3 — substitute back and simplify.**
LHS = (2·sinA·cosA) / (2cos²A) = sinA / cosA

**Step 4 — recognise the identity.**
sinA / cosA = tanA = RHS ∴ the identity is proven.

## Reduction formulae

Angles bigger than 90°, and negative angles, can all be reduced to an acute angle between 0° and 90° using these rules:

| Expression | Simplified |
|---|---|
| sin(180° − θ) | sinθ |
| cos(180° − θ) | −cosθ |
| tan(180° − θ) | −tanθ |
| sin(180° + θ) | −sinθ |
| cos(180° + θ) | −cosθ |
| tan(180° + θ) | tanθ |
| sin(360° − θ) | −sinθ |
| cos(360° − θ) | cosθ |
| tan(360° − θ) | −tanθ |
| sin(90° − θ) | cosθ |
| cos(90° − θ) | sinθ |
| sin(−θ) | −sinθ |
| cos(−θ) | cosθ |
| tan(−θ) | −tanθ |

Two patterns make the table easy to remember. For 180° and 360° the function name never changes; only the sign may change, and that sign follows CAST. For 90° and 270° the function name swaps between sine and cosine, because these are complementary angles.

**Example:** simplify sin(180° + x) · tan(360° − x).
sin(180° + x) = −sinx and tan(360° − x) = −tanx, so the product = (−sinx)(−tanx) = sinx·tanx = sin²x / cosx.

## Choosing a method for equations

When an equation contains a double angle together with a single angle (for example sin 2x = sin x), factorise rather than reaching straight for a general-solution formula. Move everything to one side, take out the common ratio as a factor, and solve each factor separately. This avoids losing solutions that would otherwise be divided away.

## Common mistakes

- **Sign errors in the cosine formula.** cos(A + B) has a **minus** in its expansion — the sign flips.
- **Forgetting the "+ 360°n".** A general solution without the period term is incomplete and loses marks.
- **Working on both sides of an identity.** Prove one side until it matches the other; do not move terms across the equals sign as if solving an equation.
- **Using the wrong form of cos2A.** All three forms are valid, but only one may cancel nicely in a given proof.
- **Mixing up degrees and radians.** Unless told otherwise, CAPS uses degrees.
- **Dropping solutions when dividing an angle.** If 2x = ±60° + 360°n, remember to divide the whole right side by 2 to get ±30° + 180°n.

## Quick summary / cheat sheet

| Formula type | Result |
|---|---|
| Pythagorean | sin²θ + cos²θ = 1 |
| sin(A ± B) | sinA·cosB ± cosA·sinB |
| cos(A ± B) | cosA·cosB ∓ sinA·sinB |
| tan(A ± B) | (tanA ± tanB)/(1 ∓ tanA·tanB) |
| sin2A | 2·sinA·cosA |
| cos2A | cos²A − sin²A = 1 − 2sin²A = 2cos²A − 1 |
| tan2A | 2tanA/(1 − tan²A) |

## Practice questions

1. Find the exact value of cos 15°.
2. Give the general solution of tan 2x = 1.
3. Prove that 1 − cos 2A = 2sin²A.
4. Solve sin 2x = sin x for x in [0°; 360°].
5. If sin A = 3/5 and A is acute, find sin 2A and cos 2A.
6. Simplify sin(180° − x) · cos(90° + x).

### Answers

1. cos 15° = cos(45° − 30°) = cos45°cos30° + sin45°sin30° = (√6 + √2)/4 ≈ 0,966.
2. 2x = 45° + 180°n, so **x = 22,5° + 90°n**.
3. LHS = 1 − (1 − 2sin²A) = 1 − 1 + 2sin²A = 2sin²A = RHS ∴ proven.
4. 2sinx·cosx = sinx → sinx(2cosx − 1) = 0. So sinx = 0 → x = 0°, 180°, 360°; or cosx = 1/2 → x = 60°, 300°. Full solution set: **x = 0°, 60°, 180°, 300°, 360°**.
5. cosA = 4/5 (a 3-4-5 triangle). sin2A = 2(3/5)(4/5) = **24/25**. cos2A = 1 − 2sin²A = 1 − 2(9/25) = 1 − 18/25 = **7/25**.
6. sin(180° − x) = sinx and cos(90° + x) = −sinx, so the product = **−sin²x**.

Official EduRank Team notes. Always cross-check with your textbook and teacher.
