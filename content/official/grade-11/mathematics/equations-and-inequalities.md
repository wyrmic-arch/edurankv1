---
title: Equations and Inequalities — Complete Notes
subject: mathematics
grade: 11
topic: Equations and inequalities
slug: grade-11-mathematics-equations-and-inequalities
description: Grade 11 CAPS equations and inequalities: quadratic equations, the discriminant, simultaneous equations, quadratic inequalities and full worked solutions.
license: all-rights-reserved
order: 2
---

## What you'll learn

- Solve quadratic equations by factorising, completing the square and the quadratic formula.
- Use the discriminant to describe the nature of the roots without solving the equation.
- Solve simultaneous equations where one is linear and the other quadratic.
- Solve quadratic and rational inequalities using critical values and a sign line.
- Translate a word problem into an equation, solve it, and check that the answer makes sense.

## Quadratic equations: three reliable methods

A quadratic equation can always be written in the standard form ax² + bx + c = 0, where a ≠ 0. There are three methods you should be comfortable with, and each one is best in a different situation.

Method 1 — Factorising. If the quadratic factorises, use the zero-product property: if A × B = 0, then A = 0 or B = 0. This is the fastest method when the numbers are friendly.

Method 2 — Completing the square. Write the expression as a perfect square plus or minus a constant. This method also gives you the turning point of the parabola, so it is worth mastering.

Method 3 — The quadratic formula. When the expression does not factorise neatly, reach for the formula. It always works:

x = (−b ± √(b² − 4ac)) ÷ (2a)

### The discriminant

The expression under the square root, b² − 4ac, is called the discriminant and is written Δ (delta). It tells you what kind of roots to expect before you do any further work.

| Discriminant | Nature of the roots | Graph touches the x-axis |
|---|---|---|
| Δ > 0 | two distinct real roots | crosses twice |
| Δ = 0 | two equal real roots (one repeated) | touches once |
| Δ < 0 | no real roots | never touches |

A common exam question gives you a coefficient as a letter and asks for the value that makes the roots equal. Set Δ = 0 and solve for the letter.

### Completing the square

To complete the square for x² + bx + c, take half of b, square it, and add and subtract it:

x² + bx + c = (x + b/2)² − (b/2)² + c

For example, x² + 6x + 1 = (x + 3)² − 9 + 1 = (x + 3)² − 8.

## Inequalities

A linear inequality is solved just like a linear equation, with one extra rule: when you multiply or divide both sides by a negative number, the direction of the inequality sign flips.

For a quadratic inequality, the method is always the same:

1. Rearrange so that one side is 0, in the form ax² + bx + c > 0 (or < 0, ≥ 0, ≤ 0).
2. Find the critical values by solving ax² + bx + c = 0.
3. Draw a sign line and test the intervals between the critical values.
4. Write the answer using inequality notation.

```
  Test x² − x − 6 > 0          factors: (x − 3)(x + 2)

        +           −           +        sign of the product
   <----o-----------o---->------------->  x
       −2           3
        x < −2      −2 < x < 3       x > 3

  The product is positive (greater than 0) outside the roots.
  Answer:  x < −2  or  x > 3
```

For a rational inequality, first move everything to one side and combine over a single denominator, then find the critical values from both the numerator and the denominator. Remember that the denominator may never equal zero.

## Simultaneous equations

When one equation is linear and the other is quadratic, solve the linear equation for one variable and substitute it into the quadratic. You will get an ordinary quadratic equation to solve, and each root pairs with a value of the other variable.

If both equations are quadratic, the usual Grade 11 approach is still substitution after rearranging one of them to make a variable the subject.

## Worked example 1: The quadratic formula

Solve 2x² − 4x − 3 = 0, leaving the answer in surd form and then rounding to two decimals.

Step 1 — Identify a, b and c.
a = 2, b = −4, c = −3.

Step 2 — Calculate the discriminant.
Δ = b² − 4ac = (−4)² − 4(2)(−3) = 16 + 24 = 40.

Step 3 — Apply the formula.
x = (−b ± √Δ) ÷ (2a) = (4 ± √40) ÷ 4.

Step 4 — Simplify the surd. √40 = √(4 × 10) = 2√10.
x = (4 ± 2√10) ÷ 4 = (2 ± √10) ÷ 2.

Step 5 — Round if asked. √10 ≈ 3.162.
x ≈ 2.581 or x ≈ −0.581.

Answer: x = (2 + √10)/2 or x = (2 − √10)/2, which is x ≈ 2.58 or x ≈ −0.58.

## Worked example 2: A linear and a quadratic together

Solve simultaneously: y = x − 3 and x² + y² = 17.

Step 1 — The linear equation already makes y the subject, so substitute y = x − 3 into the quadratic.
x² + (x − 3)² = 17.

