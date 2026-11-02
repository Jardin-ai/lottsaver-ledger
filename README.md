# LottSaver Ledger

[LottSaver](https://akifukaku.com/products/lottsaver) runs a public experiment: $100 a week, on paper, in each of 25 lotteries. No ticket is ever bought and no money is wagered. Results are posted daily.

This repo lets you check that the lines were not picked after the draw.

## The rule

Each number of each line comes from SHA-256 of public facts only:

```
lottsaver-ledger-v1|<game>|<draw date>|<line number>|<pool>|<counter>
```

- The digest is cut into 32-bit words. Words at or above the largest whole multiple of the pool size are thrown away, so low numbers are not favoured.
- `pool min + word % pool size` gives a number. Repeats within a pool are thrown away, then the numbers are sorted.
- Nothing secret goes in, and nothing about the draw result. The same lines come out before and after the draw.
- Lines are independent, so a line can repeat within a draw.

`spec-v1.json` lists the 25 games, their number pools and how many lines each draw gets. A week's budget is split evenly across that game's draws, rounded down. One weekly budget counts as $100, which is the only exchange rate the ledger uses.

The ledger starts on 2026-11-01. A change to any rule means a new version, and earlier results are not recalculated.

## Check it

Needs Node.js, nothing else.

```bash
node verify.mjs us.powerball 2026-11-02
```

Each daily image prints a fingerprint of that day's lines. To recompute it, list the draws in the image:

```bash
node verify.mjs --day 2026-11-03 us.powerball=2026-11-02 saturday-lotto=2026-11-01
```

## What this does not prove

This shows the lines are fixed in advance. Prizes come from each operator's published results, so check winnings against the operator's own site. Draws waiting on published prizes are shown as pending and are not counted until they are published.

Not affiliated with any lottery operator. LottSaver does not sell tickets or take bets.
