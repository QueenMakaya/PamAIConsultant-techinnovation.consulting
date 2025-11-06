# Pamela Alfred - Portfolio Website

A modern, bilingual (English/French) portfolio website for Pamela Alfred, AI & Digital Transformation Consultant.

## Features

- **Bilingual Support**: Seamless switching between English and French
- **Responsive Design**: Optimized for all devices
- **Modern UI**: Built with Next.js 16, React 19, and Tailwind CSS v4
- **Smooth Animations**: Engaging user experience with subtle animations
- **PDF Download**: Download resume in the selected language
- **Contact Form**: Functional contact form with toast notifications
- **SEO Optimized**: Proper meta tags and semantic HTML

## Sections

1. **Hero**: Eye-catching introduction with CTA buttons
2. **About**: Professional summary
3. **Resume**: Experience, education, and certifications
4. **Projects**: Featured projects with images and descriptions
5. **Skills**: Technical skills, business skills, and languages
6. **Testimonials**: Client feedback and recommendations
7. **Contact**: Contact form and direct contact information
8. **Footer**: Social links and copyright

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui
- **Fonts**: Inter (body), Space Grotesk (headings)
- **Icons**: Lucide React
- **Analytics**: Vercel Analytics

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Customization

### Update Content

- **Translations**: Edit `lib/i18n.ts` to modify text content
- **Experience**: Update the `experiences` array in `components/resume.tsx`
- **Projects**: Modify the `projects` array in `components/projects.tsx`
- **Skills**: Edit the `skillCategories` array in `components/skills.tsx`
- **Testimonials**: Update the `testimonials` array in `components/testimonials.tsx`

### Update Styling

- **Colors**: Modify design tokens in `app/globals.css`
- **Fonts**: Change font imports in `app/layout.tsx`
- **Spacing**: Adjust section padding in `app/globals.css`

### Add Real PDF Generation

Replace the placeholder in `lib/pdf-generator.ts` with a real PDF generation library like:
- jsPDF
- html2pdf.js
- react-pdf

## Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## License

© 2025 Pamela Alfred. All rights reserved.