Step 2 — Expand and simplify.
x² + x² − 6x + 9 = 17
2x² − 6x + 9 = 17
2x² − 6x − 8 = 0
x² − 3x − 4 = 0 (divide through by 2).

Step 3 — Factorise.
(x − 4)(x + 1) = 0, so x = 4 or x = −1.

Step 4 — Find the matching y values using y = x − 3.
If x = 4, then y = 1.
If x = −1, then y = −4.

Step 5 — Check in the original quadratic, x² + y² = 17.
For (4, 1): 16 + 1 = 17. Correct.
For (−1, −4): 1 + 16 = 17. Correct.

Answer: (4, 1) and (−1, −4).

## Worked example 3: A quadratic inequality

Solve x² − x − 6 > 0.

Step 1 — Factorise the left side.
x² − x − 6 = (x − 3)(x + 2).

Step 2 — Find the critical values by setting each factor to zero.
x = 3 and x = −2.

Step 3 — The coefficient of x² is positive, so the parabola opens upwards and the product is positive outside the two roots. Locate the critical values on a sign line and test: at x = 0 the product is (−3)(2) = −6, which is negative, confirming the middle interval is negative.

Step 4 — Read off the solution.
Answer: x < −2 or x > 3.

## Common mistakes

- Dropping the ± sign in the quadratic formula. Every valid quadratic has two roots until the discriminant tells you otherwise.
- Forgetting to reverse the inequality sign when you multiply or divide by a negative number. For example, −2x > 6 gives x < −3, not x > −3.
- Dividing both sides of an equation by a variable that might be zero, which silently loses a solution.
- Reading the discriminant the wrong way round: Δ < 0 means there are no real roots, not that the equation has no solution.
- Mixing up "and" with "or". A solution between the roots uses "and"; the solution outside the roots uses "or".
- Forgetting to substitute answers back into a rational or surd equation, so a value that makes a denominator zero slips through.
- Arithmetic slips when completing the square: half of b, squared, must be both added and subtracted.

## Quick summary / cheat sheet

| Situation | Best method |
|---|---|
| Easy whole-number factorisation | factorising |
| Need the turning point as well | completing the square |
| Messy surd answer, or asked to round | quadratic formula |
| Asked about the nature of roots | discriminant Δ = b² − 4ac |
| One linear plus one quadratic | substitute, then solve the quadratic |
| Quadratic inequality | critical values, sign line, then intervals |
| Rational inequality | single denominator, critical values from top and bottom |

Key facts to remember:
- The quadratic formula is x = (−b ± √(b² − 4ac)) ÷ (2a).
- Δ > 0 gives two distinct real roots, Δ = 0 gives equal real roots, Δ < 0 gives no real roots.
- For a > 0, ax² + bx + c > 0 outside the roots and < 0 between the roots.
- For a < 0, the pattern reverses.
- Always test and, where relevant, reject solutions that do not fit.

## Practice questions

1. Solve x² − 5x − 14 = 0 by factorising.
2. Solve 3x² + 2x − 4 = 0, correct to two decimal places.
3. Determine the nature of the roots of x² + 6x + 9 = 0.
4. For which values of p does 2x² + px + 8 = 0 have equal roots?
5. Solve the inequality x² + 2x − 8 ≤ 0.
6. Solve simultaneously: y = x − 3 and x² + y² = 17.
7. Solve 4/x + x = 5, for x ≠ 0.
8. Solve the inequality −2x + 5 > 11.

### Answers

1. (x − 7)(x + 2) = 0, so x = 7 or x = −2.
2. a = 3, b = 2, c = −4, so Δ = 4 + 48 = 52 and √52 ≈ 7.211. Then x = (−2 ± 7.211) ÷ 6, giving x ≈ 0.87 or x ≈ −1.54.
3. Δ = 6² − 4(1)(9) = 36 − 36 = 0, so the roots are equal (real and repeated, x = −3 twice).
4. For equal roots, Δ = 0, so p² − 4(2)(8) = 0, giving p² = 64 and p = 8 or p = −8.
5. (x + 4)(x − 2) ≤ 0 with roots at x = −4 and x = 2. The product is negative or zero between the roots, so −4 ≤ x ≤ 2.
6. Substitute y = x − 3 into x² + y² = 17: x² + (x − 3)² = 17, giving x² − 3x − 4 = 0 and (x − 4)(x + 1) = 0. So x = 4 or x = −1, giving y = 1 or y = −4. Answer: (4, 1) and (−1, −4).
7. Multiply both sides by x: 4 + x² = 5x, so x² − 5x + 4 = 0 and (x − 1)(x − 4) = 0. Both x = 1 and x = 4 are non-zero, so the answers are x = 1 or x = 4.
8. −2x + 5 > 11 gives −2x > 6, and dividing by −2 flips the sign, so x < −3.

Official EduRank Team notes. Always cross-check with your textbook and teacher.
