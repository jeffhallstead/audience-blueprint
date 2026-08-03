# Audience Blueprint

Build the Owned Audience Blueprint MVP

You are an experienced senior product engineer and UX designer.

Build the first production-ready version of a web application called Owned Audience Blueprint™.

The application should feel like a premium executive strategy platform—not a quiz or marketing assessment.

The goal is to help executives evaluate their organization's readiness to build an owned audience through branded entertainment and receive a personalized strategic roadmap.

Technology

Use Lovable best practices.

Requirements:

Responsive web application

Authentication (email/password + Google login if available)

Supabase backend

PostgreSQL database

Row Level Security

TypeScript

Modern React architecture

Tailwind CSS

Component-driven design

Clean folder structure

Future-ready for AI integrations

Overall UX

The product should resemble a premium SaaS dashboard.

Inspiration:

Linear

Notion

Stripe Dashboard

Vercel

Arc Browser

Use generous whitespace.

Minimalist design.

Executive aesthetic.

Avoid playful illustrations.

Use cards, progress indicators, and dashboards.

User Flow

Landing Page

↓

Account Creation

↓

Welcome Screen

↓

Blueprint Wizard

↓

Processing Screen

↓

Executive Dashboard

↓

Export PDF

↓

Purchase Upsell (future)

Navigation

Sidebar

Dashboard

My Blueprint

Roadmap

AI Toolkit (placeholder)

Resources

Settings

Wizard Structure

Create a multi-step wizard with progress tracking.

Sections:

1. Company Profile

Collect:

Company name

Website

Industry

Revenue range

Team size

Number of marketers

2. Audience

Collect:

Email subscribers

CRM size

Community

Website traffic

Social channels

3. Content

Evaluate:

Newsletter

Blog

Podcast

Video

Events

Research

Case studies

Executive thought leadership

4. Distribution

Assess:

Email

SEO

Social

Partnerships

Paid

PR

Influencers

5. Operations

Evaluate:

Team

Workflow

AI adoption

Measurement

KPIs

6. Goals

Choose objectives:

Thought leadership

Lead generation

Community

Retention

First-party audience

Brand awareness

7. Constraints

Collect:

Budget

Team

Executive buy-in

Time

Technology

Dashboard

Generate an executive dashboard containing placeholder data.

Include these cards:

Publisher Level

Overall Score

Top Opportunity

Top Risk

Recommended Priority

Next 90 Days

Create placeholders only.

No AI generation yet.

Additional Pages

Roadmap

Display:

Month 1

Month 2

Month 3

Each with editable cards.

Resources

Placeholder cards.

Settings

Basic profile page.

Database

Design a normalized schema.

Tables:

users

organizations

assessments

assessment_answers

blueprints

roadmaps

recommendations

Implement proper relationships.

UI Components

Create reusable components.

Examples:

Progress Bar

Question Card

Score Card

Dashboard Card

Metric Tile

Timeline

Roadmap Card

Recommendation Card

Navigation

Buttons

Modal

Toast

Design System

Typography hierarchy

Consistent spacing

Rounded cards

Subtle shadows

Accessible colors

WCAG AA

Responsive layouts

Dark mode ready

Code Quality

Create reusable components.

Avoid duplicated logic.

Document architecture.

Comment only where necessary.

Organize files cleanly.

Future Features

Leave architecture ready for:

OpenAI integration

Claude integration

PDF generation

Stripe payments

Email automation

CRM integrations

Benchmarking

Team collaboration

Deliverable

Produce a complete working MVP scaffold with navigation, database schema, reusable components, routing, placeholder content, and polished UI.

Do not build AI recommendation logic yet.

Focus on creating a production-quality foundation that can be extended in future iterations.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6d4e5e38-ebb7-4aa9-b55b-9a7cad324fe2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
