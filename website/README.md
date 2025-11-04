# Off The Hook Book Club Website

This is the support and marketing website for the Off The Hook Book Club mobile app.

## Features

- Single-page responsive design
- Contact form with Netlify Forms integration
- Privacy Policy and Terms of Service
- App screenshots showcase
- FAQ section
- Modern, clean UI

## Deployment to Netlify

### Option 1: Deploy via Git (Recommended)

1. Push this website folder to a Git repository (GitHub, GitLab, or Bitbucket)
2. Log in to [Netlify](https://www.netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your Git provider and select the repository
5. Configure build settings:
   - Base directory: `website`
   - Build command: (leave empty)
   - Publish directory: `.` (or leave as default)
6. Click "Deploy site"

### Option 2: Manual Deploy

1. Log in to [Netlify](https://www.netlify.com)
2. Drag and drop the entire `website` folder into the Netlify dashboard
3. Your site will be deployed instantly

### Option 3: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Navigate to the website folder
cd website

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

## Contact Form Setup

The contact form is already configured to work with Netlify Forms. Once deployed:

1. Go to your site's dashboard on Netlify
2. Navigate to "Forms" in the sidebar
3. You'll see submissions from the contact form
4. Set up email notifications in Form settings if desired

## Custom Domain

To add a custom domain:

1. Go to your site's dashboard on Netlify
2. Click "Domain settings"
3. Click "Add custom domain"
4. Follow the instructions to configure your DNS

## Environment Variables

This static site doesn't require any environment variables. All functionality works out of the box.

## File Structure

```
website/
├── index.html          # Main HTML file with all content
├── styles.css          # All styles
├── script.js           # JavaScript for interactions
├── netlify.toml        # Netlify configuration
├── README.md           # This file
└── screenshots/        # App screenshots
    └── *.png
```

## Customization

### Update Content

Edit `index.html` to update:
- App description
- Features
- FAQ items
- Privacy Policy
- Terms of Service

### Update Styles

Edit `styles.css` to customize:
- Colors (see CSS variables at the top)
- Fonts
- Layout
- Responsive breakpoints

### Update Functionality

Edit `script.js` to modify:
- Scroll behavior
- Form handling
- Animations

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

The site is optimized for performance:
- Minimal dependencies (no frameworks)
- Optimized images
- CSS and JS minification via Netlify
- Proper caching headers
- Lazy loading for images

## Accessibility

The site follows basic accessibility guidelines:
- Semantic HTML
- Proper heading hierarchy
- Alt text for images
- Keyboard navigation support
- Sufficient color contrast

## License

MIT License - feel free to modify and use as needed.

