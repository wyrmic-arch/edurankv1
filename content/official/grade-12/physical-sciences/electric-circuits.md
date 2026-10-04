---
title: Electric Circuits — Complete Notes
subject: physical-sciences
grade: 12
topic: Electric circuits
slug: grade-12-physical-sciences-electric-circuits
description: Grade 12 electric circuits — Ohm's law, series and parallel resistors, emf and internal resistance, power, energy and the cost of electricity, worked examples.
license: all-rights-reserved
order: 3
---

## What you'll learn
- Define emf, terminal potential difference and internal resistance.
- Apply Ohm's law to single components, series networks and parallel networks.
- Calculate equivalent resistance for series and parallel combinations.
- Solve circuits that include a battery's internal resistance.
- Calculate power, energy and the cost of electricity in kilowatt-hours.
- Avoid the resistor-network and unit errors that cost marks in the examination.

## Circuit quantities and units
Electric circuits describe how charge flows and how energy is transferred. Before calculating, get the units right.

| Quantity | Symbol | Unit | Unit symbol |
|---|---|---|---|
| Current | I | ampere | A |
| Potential difference | V | volt | V |
| Resistance | R | ohm | Ω |
| Electromotive force (emf) | ε | volt | V |
| Power | P | watt | W |
| Energy | E | joule or kilowatt-hour | J or kWh |

Current is the rate of flow of charge: I = Q/Δt, and one ampere is one coulomb per second (1 A = 1 C·s⁻¹). Potential difference is the energy transferred per unit charge: V = W/Q, and one volt is one joule per coulomb (1 V = 1 J·C⁻¹).

## Ohm's law
Ohm's law states that the current through a conductor is directly proportional to the potential difference across its ends, provided the temperature remains constant.

V = I·R  or  R = V/I

In words: resistance is the potential difference across a component divided by the current through it. Resistors that obey this relationship produce a straight-line graph of V against I, and the gradient of that graph equals the resistance. To find the resistance from a V–I graph, calculate the gradient.

## Series circuits
Components are connected one after the other so that the same current flows through each.
- Current is the same through every component: I_total = I₁ = I₂ = …
- Potential differences add: V_total = V₁ + V₂ + …
- Equivalent resistance: R_series = R₁ + R₂ + R₃ + …

## Parallel circuits
Components are connected across the same two points so that each branch has the same potential difference across it.
- Potential difference is the same across every branch: V_total = V₁ = V₂ = …
- Currents add: I_total = I₁ + I₂ + …
- Equivalent resistance: 1/R_parallel = 1/R₁ + 1/R₂ + 1/R₃ + …

For two resistors in parallel there is a useful shortcut:

R_parallel = (R₁ × R₂) / (R₁ + R₂)

Note that the equivalent resistance of a parallel combination is always smaller than the smallest individual resistor. This is one of the most reliable checks you can apply.

## emf and internal resistance
A real battery is not ideal: it has its own internal resistance, r. The cell does work on the charges and gives them energy. The emf (ε) is the maximum energy that the cell can supply per unit charge. When current flows, some of this energy per unit charge is used to push charge through the cell's own internal resistance — these are the "lost volts". The rest appears across the external circuit as the terminal potential difference, V.

- Circuit with external resistance R: ε = I(R + r)
- Terminal potential difference: V = ε − I·r
- Lost volts = I·r
- Total external resistance R_total = R_external + r when solving for current

When no current flows (the circuit is open), the terminal potential difference equals the emf. When current flows, the terminal potential difference is always less than the emf.

## Power and energy
Electrical power is the rate at which electrical energy is transferred:

P = V·I = I²·R = V²/R

Energy is power multiplied by time:

E = P·t

When P is in watts and t is in seconds, E is in joules. Electrical energy for billing is usually measured in kilowatt-hours (kWh):

1 kWh = 3.6 × 10⁶ J

Cost of electricity = energy in kWh × price per kWh

## Worked example 1: Resistors in series
Two resistors, 4 Ω and 6 Ω, are connected in series across a 12 V battery of negligible internal resistance. Calculate the current in the circuit and the potential difference across each resistor.

Step 1 — Equivalent resistance.
R_series = 4 + 6 = 10 Ω

Step 2 — Current (same through both resistors).
I = V/R = 12/10 = 1.2 A

Step 3 — Potential difference across each resistor.
V_4Ω = I·R = (1.2)(4) = 4.8 V
V_6Ω = I·R = (1.2)(6) = 7.2 V

Check: 4.8 + 7.2 = 12 V, which equals the supply. The potential differences add, as expected in series.

## Worked example 2: Parallel branches with internal resistance
A battery has an emf of 12 V and an internal resistance of 0.5 Ω. It is connected to a 6 Ω resistor and a 3 Ω resistor in parallel. Calculate:
(a) the current through the battery,
(b) the terminal potential difference,
(c) the current in each resistor.

Step 1 — Equivalent resistance of the parallel pair.
R_parallel = (R₁ × R₂) / (R₁ + R₂) = (6 × 3) / (6 + 3) = 18/9 = 2 Ω

Step 2 — Total resistance of the whole circuit (external plus internal).
R_total = R_parallel + r = 2 + 0.5 = 2.5 Ω

Step 3 — Current through the battery.
I = ε / R_total = 12/2.5 = 4.8 A

