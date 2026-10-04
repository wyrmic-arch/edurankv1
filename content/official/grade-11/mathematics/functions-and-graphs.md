---
title: Functions and Graphs — Complete Notes
subject: mathematics
grade: 11
topic: Functions and graphs
slug: grade-11-mathematics-functions-and-graphs
description: Grade 11 CAPS functions and graphs: parabolas, hyperbolas, exponential graphs, transformations, domain and range, and average gradient explained.
license: all-rights-reserved
order: 3
---

## What you'll learn

- Sketch and interpret the parabola, hyperbola and exponential function.
- Find turning points, axes of symmetry, intercepts and asymptotes.
- State the domain and range of each function accurately.
- Apply vertical and horizontal shifts, reflections and stretches to a graph.
- Calculate the average gradient of a function between two points.

## The vocabulary you must know

A function is a rule that gives exactly one output for every input. The set of allowed inputs is the domain, and the set of possible outputs is the range.

- x-intercept: where the graph cuts the x-axis, found by setting y = 0.
- y-intercept: where the graph cuts the y-axis, found by setting x = 0.
- Turning point: the maximum or minimum point of a parabola.
- Axis of symmetry: the vertical line through the turning point.
- Asymptote: a line that the graph gets closer and closer to but never touches.

## The parabola (quadratic function)

The turning-point form of a parabola is y = a(x − p)² + q.

- Turning point: (p ; q).
- Axis of symmetry: x = p.
- Opens upwards if a > 0, downwards if a < 0.
- Range: y ≥ q if a > 0, or y ≤ q if a < 0.

```
          y
          ^
     8 ---+-----*  turning point (1 ; 8)
          |    / \
     6 ---+---/---\------*  y-intercept (0 ; 6)
          |  /     \
     0 ---*--+------*--------> x
        (-1;0)  1  (3;0)

   y = −2(x − 1)² + 8   opens downwards, axis of symmetry x = 1
```

If the parabola is given in standard form y = ax² + bx + c, the x-coordinate of the turning point is x = −b ÷ (2a). Substitute that value back into the equation to get the y-coordinate.

## The hyperbola

The standard form of a hyperbola is y = a ÷ (x − p) + q.

- Vertical asymptote: x = p.
- Horizontal asymptote: y = q.
- Domain: x ≠ p.
- Range: y ≠ q.
- If a > 0 the two branches sit in the top-right and bottom-left regions; if a < 0 they swap.

```
          y
          ^
          |   (top-right branch)
       q -+- - - - - - - - - -  horizontal asymptote y = q
          | *
          |*
          +----------------------> x
               |
               x = p  (vertical asymptote)

   y = 3/(x − 2) + 1   asymptotes at x = 2 and y = 1
```

## The exponential function

The standard form is y = a × b^x + q, where b > 0 and b ≠ 1.

- Horizontal asymptote: y = q.
- If b > 1 the graph increases; if 0 < b < 1 it decreases.
- If a > 0 the range is y > q; if a < 0 the range is y < q.
- The graph always cuts the y-axis at y = a + q (put x = 0).

```
          y
          ^
          |           *
          |        *
          |     *
       q -+- - - - - - - - - -   asymptote y = q
          | *
          |*
          +-------------------> x

   y = 2 × 3^x − 1    increasing, approaches y = −1 but never reaches it
```

## Transformations

Every change to the equation moves or reshapes the graph. Starting from y = f(x):

| Transformation | Effect on the graph |
|---|---|
| y = f(x) + q | shift up by q (down if q is negative) |
| y = f(x − p) | shift right by p (left if p is negative) |
| y = −f(x) | reflect in the x-axis |
| y = f(−x) | reflect in the y-axis |
| y = a·f(x) | vertical stretch by a factor a (or a reflection if a < 0) |

A useful check: inside the bracket, the sign works the opposite way to what you might expect. y = (x − 3)² shifts three units to the right, not left.

## Average gradient

The average gradient of a function f between x = a and x = b is the gradient of the straight line joining the two points on the graph:

Average gradient = (f(b) − f(a)) ÷ (b − a)

It measures how fast the function changes on average over that interval. For a straight line this is just the gradient of the line; for a curve it is the gradient of the secant between the two points.

## Worked example 1: Sketching a parabola

Sketch y = −2(x − 1)² + 8 and state its intercepts, turning point and range.

Step 1 — Read off the shape. The equation is already in turning-point form with a = −2, p = 1, q = 8. Because a < 0 the parabola opens downwards and the turning point is a maximum.

Turning point: (1 ; 8). Axis of symmetry: x = 1.

Step 2 — Find the y-intercept by setting x = 0.
y = −2(0 − 1)² + 8 = −2(1) + 8 = 6. So the y-intercept is (0 ; 6).

Step 3 — Find the x-intercepts by setting y = 0.
−2(x − 1)² + 8 = 0
−2(x − 1)² = −8
(x − 1)² = 4
x − 1 = ±2
x = 3 or x = −1.
So the x-intercepts are (3 ; 0) and (−1 ; 0).

Step 4 — State the range. The maximum value is the turning point's y-value, so y ≤ 8.

Answer: turning point (1 ; 8), x-intercepts at −1 and 3, y-intercept at 6, range y ≤ 8.

## Worked example 2: Analysing a hyperbola

For y = 3/(x − 2) + 1, write down the asymptotes, the domain, the range and the intercepts.

