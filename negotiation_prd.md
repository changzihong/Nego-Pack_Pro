# Negotiation Pack Pro - Product Requirements Document

## 1. Executive Summary

### Product Overview
Negotiation Pack Pro is a web-based application that produces negotiation goals, red lines, concessions plan, BATNA, meeting agenda, and note template for procurement and sales teams.

### Problem Statement
Negotiations run on ad-hoc notes, weak alignment, and forgotten commitments.

### Solution
A structured 5-step workflow: Deal Intake → AI-Generated Pack → Internal Alignment → Meeting Notes → Export PDF.

### Success Criteria
- Complete negotiation prep in under 15 minutes
- 90% stakeholder alignment within 24 hours
- Zero forgotten commitments via action tracking
- Professional PDF output for all negotiations

## 2. Technical Stack

### Frontend
- **Framework**: Vite + React
- **Styling**: Tailwind CSS
- **State Management**: React Context API or Zustand
- **Routing**: React Router
- **PDF Generation**: react-pdf or jsPDF

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for file attachments)
- **Real-time**: Supabase Realtime (for comments)

### AI/ML
- **Provider**: OpenAI
- **Model**: GPT-4o-mini
- **Use Cases**: Generate negotiation pack (targets, red lines, tradeables, BATNA, questions)

## 3. Users

### Primary Users
1. **Procurement Leads** - Lead supplier negotiations, manage costs
2. **Sales Teams** - Lead customer negotiations, close deals
3. **Finance** - Review cost impact, approve financial commitments

### User Roles in System
- **Deal Owner** - Creates and manages negotiations (Procurement/Sales)
- **Stakeholder** - Reviews and approves (Finance, Legal, Management)

## 4. Database Schema

### Tables

#### users
- id (uuid, primary key)
- email (text, unique)
- full_name (text)
- department (text) - e.g., "Procurement", "Sales", "Finance"
- created_at (timestamp)
- updated_at (timestamp)

#### suppliers
- id (uuid, primary key)
- name (text)
- contact_person (text)
- email (text)
- phone (text)
- category (text) - e.g., "Software", "Manufacturing"
- created_at (timestamp)
- updated_at (timestamp)

#### deals
- id (uuid, primary key)
- owner_id (uuid, foreign key → users)
- supplier_id (uuid, foreign key → suppliers)
- title (text)
- scope (text)
- pricing_model (text)
- key_issues (text)
- desired_outcomes (text)
- deal_value (numeric, nullable)
- deadline (date, nullable)
- status (enum: 'draft', 'pack_generated', 'in_review', 'approved', 'meeting_done', 'completed')
- created_at (timestamp)
- updated_at (timestamp)

#### negotiation_packs
- id (uuid, primary key)
- deal_id (uuid, foreign key → deals, unique)
- targets (jsonb) - best-case outcomes
- red_lines (jsonb) - non-negotiables
- tradeables (jsonb) - what we can concede
- batna (text) - Best Alternative To Negotiated Agreement
- questions (jsonb) - key questions to ask
- meeting_agenda (text) - auto-generated agenda
- ai_model_used (text)
- created_at (timestamp)
- updated_at (timestamp)

#### stakeholder_comments
- id (uuid, primary key)
- deal_id (uuid, foreign key → deals)
- user_id (uuid, foreign key → users)
- section (text) - which section they're commenting on
- comment (text)
- status (enum: 'pending', 'approved', 'changes_requested')
- created_at (timestamp)
- updated_at (timestamp)

#### meeting_notes
- id (uuid, primary key)
- deal_id (uuid, foreign key → deals, unique)
- meeting_date (timestamp)
- attendees (text)
- discussion_points (text)
- decisions_made (text)
- concessions_granted (jsonb)
- next_steps (text)
- created_at (timestamp)
- updated_at (timestamp)

#### actions
- id (uuid, primary key)
- deal_id (uuid, foreign key → deals)
- meeting_note_id (uuid, foreign key → meeting_notes, nullable)
- description (text)
- assignee_id (uuid, foreign key → users)
- status (enum: 'pending', 'in_progress', 'completed')
- due_date (date)
- created_at (timestamp)
- updated_at (timestamp)

