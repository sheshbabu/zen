---
name: manual-test
description: Generate a manual regression test checklist for the current changes, written from the user's point of view so they can click through the app themselves. Use when the user asks for manual test cases, a test plan, or invokes /manual-test.
---

# Manual test

Write a checklist the user can follow by hand to confirm the app still works after the current changes.
Don't run Playwright, a browser, or computer use, the user runs the tests.
Don't edit code while doing this.

## 1. Work out what changed

- Read `git diff --cached --stat`, falling back to `git diff --stat` and untracked files from `git status --short`.
- Read the hunks that matter. For each change, work out which screens and actions a user would reach it through.
- Look for changes with wide reach even when the diff is small: auth and middleware, routing and URLs, shared queries or filters, migrations, the API client, the service worker, and shared CSS.
- If `$ARGUMENTS` narrows the scope (for example "just the editor", or "include the API"), follow it.

## 2. Decide what to test

- Test from the user's point of view: screens, clicks, what they should see. Skip the API unless asked, and when API checks are asked for, give copy-pasteable `curl` commands.
- Cover the features the change touches directly, plus the features that share the code it touched.
- Add an upgrade section when there's a migration or a URL or storage change: run the new build on an existing database, and use a tab or installed app still holding the old cached bundle.
- Leave out features the change can't affect. Say so in one line rather than listing them.

## 3. Write the checklist

- Start with setup, such as backing up the database and which data to use.
- Group by feature area with short numbered headings, and order groups from riskiest to least risky.
- Each item is a `- [ ]` checkbox: the action, then the expected result. One line each.
- Mark the checks most likely to catch a regression, and say in a sentence why they're risky.
- Include edge cases the change makes likely: empty states, untagged or unusual data, pagination past the first page, mobile width for CSS changes, and logged out or expired session for auth changes.
- End with one or two sentences on where a failure would most likely come from, so the user knows where to look first.

Keep it tight: a checklist, not a report. Don't use em dashes.