Step 4 — Terminal potential difference.
V = ε − I·r = 12 − (4.8)(0.5) = 12 − 2.4 = 9.6 V

Step 5 — Current in each branch (same 9.6 V across each).
I_6Ω = V/R = 9.6/6 = 1.6 A
I_3Ω = V/R = 9.6/3 = 3.2 A

Check: 1.6 + 3.2 = 4.8 A, which equals the battery current. The branch currents add, as expected in parallel.

## Worked example 3: Cost of electrical energy
A geyser rated at 2000 W runs for 3 hours every day. Electricity costs R2.50 per kilowatt-hour. Calculate the energy used in one day, the energy used in 30 days, and the total cost for 30 days.

Step 1 — Convert power to kilowatts. 2000 W = 2 kW.

Step 2 — Energy per day.
E = P·t = 2 kW × 3 h = 6 kWh

Step 3 — Energy over 30 days.
E_total = 6 × 30 = 180 kWh

Step 4 — Cost.
Cost = 180 kWh × R2.50/kWh = R450.00

For interest, in joules: 180 kWh × 3.6 × 10⁶ = 6.48 × 10⁸ J.

## Common mistakes
- Adding the reciprocals for parallel resistors but forgetting to invert the answer to find R_parallel.
- Swapping the series and parallel rules: in series, current is the same and voltage adds; in parallel, voltage is the same and current adds.
- Forgetting internal resistance and using the emf as if it were the terminal potential difference.
- Using ε in V = I·R when you should use the terminal potential difference across the external resistor.
- Mixing watts and kilowatts, or minutes and hours, when calculating the cost of electricity.
- Thinking current is "used up" as it flows around a series circuit — it is not.
- Assuming a parallel equivalent resistance can be larger than the smallest resistor in the branch — it cannot.
- Forgetting that the internal resistance is part of the total resistance when finding the current.

## Quick summary / cheat sheet
```
Ohm's law:        V = I·R
Series:           R = R₁ + R₂ + ...     (I same, V adds)
Parallel:         1/R = 1/R₁ + 1/R₂ + ...
Two resistors:    R = (R₁ × R₂)/(R₁ + R₂)   (V same, I adds)
Internal resist.: ε = I(R + r)
Terminal p.d.:    V = ε − I·r
Lost volts:       I·r
Power:            P = V·I = I²·R = V²/R
Energy:           E = P·t
Energy billing:   1 kWh = 3.6 × 10⁶ J
Cost = (energy in kWh) × (price per kWh)
```

Useful checks: the parallel equivalent resistance is always less than the smallest resistor; branch currents must add up to the total current; potential differences in series must add up to the supply (or terminal) voltage.

## Practice questions
1. Three resistors, 2 Ω, 3 Ω and 5 Ω, are connected in series across a 20 V supply of negligible internal resistance. Calculate the total resistance, the current, and the potential difference across each resistor.
2. Two resistors, 4 Ω and 12 Ω, are connected in parallel. Calculate the equivalent resistance.
3. A battery has an emf of 9 V and an internal resistance of 1 Ω. It is connected to an 8 Ω resistor. Calculate the current, the lost volts, and the terminal potential difference.
4. A 60 W light bulb is used for 5 hours. Calculate the energy it uses in kilowatt-hours and in joules.
5. Calculate the cost of running a 1500 W heater for 4 hours if electricity costs R2.20 per kilowatt-hour.
6. A 6 Ω resistor and a 3 Ω resistor are connected in parallel across a 12 V battery of negligible internal resistance. Calculate the total current drawn from the battery and the power delivered by the battery.
7. Explain why the terminal potential difference of a cell is less than its emf when current is flowing.

### Answers
1. R_total = 2 + 3 + 5 = 10 Ω. I = V/R = 20/10 = 2 A. V_2Ω = (2)(2) = 4 V; V_3Ω = (2)(3) = 6 V; V_5Ω = (2)(5) = 10 V. Check: 4 + 6 + 10 = 20 V.
2. R = (4 × 12)/(4 + 12) = 48/16 = 3 Ω.
3. R_total = 8 + 1 = 9 Ω. I = ε/R_total = 9/9 = 1 A. Lost volts = I·r = (1)(1) = 1 V. V = ε − I·r = 9 − 1 = 8 V. (This also equals I·R = (1)(8) = 8 V.)
4. 60 W = 0.06 kW. E = P·t = 0.06 kW × 5 h = 0.3 kWh. In joules: 0.3 × 3.6 × 10⁶ = 1.08 × 10⁶ J.
5. 1500 W = 1.5 kW. E = 1.5 kW × 4 h = 6 kWh. Cost = 6 kWh × R2.20/kWh = R13.20.
6. R_parallel = (6 × 3)/(6 + 3) = 18/9 = 2 Ω. I = V/R = 12/2 = 6 A. P = V·I = (12)(6) = 72 W. (Check via branches: I_6Ω = 2 A, I_3Ω = 4 A, total 6 A.)
7. When current flows, some energy per unit charge is used to overcome the internal resistance of the cell (the lost volts, equal to I·r). Because energy per unit charge is potential difference, the terminal potential difference is the emf minus the lost volts: V = ε − I·r, so V is less than ε whenever current flows.

Official EduRank Team notes. Always cross-check with your textbook and teacher.