Step 1 — Identify the asymptotes from the form y = a/(x − p) + q.
Vertical asymptote: x = 2. Horizontal asymptote: y = 1.

Step 2 — Domain and range.
The graph is undefined at x = 2, so the domain is x ≠ 2.
The graph never reaches y = 1, so the range is y ≠ 1.

Step 3 — y-intercept (put x = 0).
y = 3/(0 − 2) + 1 = 3/(−2) + 1 = −3/2 + 1 = −1/2.

Step 4 — x-intercept (put y = 0).
0 = 3/(x − 2) + 1
−1 = 3/(x − 2)
−1(x − 2) = 3
x − 2 = −3
x = −1.

Answer: asymptotes x = 2 and y = 1; domain x ≠ 2; range y ≠ 1; y-intercept −1/2; x-intercept −1.

## Worked example 3: Exponential graph and average gradient

Given f(x) = 2 × 3^x − 1, state the asymptote and range, find f(0), and calculate the average gradient between x = 0 and x = 2.

Step 1 — Read the asymptote and range. Here a = 2 (positive) and q = −1, so the horizontal asymptote is y = −1 and, because a > 0, the range is y > −1.

Step 2 — Find f(0).
f(0) = 2 × 3⁰ − 1 = 2 × 1 − 1 = 1. So the y-intercept is (0 ; 1).

Step 3 — Find f(2).
f(2) = 2 × 3² − 1 = 2 × 9 − 1 = 18 − 1 = 17.

Step 4 — Apply the average gradient formula.
Average gradient = (f(2) − f(0)) ÷ (2 − 0) = (17 − 1) ÷ 2 = 16 ÷ 2 = 8.

Answer: asymptote y = −1; range y > −1; f(0) = 1; average gradient = 8.

## Finding the equation from a graph

If you are given the turning point and one other point on a parabola, substitute into y = a(x − p)² + q using the turning point for p and q, then use the other point to solve for a. For a hyperbola, read the asymptotes to get p and q, then substitute any known point to find a.

## Common mistakes

- Getting the sign of p wrong. The turning point of y = (x − 2)² + 5 is (2 ; 5), not (−2 ; 5).
- Confusing domain and range. Domain is about the inputs (x-values), range is about the outputs (y-values).
- Forgetting to exclude the asymptote from the range of a hyperbola or exponential graph.
- Believing an exponential graph can be negative. The value 3^x is always positive, so y = 3^x never dips below the x-axis.
- Reporting the average gradient where a single point's gradient was asked for, or the other way round.
- Plotting too few points and drawing a parabola as a set of straight lines instead of a smooth curve.
- Mixing up reflections: y = −f(x) flips the graph vertically, while y = f(−x) flips it horizontally.

## Quick summary / cheat sheet

| Function | Form | Key features |
|---|---|---|
| Parabola | y = a(x − p)² + q | turning point (p ; q), axis x = p, opens up if a > 0 |
| Hyperbola | y = a/(x − p) + q | asymptotes x = p and y = q, domain x ≠ p, range y ≠ q |
| Exponential | y = a·b^x + q | asymptote y = q, range y > q if a > 0, always increasing or decreasing |

Transformations of y = f(x):
- +q shifts up, −q shifts down.
- (x − p) shifts right, (x + p) shifts left.
- −f(x) reflects in the x-axis, f(−x) reflects in the y-axis.
- a·f(x) stretches vertically.

Average gradient between a and b:
- (f(b) − f(a)) ÷ (b − a).

## Practice questions

1. Given f(x) = (x − 2)² − 9, write down the turning point and the x-intercepts.
2. Sketch y = 2^x − 4. State the asymptote, the y-intercept and the range.
3. For y = −3/(x + 1) + 2, write down the asymptotes, the domain and the range.
4. The parabola y = a(x + p)² + q has turning point (−1 ; 4) and passes through (0 ; 1). Find the value of a.
5. Calculate the average gradient of f(x) = x² − 2x between x = 1 and x = 4.
6. State the domain and range of y = 1/(x − 3) − 2.
7. For f(x) = 5 × 2^x, find f(−1).
8. The graph of y = x² is shifted 3 units to the right and 2 units up. Write the new equation.

### Answers

1. Turning point (2 ; −9). For the x-intercepts, set y = 0: (x − 2)² = 9, so x − 2 = ±3, giving x = 5 or x = −1.
2. Asymptote y = −4. y-intercept: 2⁰ − 4 = 1 − 4 = −3, so the point is (0 ; −3). Since a > 0, the range is y > −4.
3. Asymptotes x = −1 (vertical) and y = 2 (horizontal). Domain: x ≠ −1. Range: y ≠ 2.
4. With turning point (−1 ; 4), the form is y = a(x + 1)² + 4. Substitute (0 ; 1): 1 = a(1)² + 4, so a = −3. The equation is y = −3(x + 1)² + 4.
5. f(4) = 16 − 8 = 8 and f(1) = 1 − 2 = −1. Average gradient = (8 − (−1)) ÷ (4 − 1) = 9 ÷ 3 = 3.
6. Domain: x ≠ 3. Range: y ≠ −2.
7. f(−1) = 5 × 2⁻¹ = 5 × 1/2 = 2.5.
8. A right shift of 3 gives (x − 3)², and an upward shift of 2 adds 2, so the new equation is y = (x − 3)² + 2.

Official EduRank Team notes. Always cross-check with your textbook and teacher.
