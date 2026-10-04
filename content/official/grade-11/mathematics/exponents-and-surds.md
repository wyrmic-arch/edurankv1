---
title: Exponents and Surds — Complete Notes
subject: mathematics
grade: 11
topic: Exponents and surds
slug: grade-11-mathematics-exponents-and-surds
description: Grade 11 CAPS exponents and surds: exponent laws, rational exponents, simplifying and rationalising surds, and solving exponential equations step by step.
license: all-rights-reserved
order: 1
---

## What you'll learn

- Apply the laws of exponents to simplify expressions with integer and rational exponents.
- Switch between exponent form and surd (radical) form.
- Simplify, add and multiply surds, and rationalise the denominator of a fraction.
- Solve exponential equations by matching bases or by using a substitution.
- Solve surd equations and recognise answers that must be rejected.

## Exponents: the language of growth

An exponent tells you how many times a base is multiplied by itself. In a^n, the number a is the base and n is the exponent (also called the index). This short notation hides a lot of power: it lets us write very large and very small numbers, describe growth and decay, and solve equations that would be impossible by hand. The whole topic rests on a handful of laws, and every one of them can be proved by simply writing the powers out in full.

In the South African CAPS curriculum, this work sits in Paper 1 and turns up again later inside financial mathematics, functions and logarithms. Getting the laws automatic now saves you time in every later topic.

### The laws of exponents

| Law | Rule | Worked illustration |
|---|---|---|
| Product | a^m × a^n = a^(m+n) | x³ × x⁴ = x⁷ |
| Quotient | a^m ÷ a^n = a^(m−n) | x⁵ ÷ x² = x³ |
| Power of a power | (a^m)^n = a^(mn) | (x²)³ = x⁶ |
| Power of a product | (ab)^n = a^n × b^n | (2x)³ = 8x³ |
| Zero exponent | a⁰ = 1 (a ≠ 0) | 7⁰ = 1 |
| Negative exponent | a^(−n) = 1 ÷ a^n | 2⁻³ = 1/8 |
| Rational exponent | a^(1/n) = ⁿ√a | 8^(1/3) = ∛8 = 2 |
| Fractional exponent | a^(m/n) = ⁿ√(a^m) = (ⁿ√a)^m | 27^(2/3) = 9 |

The rule of thumb: whenever the bases are the same and the operation is multiplication or division, the exponents add or subtract. Everything else follows from that one idea.

### Negative and rational exponents

A negative exponent does not make the answer negative. It flips the base to the other side of the fraction bar, so 5⁻² = 1/25, not −25.

A fractional exponent connects exponents to roots: the denominator of the fraction is the root you take, and the numerator is the power you raise it to. For example, 32^(2/5) = (⁵√32)² = 2² = 4. This is why the laws of exponents and the laws of surds are really the same laws wearing different clothes.

## Surds: irrational roots

A surd is a root that cannot be simplified to a rational number. √2, √7 and ∛5 are surds because their decimal expansions go on forever without repeating. √9 is not a surd, because it equals exactly 3.

The key surd rules mirror the exponent laws:

- √(a × b) = √a × √b
- √(a ÷ b) = √a ÷ √b, for b > 0
- (√a)² = a

Only like surds can be added or subtracted directly. √2 + √3 cannot be simplified any further, but 3√2 + 5√2 = 8√2. To combine surds that look different, break each one down and pull out the biggest perfect-square factor: √50 = √(25 × 2) = 5√2.

### Rationalising the denominator

Textbook and exam answers avoid surds sitting in the denominator of a fraction. To remove a single surd, multiply the top and bottom by that same surd. To remove a two-term denominator such as (√a − √b), multiply top and bottom by its conjugate (√a + √b); the difference of squares then clears both roots in one step.

```
     a             a      √b        a√b
  -------   =   ------- × -------  = ------      (single surd below)
    √b            √b       √b         b

      1               1        (√a + √b)        √a + √b
  ---------   =   --------- × ------------  =  -----------   (conjugate)
   √a − √b         √a − √b     √a + √b           a − b
```

## Worked example 1: Simplifying with exponent laws

Simplify (2x³y⁻²)³ × 3x²y⁴ ÷ 6x⁵y⁻¹.

Step 1 — Remove the bracket using the power-of-a-product and power-of-a-power laws.
(2x³y⁻²)³ = 2³ × x^(3×3) × y^(−2×3) = 8x⁹y⁻⁶.

Step 2 — Multiply by the next factor. Multiply the coefficients and add the exponents of like bases.
8x⁹y⁻⁶ × 3x²y⁴ = 24 × x^(9+2) × y^(−6+4) = 24x¹¹y⁻².

Step 3 — Divide by 6x⁵y⁻¹. Divide the coefficients and subtract the exponents.
24 ÷ 6 = 4.
x¹¹ ÷ x⁵ = x^(11−5) = x⁶.
y⁻² ÷ y⁻¹ = y^(−2−(−1)) = y⁻¹ = 1/y.

Answer: 4x⁶ ÷ y, which we usually write as 4x⁶/y.

## Worked example 2: An exponential equation that needs a substitution

Solve 3^(2x) − 10 × 3^x + 9 = 0.

Step 1 — Notice that 3^(2x) equals (3^x)². The equation is quadratic in disguise. Let t = 3^x, where t > 0 because a positive base raised to any power is always positive.

Step 2 — Substitute to get a quadratic in t.
t² − 10t + 9 = 0.

Step 3 — Factorise.
(t − 1)(t − 9) = 0, so t = 1 or t = 9.

