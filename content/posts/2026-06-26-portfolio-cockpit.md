---
title: A Cockpit for a Plane That's Barely Flying
date: '2026-06-26T12:00:00+01:00'
description: >-
  My project list outgrew its markdown file at sixteen entries. So I built a
  colour-coded morning dashboard - for a portfolio that barely has traffic yet.
slug: portfolio-cockpit
keywords:
  - personal portfolio dashboard
  - morning planning dashboard
seoTitle: Building a Personal Portfolio Dashboard
---

For months, the way I decided what to work on each morning was to open a markdown file and read down it.

It's an inbox of bets — every small thing I'm building or thinking about building, one entry each, with a `status:` field. `inbox`, `evaluating`, `greenlit`, `parked`, `killed`. I'd scan the list, feel my way to whichever one was nagging me most, and start there. A founder's gut call, performed against a flat text file, before the coffee had fully landed.

It worked fine at six entries. I'd even left myself a note, buried in the repo's README, that I should revisit the approach "if the inbox grows to ~15+." Classic future-me problem.

Last week I counted. Sixteen.

> I do love when past-me leaves a tripwire and present-me walks straight into it, perfectly on schedule.

## The thing markdown can't do

The reason the gut call stopped working isn't that there were too many entries. It's that the entries had started carrying *numbers* — a waitlist count here, a few days of analytics there, a stack of open issues — and markdown is a genuinely terrible place to look at numbers.

It can't colour a cell red when something's gone stale. It can't sort by least-touched. It can't put a sparkline next to a signup count so you can watch the line bend. A markdown table is a fine place to *store* numbers and a miserable place to *read* them. And I read in colour - show me a wall of green with one angry red square and my eye lands on the red before I've consciously read a single word.

So I'd been using the wrong surface, and dressing it up as discipline.

## Two surfaces, not one

Here's the fix, and it's the bit I think travels past my particular mornings.

I'd been asking one surface to do two completely different jobs. *Assessing* — taking in the state of everything, fast, passively, letting my eye find the problem. And *deciding* — choosing what I'll actually do today and saying it out loud. Those feel like one motion when you run them in your head. They aren't, and stacking them into a single markdown file is what made both of them worse.

So I split them.

Assessing is now a dashboard. I built a small thing called Bearings ([bearings.crafts.software](https://bearings.crafts.software)) that pulls the signals from wherever they already live: visitor numbers from my self-hosted [Umami](https://umami.is/), open issues from Linear, waitlist and subscriber counts straight off each project's own endpoint. It renders the lot as one table, every row red/amber/green by how stale it's gone. `bun run orient` in the morning and the snapshot's there — no typing, no remembering to hand-update a status field. The colour does the pointing.

Deciding stayed a conversation. A `/daily` agent reads the same data and we talk it through — it proposes a shortlist, I push back, I declare the one or two things I'm actually doing. That part *should* be slow, deliberate, full of judgement. It's the only part that was ever really mine.

> The dashboard is passive on purpose. The second it starts telling me what to do, I've just rebuilt the markdown file with extra steps and a colour scheme.

## The honest bit

I should tell you what the dashboard actually says right now, because it's funny.

Most of the cells are small. One project did two pageviews yesterday. A waitlist I'm quietly fond of is sitting in single digits. There's a real, RAG-coloured, sortable, server-rendered cockpit — and a decent chunk of it reads `0`, `2`, `3`.

I built an instrument panel for a plane that is, generously, taxiing.

But that's rather the point, and it's why I'm not embarrassed by it. The numbers being small today isn't the problem the dashboard solves. The problem it solves is that I'll *look* — every morning, at all of it, in a shape my eye actually reads — and I'll catch the line the day it starts moving. The habit is the asset. The cockpit is just what makes the habit cost nothing.

It's the same move as [forking someone else's app and bending it to fit my hand](/blog/scrappy-personal-software): not building for users I don't have, just filing down the one workflow I run every single day until it fits exactly. Last time it was a meeting recorder. This time it's the five minutes before I start work.
