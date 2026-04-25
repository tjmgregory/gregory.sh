---
title: Open Source Is a Parts Bin
date: '2026-04-25T12:00:00+01:00'
description: >-
  I forked Meetily this week and ripped its face off. When you stop pretending
  you'll ship to strangers, personal software gets very fast and very fun.
slug: scrappy-personal-software
keywords:
  - personal software
  - forking open source for personal use
seoTitle: 'Personal Software: Open Source as a Parts Bin'
---

Recently it was _really_ starting to bug me how every meeting app records itself in different ways, and I was just building up a mess of scattered, inconsistent notes all over the place that wasn't serving me at all.

So I knew what I wanted. One place. Every meeting captured the same way. Every audio channel covered by default, no fiddling. And the recordings queryable by the rest of my stack so my agents could actually do something with them. I looked around. Tried a few things. Nothing hit.

The closest by miles was [Meetily](https://github.com/Zackriya-Solutions/meetily) — a meeting recorder with live transcription and a tidy little UI. The team behind it have done genuinely lovely work. But I didn't want the *visible* bits. I wanted the audio capture engine. I wanted the storage. I wanted the bones, not the body.

So I kept the bones. Threw the body away. Adjusted the last 5% to fit me exactly: background auto-detection that fires whenever I join any meeting, capture from every audio in/out channel by default, and an MCP server so the rest of my stack can query the recordings directly.

> It feels like AirPods are intentionally designed to not be selected every other time you join a meeting 😂 I couldn't risk running a whole meeting only to find out either me or them hadn't been recorded.

## What you can do when nobody else is using it

Production-grade stability is the tax you pay to ship to strangers. Edge cases you'll never hit. Onboarding flows for users you don't have. Backwards compatibility with versions you've already moved past. The defensive code, the empty states, the "are you sure?" dialogs.

If you're only shipping to yourself, you don't owe any of it.

The agent-made changes I cobbled in have introduced a bug or two. I know what they are. I know how to step around them. The cost of a known bug, when you're the only user, is "remember the workaround" — not "incident, hotfix, postmortem, apology email."

> Best case: you fix it next time you're in the codebase. Worst case: you mutter at your laptop for ten seconds and carry on.

This morning's job was backups. Up til now the only copy of all my meeting was on my laptop. So I wired in restic + Cloudflare R2, with the secrets sitting safely in 1Password. Took an hour. Saw the gap, filled the gap, no committee. All with the same tools shared by the rest of my projects.

## The Spain visa moment

Here's the bit that made the whole exercise feel justified.

I've been having conversations with visa firms about moving to Spain. These are dense, jargon-heavy meetings full of options I don't know how to evaluate yet. Beckham Law. Non-Lucrative. Digital Nomad. Tax residency thresholds. The kind of detail you absolutely cannot reconstruct from memory afterwards.

Now I have full transcripts. Searchable, summarisable, queryable by my other agents. I can ask my system "what did the second firm say about the 183-day rule" and get an actual answer, not a vague recollection. Thanks entirely to the work the Meetily team did — I just got to pick up their gift and bend it to fit my very exact, personal problems.

## The Savile Row engineer

This — the very exact, personal problem solved with a fork and a few hours — is what I think comes next for a lot of us in the profession. Not "fewer engineers because the AI does it" — that's the boring framing. The interesting one is that the build phase shortens so dramatically that the *constraint* moves. The thing that's scarce stops being typing speed and starts being attention — specifically, the attention to sit with one person long enough to know what they actually need. ([Maggie Appleton makes the team-mode version of this point](https://maggieappleton.com/zero-alignment) — when building gets cheap, the work that remains is deciding what to build.)

That's a Savile Row tailor. That's a luthier who builds a guitar for one player's hands. That's a concierge GP who knows your bloodwork by heart. One craftsperson, a handful of people, a finished thing that fits absolutely no one else.

I wrote a few weeks ago about ripping up [the first version of Inc](/blog/inc-first-rewrite) and starting again with terrifying specificity. That post named the era. This week is what the era looks like on a Tuesday afternoon — me, a fork of someone else's hard work, an MCP server, a backup script, and a folder full of conversations about Spain.

> No generifying. Just enough to work for me. It's a really fun way to move.
