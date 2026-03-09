---
title: Inc's First Rewrite
date: '2026-03-09T10:30:00+01:00'
description: >-
  I threw away my first version of Inc over the weekend. The ideas were right —
  I just attacked the problem in the wrong order.
slug: inc-first-rewrite
keywords:
  - personal software AI agents
  - rewriting side project
---

I binned everything I've built so far on Inc this weekend.

Not the ideas — those feel more right every day. I'm talking the architecture, the code, the actual implementation. According to [CodexBar](https://github.com/steipete/CodexBar), I've burned through 3.7 billion tokens in the last 30 days — roughly $2,193 in API credits at sticker price. All went in the bin.

> Thank god for Anthropic's loss-leading $200/month Max plan, honestly.

And it feels correct. Like finding out you've been holding the map upside down. You were navigating the right territory, just facing the wrong direction.

## How I got here

When I [first wrote about Inc](/blog/building-inc), the pitch was simple: one system to discover, validate, build, and run businesses with agents instead of employees. That's still the vision. But somewhere between "here's the plan" and "here's the thing," I lost the thread.

I started by trying to get Inc to build *itself*. The tool would eventually build itself — so I started there, at the recursive bit, the impressive bit. I wanted the system that could grow outwards, that could bootstrap its own capabilities. It was ambitious and it was, in hindsight, completely backwards.

What actually happened is I kept expanding, shrinking, and changing Inc's purpose as I went. Every few days I'd have a new insight about what it should be, and I'd bend the codebase to accommodate it. I was satisfying too many concerns with one thing. The shape got wrong, and I didn't notice because I was too busy adding to it.

## The shape was wrong

Here's what I mean by "wrong shape." Inc was becoming a general-purpose agent orchestration platform. That sounds impressive on paper. In practice, it meant I was building infrastructure for hypothetical users instead of software that actually helped *me* do the things *I* needed to do.

I'd forgotten what Inc's real purpose is. It's personal software.

Not personal like "small." Personal like "built for exactly one person's brain." Software that helps me be supercharged in what I do, working in ways I know, to get the results I want. No generifying. No "but what if someone else needs this." No abstraction layers for flexibility I'll never use.

> This is the era of personal software. Build for yourself with terrifying specificity.

## What I actually learned

The rewrite isn't a failure — it's the first honest thing that's happened in this project. I now know what Inc's shape should be because I've lived with the wrong shape long enough to feel it.

What I learned from the voice memos, the late-night architecture sessions, and the dozens of workflows I tried to run: Inc is about taking work I know how to do and encapsulating it in ways I like doing it, so it gets done in a way I can trust. That's it. That's the whole thing.

Not "build me a prototype from a vague idea." Not "orchestrate twelve agents across five services." Just: here's a thing I do regularly, here's how I like it done, make it happen and let me review it at checkpoints I care about.

The checkpoints bit is key. I kept trying to validate whole flows end-to-end — idea in, finished product out. That's expensive to iterate on, and when it goes wrong you can't tell *where* it went wrong. Breaking things into reviewable steps, where each step is something I can hand to an agent and come back to check — that's the actual pattern.

## What happens now

I started the rewrite over the weekend. The concepts carry over. The employee model, the workflow engine, the idea of encapsulated agents that own specific types of work — all of that stays. What changes is the order of attack and the level of specificity.

I'm building for me first. Not "me as a proxy for a target user." Actually me. My workflows, my preferences, my tolerance for how much I want to review versus how much I trust the system to handle.

If that turns into something other people want — great, I'll deal with that when it happens. But I'm not going to ruin another version of Inc by trying to make it general before it's useful.