#### attachments
- id (uuid, primary key)
- deal_id (uuid, foreign key → deals)
- file_name (text)
- file_path (text)
- file_size (integer)
- uploaded_by (uuid, foreign key → users)
- created_at (timestamp)

## 5. The 5-Step Workflow

### Step 1: Deal Intake

**Purpose**: Capture essential deal information

**Page**: Deal Intake Form

**Fields**:
- Supplier (select from existing or add new)
- Deal title*
- Scope of negotiation (textarea)*
- Pricing model*
- Key issues/challenges (textarea)*
- Desired outcomes (textarea)*
- Deal value (optional)
- Deadline (optional)
- File attachments (contracts, RFPs, etc.)

**Features**:
- Auto-save draft every 30 seconds
- Form validation
- Add new supplier inline
- Upload multiple files

**User Action**: Click "Generate Negotiation Pack"

---

### Step 2: AI-Generated Negotiation Pack

**Purpose**: AI generates comprehensive negotiation strategy

**AI Prompt Structure**:
```
You are a professional negotiation strategist. Based on the following deal:

Supplier: {supplier_name}
Scope: {scope}
Pricing Model: {pricing_model}
Key Issues: {key_issues}
Desired Outcomes: {desired_outcomes}

Generate a comprehensive negotiation pack in JSON format:
{
  "targets": ["specific measurable goal 1", "goal 2", ...],
  "red_lines": ["non-negotiable condition 1", "condition 2", ...],
  "tradeables": [
    {"we_give": "item", "we_get": "return value"},
    ...
  ],
  "batna": "our best alternative if negotiation fails",
  "questions": ["key question 1", "question 2", ...],
  "meeting_agenda": "structured agenda text"
}
```

**Page Layout**:
- Display AI-generated pack in organized sections
- Each section is editable
- "Regenerate" button with tone options (collaborative/assertive)
- Save version history

**Features**:
- Loading state during generation (~5-10 seconds)
- Manual editing of all sections
- Regenerate entire pack or specific sections
- Preview meeting agenda

**User Action**: Click "Submit for Review"

---

### Step 3: Internal Alignment (Stakeholder Review)

**Purpose**: Get stakeholder buy-in and approval

**Page**: Stakeholder Alignment

**Layout**:
- Left: Negotiation pack sections
- Right: Comments panel
- Top: Invite stakeholders + approval status

**Features**:
- Invite stakeholders by email
- Assign specific sections (e.g., Finance reviews pricing)
- Add comments to any section
- Three approval options:
  - ✅ Approve
  - 🔄 Request Changes (must add comment)
  - ❌ Reject (must add reason)
- Real-time comment updates
- Email notifications on new comments
- Show approval status (Pending/Approved/Changes Requested)

**Stakeholder View**:
- Receive email with link to review
- See deal intake + negotiation pack side-by-side
- Add comments to specific sections
- Submit approval decision

**User Action**: Once approved, click "Prepare for Meeting"

---

### Step 4: Meeting Notes & Action Tracking

**Purpose**: Document meeting outcomes and track commitments

**Page**: Meeting Notes Capture

**Sections**:

1. **Meeting Info**
   - Date and time
   - Attendees
   - Location/platform

2. **Discussion Points**
   - Key topics discussed (textarea)
   - Supplier's positions
   - Our responses

3. **Decisions Made**
   - What was agreed
   - What was rejected
   - Concessions granted (we gave)
   - Concessions received (we got)

4. **Action Tracker**
   - Add action items
   - Assign to team member
   - Set due date
   - Status: Pending/In Progress/Completed

5. **Next Steps**
   - Follow-up required
   - Next meeting date

**Features**:
- Auto-save every 30 seconds
- Link actions to specific decisions
- Email notifications to assignees
- Compare outcomes vs original targets
- Mark deal status (Ongoing/Completed/Closed)

**User Action**: Click "Finalize & Export"

---

### Step 5: Export Negotiation Pack

**Purpose**: Generate professional PDF summary

**PDF Contents**:

1. **Cover Page**
   - Deal title
   - Supplier name
   - Owner and date
   - Status

2. **Deal Summary**
   - Scope
   - Pricing model
   - Key issues
   - Desired outcomes

