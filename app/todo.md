# App Infografica Attività Estrattive Puglia - Piano di Sviluppo

## Design Guidelines

### Design References
- **Gov.it Dashboard Style**: Clean, professional, institutional
- **Style**: Modern Data Visualization + Professional Dashboard

### Color Palette
- Primary: #0066CC (Institutional Blue - headers, CTAs)
- Secondary: #003D7A (Dark Blue - navigation)
- Accent: #28A745 (Green - success states, positive trends)
- Background: #F8F9FA (Light Gray)
- Cards: #FFFFFF (White)
- Text: #212529 (Dark Gray), #6C757D (Medium Gray - secondary)
- Borders: #DEE2E6 (Light Gray)

### Typography
- Heading1: Inter font-weight 700 (32px)
- Heading2: Inter font-weight 600 (24px)
- Heading3: Inter font-weight 600 (20px)
- Body: Inter font-weight 400 (16px)
- Small: Inter font-weight 400 (14px)

### Key Component Styles
- **Cards**: White background, subtle shadow, 8px rounded corners
- **Buttons**: Blue primary (#0066CC), white text, 6px rounded
- **Charts**: Professional color scheme with blues and greens
- **Forms**: Clean inputs with bottom border focus states

### Images to Generate
1. **hero-puglia-landscape.jpg** - Panoramic view of Puglia quarries landscape (Style: photorealistic, aerial view)
2. **data-visualization-icon.png** - Modern data analytics icon for homepage (Style: minimalist, vector-style)
3. **admin-dashboard-icon.png** - Admin panel icon (Style: minimalist, blue theme)
4. **quarry-equipment.jpg** - Industrial quarry equipment background (Style: photorealistic, professional)

---

## Database Schema

### Table: annual_cave_data
- id (Integer, autoincrement, primary key)
- user_id (String, required)
- anno (Integer, required, unique per user)
- numero_cave (Integer, required)
- created_at (DateTime)
- updated_at (DateTime)
- create_only: true

### Table: cave_details
- id (Integer, autoincrement, primary key)
- user_id (String, required)
- anno (Integer, required)
- numero_fascicolo (String)
- azienda (String)
- localita (String)
- comune (String)
- provincia (String)
- dati_catastali (String)
- stato_cava (String)
- aperta_fino_al (Integer, nullable)
- materiale (String)
- numero_decreto (String, nullable)
- data_decreto (String, nullable)
- scadenza_autorizzazione (String, nullable)
- created_at (DateTime)
- create_only: true

---

## Development Tasks

### Phase 1: Backend Setup
1. ✅ Create database tables (annual_cave_data, cave_details)
2. ✅ Generate images for the application
3. ✅ Install frontend dependencies

### Phase 2: Frontend Core Pages
4. Homepage/Presentazione - Hero section with title, description, CTA button
5. Menu/Indice page - Navigation cards for different chapters
6. Auth pages - Login page and callback handler

### Phase 3: Admin Panel
7. Admin dashboard layout with navigation
8. Form for manual entry (anno, numero_cave) with update/replace logic
9. Excel upload component with year selector
10. Excel parsing and validation logic
11. Data submission to backend

### Phase 4: Public Dashboard "Cave Autorizzate"
12. Year selector dropdown
13. Main chart: temporal trend of authorized caves by year
14. Province distribution chart (filtered by selected year)
15. Material distribution chart (filtered by selected year)
16. Summary statistics table
17. AI-generated commentary (use deepseek-v3.2) based on data

### Phase 5: Data Processing & Integration
18. Backend route for Excel parsing and cave filtering
19. Frontend data fetching and state management
20. Chart components with Recharts library
21. Responsive design and animations

### Phase 6: Testing & Polish
22. Test authentication flow
23. Test data upload and visualization
24. Verify year switching functionality
25. Final lint check and deployment