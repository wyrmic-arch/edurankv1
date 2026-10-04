---
title: Sequences and Series — Complete Notes
subject: mathematics
grade: 12
topic: Sequences and series
slug: grade-12-mathematics-sequences-and-series
description: Grade 12 CAPS guide to arithmetic and geometric sequences and series, sigma notation and sums to infinity, with worked examples and practice questions.
license: all-rights-reserved
order: 2
---

## What you'll learn

- The difference between a sequence (a list) and a series (a sum).
- How to use the arithmetic formulas for the nth term and the sum.
- How to use the geometric formulas for the nth term and the sum.
- When a geometric series converges, and how to find the sum to infinity.
- How to read and evaluate sigma notation.

## The big picture

A **sequence** is an ordered list of numbers that follows a rule. For example, 3, 7, 11, 15, ... is a sequence because each term is 4 more than the one before it.

A **series** is what you get when you **add** the terms of a sequence together: 3 + 7 + 11 + 15 + ...

In CAPS you study two families — **arithmetic** (constant difference) and **geometric** (constant ratio). Learn to spot which one you are dealing with in the first ten seconds of a question, because every formula depends on that choice.

## Key notation

- a = the first term.
- d = the common difference (arithmetic).
- r = the common ratio (geometric).
- n = the position number of a term.
- Tₙ = the nth term.
- Sₙ = the sum of the first n terms.

## Arithmetic sequences

An arithmetic sequence has a **constant difference** d between consecutive terms: T₂ − T₁ = T₃ − T₂ = d.

**nth term:** Tₙ = a + (n − 1)d

**Sum of the first n terms:** Sₙ = n/2 [ 2a + (n − 1)d ]

If the last term l is known you can use the shorter form: Sₙ = n/2 (a + l).

```
Arithmetic:  3    7    11   15   19
              \  /  \  /  \  /  \  /
               +4    +4    +4    +4     (constant difference d = 4)
```

## Geometric sequences

A geometric sequence has a **constant ratio** r between consecutive terms: T₂/T₁ = T₃/T₂ = r.

**nth term:** Tₙ = a·r^(n−1)

**Sum of the first n terms** (for r ≠ 1): Sₙ = a(rⁿ − 1)/(r − 1)

The alternative form Sₙ = a(1 − rⁿ)/(1 − r) is equivalent; use whichever gives fewer negative signs.

```
Geometric:   2    6    18    54
             \  /  \  /  \  /
              x3    x3    x3        (constant ratio r = 3)
```

## Sum to infinity

If the ratio r satisfies −1 < r < 1 (that is, |r| < 1), the terms shrink towards zero and the series **converges** to a finite total:

S∞ = a / (1 − r)

If |r| ≥ 1 the terms do not shrink, so the sum to infinity does **not** exist. For r = 1 every term is the same and the total grows without limit; for r = −1 the partial sums keep flipping between two values.

The condition |r| < 1 is written as −1 < r < 1 and must always be stated when you use the formula.

## Sigma notation

The symbol Σ (sigma) means "add up". In

Σ (from k = 1 to n) of Tₖ

k is a counter that runs from 1 to n, and each Tₖ is added. For example:

Σ (from k = 1 to 4) of (2k + 1) = 3 + 5 + 7 + 9 = 24

Recognise the structure: if the terms form an arithmetic or geometric pattern, replace the sigma with the correct sum formula.

## Worked example 1 — arithmetic

The sequence 7, 11, 15, ... is arithmetic. Find the 20th term and the sum of the first 20 terms.

**Step 1 — identify a and d.**
a = 7 and d = 11 − 7 = 4.

**Step 2 — nth term.**
T₂₀ = 7 + (20 − 1)(4) = 7 + 76 = 83.

**Step 3 — sum.**
S₂₀ = 20/2 [ 2(7) + (20 − 1)(4) ] = 10 [ 14 + 76 ] = 10 × 90 = 900.

So T₂₀ = 83 and S₂₀ = 900.

## Worked example 2 — geometric

In a geometric sequence the second term is 6 and the fifth term is 162. Find r, a and the first six terms.

**Step 1 — write what you know.**
T₂ = a·r = 6 and T₅ = a·r⁴ = 162.

**Step 2 — divide to eliminate a.**
(a·r⁴) / (a·r) = 162 / 6 → r³ = 27 → r = 3.

**Step 3 — find a.**
a·3 = 6 → a = 2.

The first six terms are 2, 6, 18, 54, 162, 486.

## Worked example 3 — sum to infinity and sigma

Evaluate Σ (from k = 1 to 8) of 3 × 2^(k−1).

**Step 1 — recognise the pattern.**
The terms are 3, 6, 12, 24, ... This is geometric with a = 3 and r = 2.