3. **Negotiation Strategy**
   - Targets
   - Red lines
   - Tradeables
   - BATNA
   - Key questions

4. **Stakeholder Approvals**
   - Who approved
   - Comments summary
   - Approval dates

5. **Meeting Outcomes**
   - Discussion points
   - Decisions made
   - Concessions summary
   - Comparison: Target vs Actual

6. **Action Items**
   - All actions with assignees and due dates
   - Status tracker

7. **Appendices**
   - Attached documents

**Features**:
- Professional PDF template
- Company branding (logo, colors)
- Email to multiple recipients
- Save to deal record
- Print-friendly format

**User Action**: Email PDF + mark deal as completed

---

## 6. Page Structure

### Dashboard (Deal Owner)
- **View**: List of all deals
- **Actions**: Create new deal, search, filter by status
- **Display**: Deal cards with status, supplier, deadline
- **Quick Stats**: Total deals, Pending approvals, Upcoming deadlines

### Supplier Management (Optional)
- **View**: List of suppliers
- **Actions**: Add supplier, edit, view deal history
- **Display**: Supplier name, category, contact info

### Review Queue (Stakeholder)
- **View**: Deals awaiting their review
- **Actions**: Open deal, approve, request changes
- **Display**: Deal title, owner, sections assigned, urgency

---

## 7. User Flows

### Flow A: Complete Deal (Happy Path)

**Deal Owner:**
1. Login → Dashboard
2. Click "New Deal"
3. Fill intake form (select supplier, add details)
4. Upload files (optional)
5. Click "Generate Pack" → Wait 5-10 seconds
6. Review AI-generated negotiation pack
7. Edit any sections if needed
8. Click "Submit for Review"
9. Invite Finance + other stakeholders
10. Receive approval notifications
11. Click "Prepare Meeting"
12. Review meeting agenda
13. Conduct meeting
14. Fill meeting notes form
15. Add action items with assignees
16. Click "Finalize & Export"
17. Generate PDF
18. Email to team
19. Mark deal as Completed

**Stakeholder (Finance):**
1. Receive email notification
2. Click link → Review page
3. Read deal details + negotiation pack
4. Focus on pricing/cost sections
5. Add comment on red lines
6. Select "Approve" or "Request Changes"
7. Submit review
8. Receive final PDF via email

---

### Flow B: Changes Requested

**Deal Owner:**
1. Submit deal for review
2. Receive notification: "Changes requested by Finance"
3. Open deal → See Finance's comments
4. Edit red lines based on feedback
5. Click "Resubmit for Review"
6. Finance receives notification
7. Finance approves
8. Continue to meeting prep

---

### Flow C: Add New Supplier

**Deal Owner:**
1. On deal intake form
2. Click "Supplier" dropdown
3. Click "+ Add New Supplier"
4. Modal opens: name, contact, email, category
5. Click "Save"
6. New supplier appears in dropdown
7. Continue with deal intake

---

## 8. AI Integration Details

### OpenAI Configuration
- **Model**: gpt-4o-mini
- **Max Tokens**: 2000
- **Temperature**: 0.7
- **Response Format**: JSON

### Prompt Engineering
See Step 2 for full prompt template

### Error Handling
- API timeout (>30s): Show error, allow retry
- Invalid response: Regenerate automatically
- Rate limit: Queue request, notify user
- Cost tracking: Log tokens per deal

### Response Validation
- Ensure all required fields present
- Validate JSON structure
- Check for empty arrays
- Sanitize output before display

---

## 9. UI/UX Requirements for Malaysia Market

### Design Principles
- **Professional & Trustworthy**: Clean, corporate aesthetic suitable for procurement and sales professionals
- **Negotiation Theme**: Colors and design elements that evoke trust, stability, and strategic thinking
- **Cultural Considerations**: Suitable for Malaysian business culture (professional, hierarchical, relationship-focused)
- **Clear visual hierarchy**: Important information stands out
- **Mobile-responsive**: Especially critical for meeting notes on-the-go
- **Accessibility**: WCAG 2.1 AA compliant

### Color Scheme - "Negotiation Pro"

Inspired by professional negotiation and contract management tools, the color palette emphasizes trust, clarity, and professionalism.

