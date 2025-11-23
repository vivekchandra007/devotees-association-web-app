# Hare Krishna - Devotees Association Portal

The devotees of Lord Viṣṇu are godly, and the Association of Devotees is one of the most important activities in Bhakti. This portal is a digital initiative designed to facilitate this association and manage the community effectively.

## Project Overview

This application serves as a comprehensive dashboard for managing the Devotees Association. It streamlines the tracking of devotees, their spiritual progress, donations, and various community campaigns.

### Key Features

-   **Devotee Management**:
    -   Centralized database of devotees with detailed profiles.
    -   Role-based access control (Member, Volunteer, Leader, Admin).
    -   Bulk upload capability via Excel for administrative efficiency.
    -   Search and filter functionality to easily find devotees.
-   **Donation Tracking**:
    -   Record and manage donations linked to specific campaigns.
    -   Generate receipts and track financial contributions.
-   **Campaign Management**:
    -   Organize and track specific events or causes (e.g., Janmashtami, New Temple construction).
-   **Insights & Analytics**:
    -   Dashboard widgets providing real-time counts of active devotees, volunteers, and leaders.
-   **Communication**:
    -   Integration for Telegram feed messages (planned/implemented).

## Technology Stack

This project is built using a modern, robust tech stack ensuring performance, scalability, and type safety.

-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Database**: PostgreSQL
-   **ORM**: [Prisma](https://www.prisma.io/) (with Accelerate for caching)
-   **UI Library**: [PrimeReact](https://primereact.org/) & [Tailwind CSS](https://tailwindcss.com/)
-   **Authentication**: Custom JWT-based authentication
-   **Utilities**:
    -   `axios` for API requests
    -   `zod` for schema validation
    -   `xlsx` for Excel processing
    -   `jspdf` for PDF generation

## Architecture

The application follows a structured architecture using the Next.js App Router:

-   **`src/app`**: Contains the application routes and API endpoints.
    -   **`/api`**: Backend logic handling data operations and authentication.
    -   **Pages**: Frontend views for Dashboard, Login, User Profile, etc.
-   **`src/components`**: Reusable UI components ensuring a consistent design system.
-   **`src/lib`**: Core utilities including database clients and authentication helpers.
-   **`src/schema`**: Zod definitions for robust data validation across the app.

---

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```