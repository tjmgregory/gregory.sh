<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title><xsl:value-of select="rss/channel/title"/> — RSS Feed</title>
        <style>
          :root {
            --matrix-green: #00ff41;
            --matrix-green-dim: #008f11;
            --matrix-green-glow: #00ff4180;
            --matrix-black: #0d0d0d;
            --matrix-dark: #1a1a1a;
            --matrix-gray: #333;
            --font-mono: 'Courier New', Courier, monospace;
          }

          * { box-sizing: border-box; }

          html { font-size: 18px; }

          body {
            margin: 0;
            padding: 0;
            background: var(--matrix-black);
            color: var(--matrix-green);
            font-family: var(--font-mono);
            line-height: 1.6;
            min-height: 100vh;
          }

          ::selection {
            background: var(--matrix-green);
            color: var(--matrix-black);
          }

          a {
            color: var(--matrix-green);
            text-decoration: none;
            border-bottom: 1px solid var(--matrix-green-dim);
            transition: text-shadow 0.2s ease;
          }

          a:hover {
            text-shadow: 0 0 10px var(--matrix-green-glow);
          }

          .container {
            max-width: 700px;
            margin: 0 auto;
            padding: 1rem;
          }

          @media (min-width: 600px) {
            .container { padding: 2rem 1rem; }
          }

          .header {
            padding: 1rem 0 2rem;
            border-bottom: 1px solid var(--matrix-green-dim);
            margin-bottom: 2rem;
          }

          h1 {
            font-size: 2rem;
            font-weight: normal;
            margin: 0 0 1rem;
            text-shadow: 0 0 20px var(--matrix-green-glow);
          }

          h1::before {
            content: '> ';
            color: var(--matrix-green-dim);
          }

          .about-feed {
            background: var(--matrix-dark);
            border: 1px solid var(--matrix-green-dim);
            padding: 1rem;
            margin-bottom: 2rem;
          }

          .about-feed p {
            margin: 0 0 1rem;
          }

          .about-feed p:last-child {
            margin-bottom: 0;
          }

          .feed-url {
            display: flex;
            gap: 0.5rem;
            align-items: center;
            flex-wrap: wrap;
          }

          .feed-url code {
            background: var(--matrix-black);
            padding: 0.4em 0.6em;
            border: 1px solid var(--matrix-gray);
            font-size: 0.85em;
            word-break: break-all;
          }

          .copy-btn {
            background: transparent;
            border: 1px solid var(--matrix-green);
            color: var(--matrix-green);
            font-family: var(--font-mono);
            padding: 0.4em 0.8em;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .copy-btn:hover {
            background: var(--matrix-green);
            color: var(--matrix-black);
            text-shadow: none;
          }

          h2 {
            font-size: 1.5rem;
            font-weight: normal;
            margin: 2rem 0 1rem;
          }

          h2::before {
            content: '## ';
            color: var(--matrix-green-dim);
          }

          .post-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .post-item {
            margin: 1.5rem 0;
            padding: 1rem 0;
            border-bottom: 1px dashed var(--matrix-gray);
          }

          .post-item:last-child {
            border-bottom: none;
          }

          .post-date {
            color: var(--matrix-green-dim);
            font-size: 0.85rem;
          }

          .post-title {
            margin: 0.25rem 0;
            font-size: 1.1rem;
          }

          .post-title a {
            border-bottom: none;
          }

          .post-description {
            color: var(--matrix-green-dim);
            font-size: 0.9rem;
            margin: 0.5rem 0 0;
          }

          .back-link {
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 1px solid var(--matrix-green-dim);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header class="header">
            <h1>RSS Feed</h1>
            <p><xsl:value-of select="rss/channel/description"/></p>
          </header>

          <div class="about-feed">
            <p><strong style="color: #fff; text-shadow: 0 0 5px var(--matrix-green-glow);">This is an RSS feed.</strong> Copy the URL into your feed reader to subscribe.</p>
            <div class="feed-url">
              <code id="feed-url"><xsl:value-of select="rss/channel/atom:link/@href"/></code>
              <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('feed-url').textContent).then(() => this.textContent = 'Copied!').catch(() => this.textContent = 'Failed')">Copy URL</button>
            </div>
          </div>

          <h2>Recent Posts</h2>
          <ul class="post-list">
            <xsl:for-each select="rss/channel/item">
              <li class="post-item">
                <div class="post-date"><xsl:value-of select="pubDate"/></div>
                <h3 class="post-title">
                  <a href="{link}"><xsl:value-of select="title"/></a>
                </h3>
                <p class="post-description"><xsl:value-of select="description"/></p>
              </li>
            </xsl:for-each>
          </ul>

          <div class="back-link">
            <a href="/">← Back to gregory.sh</a>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