#### Primary Colors
- **Deep Navy Blue** `#1C2833` - Main brand color (trust, stability, professionalism)
  - Use for: Headers, primary buttons, navigation
  - Represents: Authority and expertise in negotiations
  
- **Professional Slate** `#2E4053` - Secondary brand color
  - Use for: Sidebar backgrounds, secondary elements
  - Represents: Strategic thinking and seriousness

#### Accent Colors
- **Success Green** `#27AE60` - For approved items, positive outcomes
  - Use for: Approved status badges, success messages, completed actions
  
- **Warning Amber** `#F39C12` - For pending/in-review items
  - Use for: Pending approvals, items needing attention
  
- **Alert Red** `#E74C3C` - For rejections, critical items
  - Use for: Rejected items, urgent deadlines, red lines
  
- **Info Blue** `#3498DB` - For informational elements
  - Use for: Generated items, informational badges

#### Neutral Colors
- **White** `#FFFFFF` - Primary background
- **Light Gray** `#ECF0F1` - Card backgrounds, subtle divisions
- **Medium Gray** `#BDC3C7` - Borders, disabled states
- **Text Gray** `#34495E` - Primary text
- **Light Text** `#7F8C8D` - Secondary text, labels

### Status Color Coding
- **Draft**: Gray `#95A5A6`
- **Pack Generated**: Info Blue `#3498DB`
- **In Review**: Warning Amber `#F39C12`
- **Approved**: Success Green `#27AE60`
- **Changes Requested**: Alert Orange `#E67E22`
- **Rejected**: Alert Red `#E74C3C`
- **Meeting Done**: Purple `#9B59B6`
- **Completed**: Dark Green `#16A085`

### Typography
- **Headings**: Inter or Poppins (modern, professional, clean)
- **Body Text**: Inter or Open Sans (highly readable)
- **Font Sizes**:
  - H1: 32px (Page titles)
  - H2: 24px (Section headers)
  - H3: 20px (Card titles)
  - Body: 16px (Main content)
  - Small: 14px (Labels, captions)
  - Tiny: 12px (Timestamps, metadata)

### Key UI Components

#### Dashboard Cards
- White background with subtle shadow
- Navy blue header with white text
- Status badge in top-right corner
- Hover effect: Slight elevation and border highlight
- Clean, spacious layout with proper padding

#### Buttons
- **Primary**: Deep Navy `#1C2833` with white text
- **Secondary**: Outlined navy with navy text
- **Success**: Green `#27AE60`
- **Danger**: Red `#E74C3C`
- Rounded corners (8px)
- Hover states with slight darkening

#### Forms
- Clean input fields with light gray borders
- Focus state: Navy blue border
- Label above input (not placeholder-only)
- Required field indicator (*)
- Validation messages in appropriate colors
- Proper spacing between fields

#### Status Badges
- Rounded pill shape
- Colored background with darker text
- Small size (24px height)
- Icon + text for clarity

#### Navigation
- Left sidebar (desktop) or top navigation (mobile)
- Navy background with lighter text
- Active item highlighted with accent color
- Icons + labels for clarity
- Collapsible on mobile

#### Data Tables
- Alternating row colors for readability
- Sortable columns with indicators
- Hover state on rows
- Action buttons on right side
- Pagination at bottom

#### Empty States
- Centered icon (light gray)
- Helpful message
- Clear call-to-action button
- Suggested next steps

#### Loading States
- Skeleton screens for content loading
- Spinner for AI generation (with progress text)
- Shimmer effect for better UX
- Never block entire UI

#### Modals/Dialogs
- White background with shadow
- Navy header
- Clear close button
- Action buttons at bottom right
- Overlay darkens background

#### Notifications/Toasts
- Top-right corner positioning
- Auto-dismiss after 5 seconds
- Icon + message + close button
- Color-coded by type (success/warning/error/info)

### Responsive Design

#### Mobile (< 640px)
- Single column layout
- Hamburger menu navigation
- Stacked form fields
- Full-width buttons
- Card-based dashboard
- Bottom navigation for key actions

#### Tablet (640px - 1024px)
- Two-column layout where appropriate
- Collapsible sidebar
- Grid-based dashboard (2 columns)
- Modal dialogs scale appropriately

