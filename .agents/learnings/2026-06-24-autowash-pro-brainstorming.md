# Development Journal: AutoWash Pro Brainstorming & Design Formulation

- **Date**: 2026-06-24
- **Author**: Agent (Antigravity)
- **Story/Feature Reference**: [AutoWash_Pro_Project_Summary.md](file:///d:/demoSWP/demo1/.agents/source/AutoWash_Pro_Project_Summary.md)

## Summary of Changes
- Brainstormed and defined the Customer Authentication Portal and Booking Wizard flows.
- Simulated and generated 5 high-fidelity dark-mode glassmorphic screens in Stitch matching VinaWash services guidelines.
- Created the detailed design specification at [2026-06-24-autowash-pro-design.md](file:///d:/demoSWP/demo1/docs/superpowers/specs/2026-06-24-autowash-pro-design.md).

## Technical Decisions & Trade-offs
- **Single-Page Multi-step Wizard (Option 1)**: Chosen over URL-Route-based and Accordion designs. It offers seamless, immediate step switching without reloading the browser, which keeps state in React Context (`BookingContext`) synchronized with the sticky summary panel. It aligns with the existing single-route URL pattern of VinaWash.
- **Persistent Vehicle Size Selector**: Decided to place the Car Size dropdown at the top of the booking page rather than as a separate step. This allows real-time multiplication of service prices (`DisplayPrice = BasePrice * Multiplier`) across the entire service catalog, giving instant pricing feedback to the customer.
- **VietQR Bank Transfer Integration**: Since online payment systems and automated refund APIs are explicitly out of scope, a manual 100% bank transfer checkout flow was chosen. The system displays a static VietQR code along with the booking ID as the transfer description, allowing the Admin to manually check the bank statement and confirm.

## Key Learnings & Gotchas
- **Gotcha**: VinaWash's live system uses a fixed single route `/booking/`. Retaining this single-route approach for AutoWash Pro simplifies the component state, but requires saving progress in `sessionStorage` or local state to prevent data loss on page refreshes.
- **English UI Enforcement**: The specification enforces a single-language English UI to prevent dependency bloat from internationalization libraries (`react-i18next`), which must be adhered to in the frontend code.

## Next Steps (Next Session)
1. **Transition to Implementation**: Load the `writing-plans` skill to write a step-by-step implementation plan for the frontend and backend integration.
2. **Customer Authentication Portal**: Implement the React Login and Registration UI (Phone, Password, License Plate, Name) with context state.
3. **Multi-step Booking Wizard**: Scaffold the `/booking` page and implement step components:
   - `<StepBranchSelection />`
   - `<StepDateTimeSelection />` (30-minute intervals, availability limits)
   - `<StepServicesSelection />` (with accordion, detail drop-downs, and sticky summary sidebar)
   - `<StepContactInfo />`
   - `<StepPaymentConfirmation />` (bank transfer details and VietQR)
