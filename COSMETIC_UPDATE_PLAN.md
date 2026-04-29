# Cosmetic Update Plan: Align with Components-Medical Design

## Overview
Update visual/cosmetic aspects to match components-medical design while preserving all current functionality.

## Phase 1: Chat Input Area (High Impact)

### Current Design Issues:
- Complex footer with multiple buttons outside input
- Different border and padding styles
- Not using the clean "pill" design

### Changes Needed:
1. **Rounded pill input design**
   - Single rounded container with input and send button inside
   - Remove separate button containers
   - Match exact border radius and padding from components-medical

2. **Simplify button layout**
   - Move send button inside the input (absolute positioned)
   - Keep voice/image buttons but style them smaller/subtler
   - Match the hover states and transitions

### Code Changes:
```tsx
// From complex multi-button layout to:
<div className="relative flex items-end">
  <textarea className="w-full py-3.5 pl-5 pr-14 rounded-full" />
  <button className="absolute right-2 bottom-1.5 w-10 h-10 rounded-full">
    <SendIcon />
  </button>
</div>
```

## Phase 2: Message Bubbles (High Impact)

### Current Design Issues:
- Complex avatar system for AI messages
- Different padding and spacing
- More complex timestamp placement

### Changes Needed:
1. **Simplify AI message design**
   - Remove avatar for AI messages (components-medical doesn't have it)
   - Use simpler bubble styling
   - Match exact padding values

2. **Clean up message bubble classes**
   - User: `bg-[var(--bg-user-message)]` with simpler styling
   - AI: Plain white background with border
   - Consistent shadow and border radius

3. **Action buttons placement**
   - Move to consistent position below message
   - Use exact same styling as components-medical

## Phase 3: Sidebar Refinements (Medium Impact)

### Changes Needed:
1. **Button sizes**
   - Floating action button: exactly `w-14 h-14`
   - Collapse buttons: match exact padding
   
2. **Spacing adjustments**
   - Tighter spacing between items
   - Match exact padding values

3. **Search input**
   - Ensure exact same styling
   - Match focus states

## Phase 4: Overall Layout (Low Impact)

### Changes Needed:
1. **Background colors**
   - Chat area: Keep `bg-[#FAF6F2]` or verify against components-medical
   - Ensure all backgrounds match

2. **Spacing consistency**
   - Message spacing: `mb-4` → adjust if needed
   - Container padding: verify against components-medical

## Implementation Order

### Step 1: Extract ChatInput Component
Create new file: `src/components/chat/ChatInput.tsx`
- Copy design from components-medical
- Adapt to work with current props
- Keep voice/image features but style to match

### Step 2: Simplify MessageBubble
Update: `src/components/chat/MessageBubble.tsx`
- Remove complex avatar logic
- Simplify bubble styles
- Match padding and margins exactly

### Step 3: Update ChatView
Update: `src/components/chat/ChatView.tsx`
- Use new ChatInput component
- Adjust overall spacing
- Clean up unnecessary wrapper divs

### Step 4: Fine-tune Sidebar
Update: `src/components/chat/Sidebar.tsx`
- Adjust button sizes
- Match exact spacing
- Ensure visual consistency

## CSS Variables to Verify

Ensure these match components-medical:
```css
--accent-orange: #D97941;
--bg-user-message: /* verify exact color */
--border: /* verify exact color */
--border-light: /* verify exact color */
--text-primary: /* verify exact color */
--text-secondary: /* verify exact color */
--text-meta: /* verify exact color */
```

## Key Visual Principles from Components-Medical

1. **Simplicity**: Fewer visual elements, cleaner design
2. **Consistency**: Same spacing patterns throughout
3. **Focus**: Draw attention to content, not chrome
4. **Breathing room**: Appropriate whitespace
5. **Subtle interactions**: Gentle hover states and transitions

## Testing Checklist

After each change:
- [ ] Visual matches components-medical
- [ ] All functionality still works
- [ ] Responsive design maintained
- [ ] Accessibility preserved
- [ ] No TypeScript errors

## Expected Result

The app should look visually identical to components-medical while retaining all current features like:
- Voice input
- Image upload
- Participant management
- Favorites
- Delete functionality
- Account prompts
- All other enhanced features