#### Desktop (> 1024px)
- Full layout with persistent sidebar
- Three-column layouts where needed
- Grid-based dashboard (3-4 columns)
- Side-by-side comparison views
- Larger modal dialogs

### Malaysian Business Culture Considerations

1. **Hierarchy & Authority**
   - Clear approval workflows visible
   - Respect for management review process
   - Formal tone in language
   - Proper titles and names displayed

2. **Relationship Focus**
   - Stakeholder collaboration features prominent
   - Comment threads for discussion
   - Clear communication history
   - Team member visibility

3. **Language Support** (Future)
   - Prepare for Bahasa Malaysia translation
   - Right-to-left reading support if needed
   - Local date/time formats (DD/MM/YYYY)
   - Currency: MYR (RM)

4. **Professional Tone**
   - Formal, polite interface copy
   - Respectful confirmation messages
   - Professional terminology
   - Clear, concise instructions

### Iconography
- Use **Lucide React** icons (clean, professional, consistent)
- Key icons:
  - Handshake: Negotiations
  - Target: Goals/Targets
  - Shield: Red lines
  - Exchange: Tradeables
  - Lightbulb: AI suggestions
  - Users: Stakeholders
  - Calendar: Meetings
  - Download: Export
  - Check: Approval
  - X: Rejection
  - MessageSquare: Comments

### Micro-interactions
- Smooth transitions (200-300ms)
- Button press feedback
- Card hover elevations
- Loading animations
- Success celebrations (subtle)
- Form field validations (inline)

### Accessibility
- WCAG 2.1 AA compliance
- Color contrast ratio minimum 4.5:1
- Keyboard navigation support
- Screen reader friendly
- Focus indicators visible
- Alternative text for images
- Semantic HTML structure

---

## 10. Security & Data Protection

### Authentication
- Supabase Auth (email/password)
- Email verification required
- Password reset flow
- Session management

### Authorization (Row Level Security)

```sql
-- Users can only see their own deals
CREATE POLICY "Users view own deals"
ON deals FOR SELECT
USING (auth.uid() = owner_id);

-- Stakeholders can view deals they're assigned to
CREATE POLICY "Stakeholders view assigned deals"
ON deals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stakeholder_comments
    WHERE deal_id = deals.id
    AND user_id = auth.uid()
  )
);

-- Users can comment only on assigned deals
CREATE POLICY "Comment on assigned deals"
ON stakeholder_comments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM deals
    WHERE id = deal_id
    AND (owner_id = auth.uid() OR id IN (
      SELECT deal_id FROM stakeholder_comments WHERE user_id = auth.uid()
    ))
  )
);
```

### Data Protection
- HTTPS everywhere
- Encrypted at rest (Supabase default)
- File upload virus scanning (future)
- Regular backups
- GDPR compliance (data export/deletion)

---

## 11. Performance Requirements

### Target Metrics
- Page load: < 2 seconds
- AI generation: < 10 seconds
- PDF export: < 5 seconds
- Real-time comment update: < 1 second

### Optimization Strategies
- Lazy load components
- Optimize images/files
- Cache AI responses
- Debounce auto-save
- CDN for static assets

---

## 12. Development Phases

### Week 1-2: Foundation
- Setup Vite + React + Tailwind
- Supabase project setup
- Database schema creation
- Authentication flow
- Dashboard skeleton

### Week 3-4: Core Flow (Steps 1-2)
- Deal intake form
- Supplier management
- OpenAI integration
- AI pack generation
- Pack display & editing

### Week 5-6: Collaboration (Step 3)
- Stakeholder invitation
- Comment system
- Approval workflow
- Email notifications
- Real-time updates

### Week 7-8: Meeting & Export (Steps 4-5)
- Meeting notes form
- Action item tracker
- PDF generation
- Email distribution
- Status management

### Week 9-10: Polish & Launch
- UI/UX refinement
- Bug fixes
- Testing (unit + E2E)
- Documentation
- Deployment

---

## 13. Testing Strategy

### Unit Tests
- Form validation
- AI response parsing
- PDF generation
- Utility functions

### Integration Tests
- Full user flow (create → approve → export)
- Database transactions
- API endpoints
- Real-time features