**Step 2 — apply the geometric sum formula.**
S₈ = 3(2⁸ − 1) / (2 − 1) = 3(256 − 1) = 3 × 255 = 765.

**Step 3 — check convergence separately.**
Because r = 2 and |2| ≥ 1, this series does **not** have a sum to infinity.

## How to recognise the sequence type

Before choosing a formula, test the pattern two ways:

| Test | Arithmetic | Geometric |
|---|---|---|
| Subtract consecutive terms | same number every time | not constant |
| Divide consecutive terms | not constant | same number every time |

Quick check: for 5, 10, 20, 40 the differences are 5, 10 and 20 (not constant), but the ratios are 2, 2 and 2 (constant), so it is geometric.

Some sequences are neither. A quadratic sequence such as 1, 4, 9, 16 has a constant **second** difference, and CAPS sometimes asks for the general term of such a pattern. The two families in this chapter, however, are arithmetic and geometric.

## What convergence really means

A geometric series only settles down to a fixed total when each term is smaller than the one before it. If r = 1/2, the terms 8, 4, 2, 1, 1/2, ... keep halving, and the running total creeps ever closer to 16 without ever passing it. That fixed ceiling is the sum to infinity.

When −1 < r < 0 the terms alternate in sign but still shrink, so the series also converges. When |r| ≥ 1 the terms do not shrink towards zero, so the running total never settles, and the sum to infinity does not exist.

## Reading word problems

Many CAPS questions hide a sequence inside a story — savings plans, salary increases, population growth or stacks of bricks. The workflow is always the same:

1. List the first three or four numbers.
2. Decide whether they are arithmetic or geometric.
3. Translate the question into "find Tₙ", "find Sₙ" or "find S∞".
4. State a and d, or a and r, then substitute into the matching formula.

If a question asks "how many terms are needed", you are solving for n, which usually leads to a quadratic and a rejected negative answer.

## Common mistakes

- **Mixing up Tₙ and Sₙ.** Tₙ gives one term; Sₙ gives a total. Read the question carefully.
- **Using the wrong sign.** In Sₙ = a(rⁿ − 1)/(r − 1) a negative r can flip signs — work slowly and show every line.
- **Forgetting the convergence condition.** You may only use S∞ = a/(1 − r) when −1 < r < 1.
- **Assuming every sequence is arithmetic.** Test the ratio as well as the difference before you choose a formula.
- **Off-by-one errors.** The first term has n = 1, so Tₙ uses (n − 1), never n.
- **Not showing the formula.** CAPS awards method marks; write the formula before you substitute.

## Quick summary / cheat sheet

| Concept | Arithmetic | Geometric |
|---|---|---|
| Definition | constant difference d | constant ratio r |
| nth term | Tₙ = a + (n−1)d | Tₙ = a·r^(n−1) |
| Sum of n terms | Sₙ = n/2[2a + (n−1)d] | Sₙ = a(rⁿ − 1)/(r − 1) |
| Sum to infinity | never (unless d = 0) | S∞ = a/(1 − r), −1 < r < 1 |

Memory hook: **arithmetic adds, geometric multiplies.**

## Practice questions

1. Find the 15th term of the arithmetic sequence 5, 9, 13, ...
2. Find the sum of the first 12 terms of the arithmetic series with a = 3 and d = 5.
3. For the geometric sequence with a = 4 and r = −2, find T₆ and S₆.
4. Find the sum to infinity of 8 + 4 + 2 + ...
5. A geometric sequence has T₃ = 12 and T₆ = 96. Find a and r.
6. How many terms of the series 3 + 7 + 11 + ... are needed for the sum to equal 465?

### Answers

1. a = 5, d = 4: T₁₅ = 5 + 14(4) = **61**.
2. S₁₂ = 12/2[2(3) + 11(5)] = 6(6 + 55) = 6 × 61 = **366**.
3. T₆ = 4(−2)⁵ = 4(−32) = **−128**. S₆ = 4[(−2)⁶ − 1] / (−2 − 1) = 4(64 − 1)/(−3) = 252/(−3) = **−84**.
4. a = 8, r = 1/2 and −1 < r < 1, so S∞ = 8 / (1 − 1/2) = 8 / (1/2) = **16**.
5. r³ = 96/12 = 8 → **r = 2**; then a·r² = 12 → 4a = 12 → **a = 3**.
6. Sₙ = n/2[2(3) + (n−1)(4)] = n/2(4n + 2) = 2n² + n. Set 2n² + n = 465 → 2n² + n − 465 = 0 → (2n + 31)(n − 15) = 0 → **n = 15** (the negative root is rejected).

Official EduRank Team notes. Always cross-check with your textbook and teacher.
