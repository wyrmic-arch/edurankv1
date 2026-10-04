---
title: Differential Calculus — Complete Notes
subject: mathematics
grade: 12
topic: Differential calculus
slug: grade-12-mathematics-differential-calculus
description: Master Grade 12 CAPS differential calculus: limits, first principles, differentiation rules, tangents, stationary points, cubic graphs and optimisation.
license: all-rights-reserved
order: 1
---

## What you'll learn

- What a limit is and how it leads to the derivative.
- How to find the derivative from first principles.
- The power rule and how to differentiate sums, constants and roots.
- How to find the gradient at a point and the equation of a tangent line.
- How to locate and classify stationary points on a cubic function.
- How to sketch cubic graphs and solve practical optimisation problems.

## The big picture

Calculus is the mathematics of change. In Grade 12 you study **differential calculus**, which answers one central question: *how fast is something changing at a particular instant?*

Think of a car's speedometer. It does not tell you the average speed for the whole trip — it tells you the speed **at that exact moment**. The number on the speedometer is a derivative. Everything in this chapter is built to find that instantaneous rate of change.

CAPS examiners almost always combine three skills in one question: differentiate correctly, use the derivative to find a gradient or turning point, and then interpret the answer in context. So do not just memorise the rules — practise using them.

## Limits — the foundation

A **limit** describes the value a function approaches as the input gets closer and closer to some number — without necessarily reaching it.

We write:

lim (h → 0) f(x + h) = L

This means "as h gets very small, f(x + h) approaches L". We never actually set h = 0, because that would create division by zero. We simplify first, then let h shrink.

Key idea: if you substitute and get 0/0, the expression can usually be factorised or simplified to remove the problem.

## The derivative from first principles

The **derivative** of a function f(x) is the limit of the average gradient as the interval shrinks to zero:

f'(x) = lim (h → 0) [ f(x + h) − f(x) ] / h

This is called **differentiation from first principles**. The formula comes directly from the gradient formula m = (y₂ − y₁)/(x₂ − x₁), where the two points are (x, f(x)) and (x + h, f(x + h)).

```
Gradient of secant through   (x, f(x)) and (x+h, f(x+h))

        rise      f(x+h) - f(x)
  m  = -------  = --------------
        run            h

As h -> 0 the secant becomes the TANGENT,
and its gradient becomes f'(x).
```

## Notation

There are several ways to write the derivative. They all mean the same thing:

| Notation | Read as | Used when |
|---|---|---|
| f'(x) | "f prime of x" | function form |
| dy/dx | "dee y dee x" | y is the function |
| Dₓ[f(x)] | "D of f of x" | operator form |

## Rules for differentiation

Once you know the rules, you rarely use first principles again — but you must understand it because it is often examined directly.

### The power rule

If f(x) = xⁿ, then f'(x) = n·xⁿ⁻¹. Multiply by the old power, then reduce the power by one.

### The constant rule

The derivative of a constant is 0. A constant does not change, so its rate of change is zero.

### Constant multiple rule

d/dx [ k·f(x) ] = k·f'(x). A constant multiplier stays outside and is carried through.

### Sum and difference rule

Differentiate each term separately: d/dx [ f(x) ± g(x) ] = f'(x) ± g'(x).

### Roots and fractions

Rewrite them as powers first:

- √x = x^(1/2), so its derivative is (1/2)·x^(−1/2) = 1/(2√x)
- 1/x = x⁻¹, so its derivative is −x⁻² = −1/x²

## Gradient at a point and the tangent line

The derivative gives the **gradient of the tangent** at any point. To find the equation of a tangent at x = a:

1. Find the point: calculate f(a) to get the y-coordinate.
2. Find the gradient: calculate f'(a).
3. Use the straight-line formula: y − y₁ = m(x − x₁).

## Stationary points and the shape of a cubic

A **stationary point** is where the gradient is zero: f'(x) = 0. These are the turning points (or flat points) of the graph.

To classify each stationary point, use the second derivative f''(x):

| Condition at x = a | Nature | Shape |
|---|---|---|
| f'(a) = 0 and f''(a) < 0 | local maximum | peak |
| f'(a) = 0 and f''(a) > 0 | local minimum | valley |
| f'(a) = 0 and f''(a) = 0 | point of inflection | investigate further |

A cubic function f(x) = ax³ + bx² + cx + d can have at most two turning points and always has exactly one point of inflection.

## Sketching a cubic function

Follow this checklist every time:

1. Find the **y-intercept** by setting x = 0.
2. Find the **x-intercepts** by factorising f(x) = 0.
3. Find the **stationary points** from f'(x) = 0.
4. Classify them using f''(x).
5. Plot the points and join with a smooth curve. A positive cubic rises on the right; a negative cubic falls on the right.

```
   local max
     (1,5)          Cubic  y = x^3 - 6x^2 + 9x + 1
       *             rises from the bottom-left, peaks
      / \            at (1,5), dips to a valley at (3,1),
     /   \           then rises steeply again.
    /     \  local min
   /       * (3,1)
  /
```

