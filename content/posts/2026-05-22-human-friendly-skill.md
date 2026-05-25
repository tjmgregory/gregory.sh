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

Be honest. Who reads every word your agent burns a hole in the ozone to write? Yeh, neither.

Having had a great morning crushing out changes and ideas with AI, in the afternoon I'm noticeably worse. But it's not the usual fatigue I'm used to from programming relentlessly for hours, it's a different kind. I've had to read and comprehend so many more higher level ideas that morning than I ever would have done before, architecting, critiquing and delivering up to 5-10 features all at the same time. No shock that by the afternoon you perhaps aren't being quite so thorough in your human obligations to this work.

There's a moment on the *How I AI* podcast where [Thariq Shihipar](https://www.chatprd.ai/how-i-ai/claude-code-anthropic-thariq-shihipar-on-replacing-markdown-with-html) (Anthropic) admits to it himself.

I like the intention of his fix: Don't try to fix the human; fix what they see. The trick is to get Claude to write _pretty_ plans using old-school HTML instead of raw markdown, to give you the power to draw and demo real, runnable examples whenever you need.

I tried it. The reading bit works. But once I started using it for actual plans, two pains showed up that the trick didn't quite touch.

## I could read it, but not touch it

You can read the HTML. You can't *type* in it. So the moment I wanted to nudge a bullet, swap two sections, or rewrite a heading, I was back to typing instructions into chat. *"Hey Claude, can you change..."* The interface had stopped wearing me down, but the workflow hadn't.

## I already had a nice markdown editor

I edit pretty-looking markdown comfortably day-to-day using Obsidian. I have a vault configured at the top of every one of my parent folders, and these days I spend more time in that than I do in any IDE. Push comes to shove and I need to understand some code, I reach for [Helix](https://helix-editor.com/).

So even if I got editing inside the HTML doc, the "prettier surface" framing only half-landed for solo use. However, I think Thariq missed a much better value-prop for this workflow.

## Sharing plans

When Rich Harris started Svelte, he had a motivation that has made me love Svelte ever since. He wanted a framework simple enough that non-programmers could not only understand but also engage with.

And I think this is where the beauty of HTML plans comes in. You can write one of these, and then fire it off to anyone else in your business, and they'll be able to open it, understand it in all its customised beauty, edit it, and fire it right back - all without needing their own markdown setup.

> A `.md` file in someone else's inbox is a worse experience than a Google Doc link. And Google Docs are fussy with AI, limited to basic text.

## A small agent skill

So I made [`/human-friendly`](#install). Plans still come out as a single HTML file, but the file is *editable*. Click any heading, bullet, or table cell and start typing. `#` at the start of a line makes a heading. `-` makes a list. ⌘S saves it back to disk. ⌘Z undoes. Hover a table and little + buttons appear for adding a row or column. They vanish on save, so the file stays clean. It feels like a doc because it behaves like one.

This is the same move as [the last post](/blog/scrappy-personal-software). Someone good publishes a recipe, I try it, find the corners that don't fit my hand, and file them down. Thariq nailed the diagnosis and most of the prescription. The bits missing — at least for me — were the smallest, most obvious ones: let me edit the doc you spent all that effort making readable, and let me hand it to someone else who can do the same.

## Install

It's an [agent skill](https://agentskills.io). Pick where you want it:

- [Claude](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) (claude.ai web/desktop)
- [Claude Code](https://code.claude.com/docs/en/skills) (CLI)
- [Cursor](https://cursor.com/docs/context/skills) (editor)
- [Codex](https://developers.openai.com/codex/skills/) (OpenAI's coding agent)
- [Gemini CLI](https://geminicli.com/docs/cli/skills/)
- [OpenCode](https://opencode.ai/docs/skills/)
- Universal install (any agent): `npx skills add tjmgregory/.dotfiles --skill human-friendly`

In Claude Code you can also use the plugin marketplace:

```
/plugin marketplace add tjmgregory/.dotfiles
/plugin install human-friendly@tjmgregory
```

Next plan lands on your Desktop, ready to edit.