Step 4 — Replace t with 3^x and solve for x.
3^x = 1 gives x = 0.
3^x = 9 = 3² gives x = 2.

Step 5 — Check both answers in the original equation.
x = 0: 3⁰ − 10 × 3⁰ + 9 = 1 − 10 + 9 = 0. Correct.
x = 2: 3⁴ − 10 × 3² + 9 = 81 − 90 + 9 = 0. Correct.

Answer: x = 0 or x = 2.

## Worked example 3: Simplifying and rationalising surds

Simplify √50 − √18 + √8, then rationalise 6 ÷ (√5 − √2).

Step 1 — Factor out the largest perfect square from each surd.
√50 = √(25 × 2) = 5√2.
√18 = √(9 × 2) = 3√2.
√8 = √(4 × 2) = 2√2.

Step 2 — Collect the like surds.
5√2 − 3√2 + 2√2 = (5 − 3 + 2)√2 = 4√2.

Step 3 — For the fraction, multiply the top and bottom by the conjugate √5 + √2.
6/(√5 − √2) × (√5 + √2)/(√5 + √2).

Step 4 — Simplify the new denominator using difference of squares.
(√5)² − (√2)² = 5 − 2 = 3.

Step 5 — Write the answer in simplest form.
6(√5 + √2)/3 = 2(√5 + √2) = 2√5 + 2√2.

## Solving surd equations

When the unknown sits under a root, isolate the root and then square both sides. Because squaring can create solutions that do not fit the original equation, you must substitute every answer back into the original equation. If the square root is set equal to a negative number, that answer is rejected immediately.

For example, √(x + 7) = x − 5. Squaring both sides gives x + 7 = (x − 5)², so x + 7 = x² − 10x + 25, which rearranges to x² − 11x + 18 = 0 and factorises to (x − 2)(x − 9) = 0. So x = 2 or x = 9. Testing x = 2 gives √9 = 3 on the left but 2 − 5 = −3 on the right, which is false, so we reject it. Testing x = 9 gives √16 = 4 and 9 − 5 = 4, which is true. The only solution is x = 9.

## Common mistakes

- Adding exponents when you should multiply them: a^m × a^n = a^(m+n), not a^(mn).
- Thinking a^(m+n) equals a^m + a^n. It does not — 2³⁺² = 32, while 2³ + 2² = 12.
- Writing (a + b)² = a² + b². The correct expansion is a² + 2ab + b².
- Making a negative exponent negative: 3⁻² = 1/9, not −9.
- Believing √(a + b) = √a + √b. Test it: √(9 + 16) = 5, but √9 + √16 = 7.
- Skipping the check step in surd equations, which lets false or extraneous roots survive.
- Forgetting that a⁰ = 1 for every non-zero base, and that 0⁰ is undefined.

## Quick summary / cheat sheet

| Idea | Remember this |
|---|---|
| Same base, multiply | add the exponents |
| Same base, divide | subtract the exponents |
| Bracket raised to a power | multiply the exponents |
| Negative exponent | write it as a reciprocal |
| Fractional exponent | denominator is the root, numerator is the power |
| Simplify a surd | pull out the biggest perfect square |
| Adding surds | only like surds can combine |
| One-surds denominator | multiply top and bottom by that surd |
| Two-term denominator | multiply top and bottom by the conjugate |
| Surd equation | square both sides, then test every answer |

Also keep these two relationships close:
- √(ab) = √a √b and √(a ÷ b) = √a ÷ √b.
- To solve an exponential equation, either match the bases so the exponents are equal, or substitute t for the repeated power.

## Practice questions

1. Simplify (3x⁴y⁻³)² ÷ 9x⁵y⁻⁴.
2. Simplify 16^(3/4).
3. Solve 5^(2x−1) = 125.
4. Solve 2^(2x) − 5 × 2^x + 4 = 0.
5. Simplify √75 + √12 − √27.
6. Rationalise 8 ÷ (√7 + √3).
7. Solve √(2x + 1) = x − 1.
8. Simplify 2⁻³ × 2⁵ ÷ 2⁰.

### Answers

1. (3x⁴y⁻³)² = 9x⁸y⁻⁶. Divide by 9x⁵y⁻⁴: the coefficient becomes 9 ÷ 9 = 1; x^(8−5) = x³; y^(−6−(−4)) = y⁻². Answer: x³/y².
2. 16^(3/4) = (⁴√16)³ = 2³ = 8.
3. 125 = 5³, so 2x − 1 = 3, giving 2x = 4 and x = 2.
4. Let t = 2^x: t² − 5t + 4 = 0, so (t − 1)(t − 4) = 0, giving t = 1 or t = 4. Then 2^x = 1 gives x = 0, and 2^x = 4 gives x = 2. Answer: x = 0 or x = 2.
5. √75 = 5√3, √12 = 2√3, √27 = 3√3. So 5√3 + 2√3 − 3√3 = 4√3.
6. Multiply top and bottom by (√7 − √3): the denominator becomes 7 − 3 = 4, so the answer is 8(√7 − √3)/4 = 2(√7 − √3) = 2√7 − 2√3.
7. Squaring gives 2x + 1 = (x − 1)² = x² − 2x + 1, so x² − 4x = 0 and x(x − 4) = 0, giving x = 0 or x = 4. Test x = 0: the left side is √1 = 1 but the right side is 0 − 1 = −1, so reject it. Test x = 4: √9 = 3 and 4 − 1 = 3, so accept it. Answer: x = 4.
8. 2^(−3+5−0) = 2² = 4.

Official EduRank Team notes. Always cross-check with your textbook and teacher.
