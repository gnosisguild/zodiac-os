# Plan: Convert App to Catalyst UI

## Current State Analysis
Your app is a Next.js 14 DeFi chat interface with:
- Custom Tailwind CSS styling (basic setup)
- React components: Chat interface with message bubbles, text input, and MessariChart
- Clean, gradient-based design with blue/indigo color scheme
- Responsive layout using Tailwind classes

## Conversion Plan

### Phase 1: Setup Catalyst UI Foundation
1. **Install Required Dependencies**
   - Add Catalyst dependencies: `@headlessui/react`, `framer-motion`, `clsx`
   - Add Heroicons for consistent iconography: `@heroicons/react`
   - Add Inter font for typography consistency

2. **Download & Setup Catalyst Components**
   - Download Catalyst UI Kit from Tailwind Plus
   - Create `components/catalyst/` directory structure
   - Copy base Catalyst components (Button, Input, Text, etc.)
   - Setup the Link component for Next.js routing

### Phase 2: Update Layout & Typography
3. **Convert Root Layout**
   - Replace custom styling with Catalyst layout patterns
   - Add Inter font integration
   - Setup proper dark mode support structure

4. **Update Chat Component Structure**
   - Replace custom header with Catalyst Navbar/Header components
   - Convert message containers to use Catalyst Card/Container patterns
   - Update typography using Catalyst Text components

### Phase 3: Replace UI Components
5. **Convert Input Components**
   - Replace textarea with Catalyst Textarea component
   - Convert send button to Catalyst Button component
   - Add proper form validation and accessibility

6. **Update Message Display**
   - Convert message bubbles to use Catalyst design patterns
   - Update loading states with Catalyst Spinner/Loading components
   - Improve accessibility with proper ARIA attributes

7. **Enhance Chart Component**
   - Wrap MessariChart with Catalyst Card component
   - Update chart styling to match Catalyst design system
   - Add proper error states and loading indicators

### Phase 4: Polish & Optimization
8. **Apply Consistent Styling**
   - Update all colors to use Catalyst's color palette
   - Ensure consistent spacing using Catalyst's spacing system
   - Apply proper shadows and borders using Catalyst patterns

9. **Add Enhanced UX Features**
   - Implement proper error handling with Catalyst Alert components
   - Add keyboard navigation improvements
   - Ensure mobile responsiveness with Catalyst's responsive utilities

10. **Testing & Cleanup**
    - Remove unused custom CSS classes
    - Test all interactive elements
    - Verify accessibility improvements
    - Ensure TypeScript compatibility

## Expected Benefits
- **Consistency**: Professional, cohesive design system
- **Accessibility**: Built-in ARIA support and keyboard navigation
- **Maintainability**: Standard component patterns and APIs
- **Developer Experience**: Better TypeScript support and documentation
- **Performance**: Optimized components with proper state management

## Dependencies Required
```json
{
  "@headlessui/react": "^2.x",
  "framer-motion": "^11.x", 
  "clsx": "^2.x",
  "@heroicons/react": "^2.x"
}
```

This plan maintains your app's functionality while upgrading to a professional design system that will make your DeFi chat interface more polished and user-friendly.