### E2E Tests (Playwright)
- Happy path: Complete deal
- Error handling: AI fails, approver rejects
- Multi-user: Owner + 2 stakeholders
- Cross-browser testing

---

## 14. Deployment

### Hosting
- **Frontend**: Vercel
- **Backend**: Supabase Cloud
- **Files**: Supabase Storage
- **Domain**: Custom domain with SSL

### Environments
- Development (local)
- Staging (testing)
- Production

### CI/CD
- GitHub Actions
- Auto-deploy on merge to main
- Preview deploys for PRs
- Database migrations via Supabase CLI

---

## 15. Monitoring & Analytics

### Error Tracking
- Sentry for frontend errors
- Supabase logs for backend

### Usage Analytics
- Deals created per week
- AI generation success rate
- Approval time (submission → approval)
- Meeting completion rate
- PDF downloads

### Business Metrics
- Active users
- Deals per user
- Cost per AI generation
- User retention

---

## 16. Documentation

### User Guides
- Quick start guide
- Video walkthrough
- Step-by-step tutorials
- FAQs

### Developer Docs
- README.md (setup instructions)
- Database schema diagram
- API endpoints reference
- Environment variables guide

---

## 17. Future Enhancements (Post-MVP)

### Phase 2
- Templates library (by industry)
- Historical deal comparison
- Mobile app
- Outcome tracking (actual vs target)

### Phase 3
- Calendar integration
- CRM integration (Salesforce)
- Advanced analytics dashboard
- Multi-language support

---

## Appendix A: Sample Data

### Example Deal
```json
{
  "title": "Cloud Infrastructure Renewal - AWS",
  "supplier": "Amazon Web Services",
  "scope": "Renew 3-year contract for cloud hosting, increase capacity by 30%",
  "pricing_model": "Reserved instances + on-demand",
  "key_issues": "Current spend $500k/year, seeking 15% discount, better support SLA",
  "desired_outcomes": "Lock in $425k/year, 24/7 support, 99.99% uptime SLA"
}
```

### Example AI Output
```json
{
  "targets": [
    "$425k annual spend (15% reduction)",
    "99.99% uptime SLA",
    "24/7 premium support included",
    "Quarterly business reviews"
  ],
  "red_lines": [
    "Annual spend must not exceed $450k",
    "Minimum 99.9% uptime SLA",
    "No auto-renewal clause"
  ],
  "tradeables": [
    {
      "we_give": "3-year commitment instead of 1-year",
      "we_get": "10% volume discount"
    },
    {
      "we_give": "Pay upfront annually",
      "we_get": "Additional 5% discount"
    }
  ],
  "batna": "Move to Google Cloud Platform - competitive pricing at $440k/year with similar SLA",
  "questions": [
    "What's your best pricing for a 3-year prepaid commitment?",
    "Can you match GCP's 99.99% SLA at our volume?",
    "What support tier includes 24/7 response?"
  ]
}
```

---

## Appendix B: API Endpoints

### Deals
- GET /api/deals - List user's deals
- POST /api/deals - Create deal
- GET /api/deals/:id - Get single deal
- PATCH /api/deals/:id - Update deal
- DELETE /api/deals/:id - Delete deal

### Negotiation Pack
- POST /api/deals/:id/generate-pack - Generate AI pack
- GET /api/negotiation-packs/:id - Get pack
- PATCH /api/negotiation-packs/:id - Update pack

### Stakeholders
- POST /api/deals/:id/stakeholders - Invite stakeholders
- GET /api/stakeholder-comments - List comments
- POST /api/stakeholder-comments - Add comment
- PATCH /api/stakeholder-comments/:id - Update approval status

### Meeting & Actions
- POST /api/meeting-notes - Create meeting notes
- GET /api/meeting-notes/:id - Get notes
- POST /api/actions - Create action
- PATCH /api/actions/:id - Update action status

### Export
- POST /api/deals/:id/export-pdf - Generate PDF
- GET /api/deals/:id/download-pdf - Download PDF

### Suppliers
- GET /api/suppliers - List suppliers
- POST /api/suppliers - Create supplier
- PATCH /api/suppliers/:id - Update supplier