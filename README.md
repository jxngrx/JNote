# Sticky Notes Infinite Canvas

A production-ready infinite canvas sticky notes application built with Next.js, React, TypeScript, and Tailwind CSS. Features drag-and-drop notes, infinite canvas with pan/zoom, color picker, autosave to localStorage, and import/export functionality.

## Features

- 🎨 **Infinite Canvas** - Pan and zoom across unlimited workspace
- 📝 **Draggable & Resizable Notes** - Move and resize notes freely with smooth interactions
- 🎭 **Custom Colors** - 8 pastel colors + custom hex input
- 💾 **Auto-save** - All changes persist to localStorage automatically
- 📤 **Export/Import** - Save and restore workspaces as JSON
- ⌨️ **Keyboard Shortcuts** - Full keyboard navigation and shortcuts
- ♿ **Accessible** - WCAG compliant with ARIA labels and keyboard support
- 📱 **Responsive** - Touch-friendly on mobile devices

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling
- **Zustand** - Lightweight state management
- **Lucide Icons** - Beautiful icon library
- **Jest & React Testing Library** - Comprehensive testing

## Getting Started

### Installation

\`\`\`bash
# Clone or download the repository
cd sticky-notes-canvas

# Install dependencies (Next.js auto-installs from imports)
npm install

# Run development server
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build & Deploy

\`\`\`bash
# Build for production
npm run build

# Start production server
npm start

# Deploy to Vercel
npm install -g vercel
vercel
\`\`\`

## Usage

### Creating Notes
- Click the **+** button in the toolbar or press **N**
- Notes appear at the center of your viewport
- Double-click a note to edit its content

### Navigation
- **Mouse wheel + Ctrl** - Zoom in/out
- **Shift + Left click drag** - Pan the canvas
- **Middle mouse drag** - Pan (alternative)

### Editing Notes
- Click inside a note to edit text
- Drag from edges to resize
- Drag the note header to move
- Use the toolbar icons for actions

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| N | Create new note |
| Ctrl+S | Export notes as JSON |
| Ctrl+I | Import notes from JSON |
| Ctrl+D | Duplicate selected note |
| Ctrl+P | Pin/unpin note |
| Ctrl+Delete | Delete selected note |

### Color Palette

Click the 🎨 icon on any note to access the color picker with 8 preset colors:
- Yellow, Green, Blue, Pink
- Orange, Purple, Cyan, Lime

Or enter a custom hex color (e.g., #FF5733).

## Data Format

Notes are stored as JSON with the following structure:

\`\`\`json
{
  "notes": [
    {
      "id": "note_1681234567890",
      "x": 240,
      "y": 120,
      "width": 320,
      "height": 210,
      "zIndex": 10,
      "color": "#FFF59D",
      "content": "Hello world\nThis is a note",
      "createdAt": 1681234567890,
      "updatedAt": 1681234568000,
      "isPinned": false
    }
  ],
  "viewport": {
    "scale": 1,
    "translateX": 0,
    "translateY": 0
  },
  "meta": {
    "lastId": "note_1681234567890",
    "exportedAt": 1681234568000
  }
}
\`\`\`

## Testing

\`\`\`bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
\`\`\`

## Accessibility

The app includes comprehensive accessibility features:
- Semantic HTML with proper ARIA labels
- Keyboard navigation support (Tab, Enter, Delete)
- Screen reader-friendly content
- High contrast dark theme
- Focus indicators on interactive elements
- Accessible color picker with descriptions

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Virtual canvas (20,000 × 20,000 px) handles unlimited workspace
- Optimized re-renders with Zustand store
- CSS transforms for smooth animations
- localStorage for instant persistence
- Debounced autosave (200ms)

## Project Structure

\`\`\`
├── app/
│   ├── page.tsx              # Main page
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles & theme
├── components/
│   ├── canvas.tsx            # Infinite canvas
│   ├── sticky-note.tsx       # Note component
│   └── toolbar.tsx           # Top toolbar
├── lib/
│   ├── store.ts              # Zustand store
│   ├── types.ts              # TypeScript types
│   └── constants.ts          # App constants
├── __tests__/
│   └── store.test.ts         # Unit tests
├── jest.config.json          # Jest configuration
└── jest.setup.js             # Jest setup file
\`\`\`

## Keyboard Navigation

### Canvas Navigation
- **Arrow Keys** - Pan viewport (when no note is focused)
- **Ctrl + Scroll** - Zoom in/out
- **Shift + Arrow** - Pan faster

### Note Editing
- **Tab** - Move to next note
- **Shift + Tab** - Move to previous note
- **Enter** - New line in note
- **Ctrl+D** - Duplicate note
- **Ctrl+P** - Pin/unpin
- **Ctrl+Delete** - Delete note

## Environment Variables

No environment variables required for basic functionality. The app uses localStorage for persistence.

## Troubleshooting

### Notes not saving?
- Check browser localStorage is enabled
- Open DevTools → Application → Local Storage

### Import not working?
- Ensure the JSON file is valid (exported from this app or valid structure)
- Check browser console for error messages

### Performance issues with many notes?
- The app supports 200+ notes efficiently
- For 1000+ notes, consider browser virtualization

## Future Enhancements

- [ ] Cloud sync with authentication
- [ ] Real-time collaboration
- [ ] Drawing/sketching in notes
- [ ] Image embedding
- [ ] Rich text formatting
- [ ] Tags and search
- [ ] Dark mode theme

## Contributing

This is a demo project. Feel free to fork and customize for your needs!

## License

MIT - Use freely for personal or commercial projects.

## Support

For issues or feature requests, please check the GitHub issues page or create a new one.

---

**Built with ❤️ using Next.js, React, and TypeScript**