## Worked example 1 — first principles

Find the derivative of f(x) = 3x² − 2x from first principles.

**Step 1 — write f(x + h).**
f(x + h) = 3(x + h)² − 2(x + h) = 3(x² + 2xh + h²) − 2x − 2h
= 3x² + 6xh + 3h² − 2x − 2h

**Step 2 — subtract f(x).**
f(x + h) − f(x) = (3x² + 6xh + 3h² − 2x − 2h) − (3x² − 2x)
= 6xh + 3h² − 2h

**Step 3 — divide by h.**
[ f(x + h) − f(x) ] / h = 6x + 3h − 2

**Step 4 — let h → 0.**
f'(x) = 6x − 2

## Worked example 2 — different rules

Differentiate f(x) = 5x⁴ − 3√x + 2/x.

**Step 1 — rewrite with powers.**
f(x) = 5x⁴ − 3x^(1/2) + 2x⁻¹

**Step 2 — apply the power rule to each term.**
f'(x) = 20x³ − 3·(1/2)x^(−1/2) + 2·(−1)x⁻²

**Step 3 — simplify.**
f'(x) = 20x³ − 3/(2√x) − 2/x²

## Worked example 3 — sketch a cubic

Sketch f(x) = x³ − 6x² + 9x + 1.

**y-intercept:** f(0) = 1, so the point is (0, 1).

**Stationary points:** f'(x) = 3x² − 12x + 9 = 3(x² − 4x + 3) = 3(x − 1)(x − 3).
So f'(x) = 0 when x = 1 or x = 3.
f(1) = 1 − 6 + 9 + 1 = 5 → (1, 5)
f(3) = 27 − 54 + 27 + 1 = 1 → (3, 1)

**Classify:** f''(x) = 6x − 12.
f''(1) = −6 < 0 → local maximum at (1, 5).
f''(3) = 6 > 0 → local minimum at (3, 1).

**Sketch:** the curve rises from the bottom-left, reaches a peak at (1, 5), dips to a valley at (3, 1), then rises steeply. It crosses the y-axis at y = 1.

## Common mistakes

- **Setting h = 0 too early.** You must simplify the fraction before letting h approach zero, otherwise you get 0/0.
- **Dropping the sign when differentiating 1/x.** The derivative of x⁻¹ is −x⁻², not x⁻².
- **Confusing f(x) with f'(x).** f(a) gives a y-value; f'(a) gives a gradient. They are different numbers.
- **Forgetting to find the y-coordinate.** When asked for a turning point, give both coordinates, not just x.
- **Misclassifying turning points.** Always test with f''(x); do not assume the first one is a maximum.
- **Not rewriting roots and fractions as powers** before differentiating — the power rule only works on powers.

## Quick summary / cheat sheet

| Concept | Formula |
|---|---|
| First principles | f'(x) = lim (h → 0) [ f(x+h) − f(x) ] / h |
| Power rule | d/dx (xⁿ) = n·xⁿ⁻¹ |
| Constant | d/dx (k) = 0 |
| Sum rule | d/dx (f ± g) = f' ± g' |
| Tangent gradient | m = f'(a) |
| Tangent line | y − y₁ = m(x − x₁) |
| Stationary points | solve f'(x) = 0 |
| Max / min test | f''(x) < 0 max · f''(x) > 0 min |

Quick memory hook: **multiply by the power, subtract one from the power.**

## Practice questions

1. Differentiate f(x) = x² + 3x from first principles.
2. Differentiate f(x) = 2x⁵ − 8x² + 7.
3. Find the gradient of the tangent to f(x) = x³ − 6x at x = −1.
4. Find and classify the stationary points of f(x) = x³ − 3x² − 9x + 5.
5. Find the equation of the tangent to f(x) = x² − 4x + 1 at x = 3.
6. A rectangular enclosure is fenced on three sides using 40 m of fencing (the fourth side is a wall). Find the dimensions that give the maximum area.

### Answers

1. f(x+h) − f(x) = 2xh + h² + 3h; divide by h → 2x + h + 3; h → 0 gives **f'(x) = 2x + 3**.
2. **f'(x) = 10x⁴ − 16x**.
3. f'(x) = 3x² − 6, so f'(−1) = 3 − 6 = **−3**.
4. f'(x) = 3(x − 3)(x + 1): stationary at x = 3 and x = −1. f(3) = −22 and f(−1) = 10. f''(x) = 6x − 6, so f''(3) = 12 > 0 → **local minimum at (3, −22)** and f''(−1) = −12 < 0 → **local maximum at (−1, 10)**.
5. f(3) = −2 and f'(3) = 2, so y + 2 = 2(x − 3), giving **y = 2x − 8**.
6. Let the two equal sides be x, so the third side is 40 − 2x. Area A = 40x − 2x². A'(x) = 40 − 4x = 0 → x = 10. The sides are **10 m, 10 m and 20 m**, giving a maximum area of **200 m²** (A'' = −4 < 0 confirms a maximum).

Official EduRank Team notes. Always cross-check with your textbook and teacher.
