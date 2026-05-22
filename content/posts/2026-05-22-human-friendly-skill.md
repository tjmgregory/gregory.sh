---
title: Just Let Me Edit the Plan
date: '2026-05-22T12:00:00+01:00'
description: >-
  After a few hours of reading agent plans in markdown, you stop reading them. A
  small agent skill for the rest of the problem.
slug: human-friendly-skill
keywords:
  - agent skill
  - editable agent plans
seoTitle: 'Editable Plans: A Small Agent Skill'
---

Hands up. Who reads every word your agent burns a hole in the ozone to write? Same.

By about hour three of reading agent plans in markdown, my brain starts to give up on me. I'm sharp at hour one. By hour two my eyes are doing that thing where they slide down the page faster than my brain is processing. By hour three I'm skimming. By hour four I'm skipping bullets I'd have argued with this morning. The format hasn't changed — I have. And the things I should be catching are the ones falling through.

There's a moment on the *How I AI* podcast where [Thariq Shihipar](https://www.chatprd.ai/how-i-ai/claude-code-anthropic-thariq-shihipar-on-replacing-markdown-with-html) (Anthropic) basically admits this on himself. His plans got so long he stopped reading them. When something needed changing he'd just ask Claude to fix it rather than scroll up and find it. The plan had become a thing he managed by proxy, because the *interface* had worn him down.

His solve is a good one. Don't try to fix the human. Fix the surface they're staring at. Get Claude to write plans as HTML files instead of markdown. Tables render. Headings have weight. There's hierarchy your eye can grab onto without effort. The doc looks like a doc you might actually pick up — which means you actually pick it up.

I tried it. The reading bit is real. But once I started using it for actual plans, two pains showed up that the trick didn't quite touch.

## I could read it, but not touch it

You can read the HTML. You can't *type* in it. So the moment I wanted to nudge a bullet, swap two sections, or rewrite a heading, I was back to typing instructions into chat. *"Hey Claude, can you change..."* The interface had stopped wearing me down, but the workflow hadn't.

## I already had a nice markdown editor

I edit markdown comfortably day-to-day. So even if I got editing inside the HTML doc, the "prettier surface" framing only half-landed for solo use. Pretty wasn't really what was missing. What was missing was that any plan I wanted to share with someone else hit a wall the moment they didn't have my toolchain.

## A small agent skill

So I made [`/human-friendly`](#install). Plans still come out as a single HTML file, but the file is *editable*. Click any heading, bullet, or table cell and start typing. `#` at the start of a line makes a heading. `-` makes a list. ⌘S saves it back to disk. ⌘Z undoes. Hover a table and little + buttons appear for adding a row or column. They vanish on save, so the file stays clean. It feels like a doc because it behaves like one.

The unexpected lift was the second pain. Because the whole experience is baked into the single HTML file, I can drop it in a Slack DM or attach it to an email, and the person on the other end opens it in their browser and *edits it the same way I do*. No install, no account, no special tool. They redline, save, send it back.

> A `.md` file in someone else's inbox is a worse experience than a Google Doc link. And Google Docs aren't where Claude wants to put your plan.

This is the same move as [the last post](/blog/scrappy-personal-software). Someone good publishes a recipe, I try it, find the corners that don't fit my hand, and file them down. Thariq nailed the diagnosis and most of the prescription. The bits missing — at least for me — were the smallest, most obvious ones: let me edit the doc you spent all that effort making readable, and let me hand it to someone else who can do the same.

## Install

It's an [agent skill](https://agentskills.io). Pick where you want it:

- [Claude](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) (claude.ai web/desktop)
- [Claude Code](https://code.claude.com/docs/en/skills) (CLI)
- [Cursor](https://cursor.com/docs/context/skills) (editor)
- [Codex](https://developers.openai.com/codex/skills/) (OpenAI's coding agent)
- [Gemini CLI](https://geminicli.com/docs/cli/skills/)
- [OpenCode](https://opencode.ai/docs/skills/)
- Anything else — the universal install: `npx skills add tjmgregory/.dotfiles --skill human-friendly`

In Claude Code you can also use the plugin marketplace:

```
/plugin marketplace add tjmgregory/.dotfiles
/plugin install human-friendly@tjmgregory
```

Next plan lands on your Desktop, ready to edit.
