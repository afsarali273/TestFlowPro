# TestFlow Pro Documentation

This folder contains the static HTML documentation for TestFlow Pro, ready to be deployed to GitHub Pages.

## 📁 Structure

```
html_doc/
├── index.html              # Home page
├── architecture.html       # Architecture overview
├── installation.html       # Installation guide
├── usage.html             # Usage guide
├── features.html          # Features documentation
├── assets/
│   ├── css/
│   │   └── style.css      # Main stylesheet
│   ├── js/                # JavaScript files (if needed)
│   └── images/            # All screenshots and diagrams
└── README.md              # This file
```

## 🚀 Deploying to GitHub Pages

### Option 1: Deploy from `html_doc` folder

1. **Push to GitHub:**
   ```bash
   git add html_doc/
   git commit -m "Add static documentation"
   git push origin main
   ```

2. **Configure GitHub Pages:**
   - Go to your repository on GitHub
   - Navigate to Settings → Pages
   - Under "Source", select "Deploy from a branch"
   - Select branch: `main`
   - Select folder: `/html_doc`
   - Click "Save"

3. **Access your documentation:**
   - Your site will be available at: `https://yourusername.github.io/TestFlowPro/`

### Option 2: Deploy to `docs` folder (GitHub Pages default)

1. **Move or copy html_doc contents to docs folder:**
   ```bash
   mkdir -p docs
   cp -r html_doc/* docs/
   ```

2. **Push to GitHub:**
   ```bash
   git add docs/
   git commit -m "Add documentation to docs folder"
   git push origin main
   ```

3. **Configure GitHub Pages:**
   - Go to Settings → Pages
   - Select branch: `main`
   - Select folder: `/docs`
   - Click "Save"

### Option 3: Deploy to `gh-pages` branch

1. **Create gh-pages branch:**
   ```bash
   git checkout --orphan gh-pages
   git rm -rf .
   cp -r html_doc/* .
   git add .
   git commit -m "Initial documentation"
   git push origin gh-pages
   git checkout main
   ```

2. **Configure GitHub Pages:**
   - Go to Settings → Pages
   - Select branch: `gh-pages`
   - Select folder: `/ (root)`
   - Click "Save"

## 🎨 Customization

### Update Colors

Edit `assets/css/style.css` and modify the CSS variables:

```css
:root {
  --primary: #3b82f6;      /* Primary color */
  --secondary: #8b5cf6;    /* Secondary color */
  --success: #10b981;      /* Success color */
  --dark: #0f172a;         /* Background */
  --text: #f1f5f9;         /* Text color */
}
```

### Add More Pages

1. Create a new HTML file in the `html_doc` folder
2. Copy the header and footer from existing pages
3. Add your content
4. Update navigation links in all pages

### Update Images

Replace images in `assets/images/` folder with your own screenshots.

## 🔧 Local Development

To test the documentation locally:

1. **Using Python:**
   ```bash
   cd html_doc
   python -m http.server 8000
   ```
   Access at: http://localhost:8000

2. **Using Node.js:**
   ```bash
   cd html_doc
   npx http-server -p 8000
   ```
   Access at: http://localhost:8000

3. **Using VS Code:**
   - Install "Live Server" extension
   - Right-click on `index.html`
   - Select "Open with Live Server"

## 📝 Content Updates

### Update Documentation Content

1. Edit the HTML files directly
2. Test locally
3. Commit and push changes
4. GitHub Pages will automatically rebuild

### Update Screenshots

1. Replace images in `assets/images/`
2. Keep the same filenames or update references in HTML
3. Commit and push

## 🌐 Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file in the `html_doc` folder:
   ```bash
   echo "docs.yourdomain.com" > html_doc/CNAME
   ```

2. Configure DNS:
   - Add a CNAME record pointing to `yourusername.github.io`

3. Update GitHub Pages settings:
   - Go to Settings → Pages
   - Enter your custom domain
   - Enable "Enforce HTTPS"

## 📊 Analytics (Optional)

To add Google Analytics:

1. Get your Google Analytics tracking ID
2. Add this code before `</head>` in all HTML files:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🔍 SEO Optimization

The documentation includes:
- ✅ Semantic HTML structure
- ✅ Meta descriptions
- ✅ Proper heading hierarchy
- ✅ Alt text for images
- ✅ Mobile-responsive design

To improve SEO further:

1. Add `robots.txt`:
   ```
   User-agent: *
   Allow: /
   Sitemap: https://yourusername.github.io/TestFlowPro/sitemap.xml
   ```

2. Add `sitemap.xml`:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url>
       <loc>https://yourusername.github.io/TestFlowPro/</loc>
       <priority>1.0</priority>
     </url>
     <url>
       <loc>https://yourusername.github.io/TestFlowPro/architecture.html</loc>
       <priority>0.8</priority>
     </url>
     <!-- Add more URLs -->
   </urlset>
   ```

## 🐛 Troubleshooting

### Documentation not showing up

1. Check GitHub Pages settings
2. Ensure the correct branch and folder are selected
3. Wait a few minutes for deployment
4. Check for build errors in Actions tab

### Images not loading

1. Verify image paths are relative: `assets/images/image.png`
2. Check image files exist in the repository
3. Ensure images are committed and pushed

### Styles not applying

1. Check CSS file path in HTML: `<link rel="stylesheet" href="assets/css/style.css">`
2. Clear browser cache
3. Verify CSS file is committed

## 📞 Support

For issues or questions:
- Check GitHub Issues
- Review GitHub Pages documentation
- Contact the development team

---

**Documentation built with ❤️ for TestFlow Pro**
