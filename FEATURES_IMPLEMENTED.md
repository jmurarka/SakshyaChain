# SākshyaChain Prototype — Implemented Features

This guide summarizes the prototype’s user-facing features, the frontend flow, and the matching backend behavior. Some integrations are simulated for demonstration; see the notes at the end.

## Sign-in and identity

### 1. Portal selection, credential sign-in, and OTP
**Description:** Employees and IT Admins use separate sign-in forms, and every sign-in requires a one-time code.

- **Frontend flow:** Choose Employee or IT Admin → enter credentials (IT Admin also enters the secret code) → view the simulated desktop OTP message → enter the six-digit code → open the dashboard.
- **Backend:** Checks credentials and frozen-account status, generates a time-limited OTP challenge, and issues an access token only after OTP verification.

### 2. Employee profiles and assigned cases
**Description:** The dashboard shows each person’s employee ID, designation, station where relevant, location, and assigned work.

- **Frontend flow:** Sign in → review staff details and assigned cases on the dashboard → open a case to see its evidence.
- **Backend:** Returns only cases assigned to the signed-in account and checks assignment again for document and case operations.

### 3. Employee registration and computer IP record
**Description:** IT Admin can register an employee with an ID, name, contact detail, computer IP, and optional role and assignment details.

- **Frontend flow:** IT Admin → Device Registry → enter employee and device details → register → copy the generated temporary password shown once.
- **Backend:** Validates unique employee ID/IP and IP format, stores the account and hashed temporary password, and returns the password once for the prototype.

## Evidence access and integrity

### 4. Request-based document access
**Description:** Eligible employees can request view, download, or edit rights for files in their assigned cases.

- **Frontend flow:** Request Access → choose a file, permission, reason, and optional duration → track progress in My Requests.
- **Backend:** Checks role, clearance, case assignment, and permission eligibility; records the request and its audit event.

### 5. Owner and supervisor approval
**Description:** Restricted access becomes active after the document owner and assigned supervisor approve the request.

- **Frontend flow:** Owner or supervisor opens the approval queue → reviews the request → approves or rejects → the requester sees the updated status.
- **Backend:** Validates approver identity and workflow order, stores both decisions, creates time-limited permissions after approval, and records decisions in the audit ledger.

### 6. Approved view, download, and edit actions
**Description:** The granted permission controls how the employee can use the document.

- **Frontend flow:** Open an approved file or select its action → see “Please wait till the document is decrypted” for a short simulated delay → view, download, or edit according to the grant.
- **Backend:** Checks current permission and expiry before serving a document action and records access events.

### 7. IT Admin access grants and revocation
**Description:** IT Admin can view system evidence and grant or revoke employee document permissions while remaining read-only for evidence changes.

- **Frontend flow:** Open Access Requests → choose employee, document, permission, and duration → grant access or revoke an existing grant.
- **Backend:** Restricts the grant/revoke endpoints to IT Admin, checks employee eligibility, and records permission changes in the audit ledger.

### 8. Evidence upload and encrypted storage
**Description:** Employees can upload evidence into the prototype vault with case and custody details.

- **Frontend flow:** Upload & Ingest → select the assigned case and file → submit → review the resulting evidence record.
- **Backend:** Checks assignment and clearance, encrypts the stored payload, records metadata, and appends an upload event to the ledger.

### 9. Tampering simulation, account freeze, and evidence lock
**Description:** The designated demo officer can simulate a tamper attempt, which freezes the account for 15 minutes and temporarily locks the selected evidence.

- **Frontend flow:** Inspector Bhir Rao opens Integrity Monitor → selects a file → simulates tampering → sees the lockout message and is returned to sign-in.
- **Backend:** Freezes the account, sets an evidence lock expiry, records a high-severity incident, and appends a tamper event to the ledger.

### 10. IT Admin security alerts
**Description:** IT Admin receives a visible tamper alert and can review the incident to acknowledge and clear the open alert.

- **Frontend flow:** IT Admin sees the alarm banner and alert controls → opens the incident feed → reviews the details and lock status.
- **Backend:** Persists alert state, exposes incident details to IT Admin, and records acknowledgement/resolution.

### 11. Audit trail and integrity verification
**Description:** Users can inspect audit activity, while authorized oversight roles can run ledger integrity checks.

- **Frontend flow:** Open Audit Trail or Integrity Monitor → inspect events or run the verification scan → review any reported integrity issue.
- **Backend:** Stores ordered audit events and returns verification results for ledger hashes and chain links.

## Oversight and investigation tools

### 12. Organization and ICJS information page
**Description:** The Organization page provides a short static overview of ICJS connected systems and the prototype’s information-flow rules.

- **Frontend flow:** Open Organization/Org Hierarchy → review the system overview, simplified flow, access summary, and information update notes.
- **Backend:** No dynamic service is required for this static information page.

### 13. Knowledge Graph and AI Evidence Assistant
**Description:** Investigators can explore case relationships and ask questions about evidence available to their account.

- **Frontend flow:** Open Knowledge Graph or AI Evidence Assistant → choose or search within accessible case information → review connected entities or generated responses.
- **Backend:** Filters graph and assistant evidence against document access policy before returning results.

### 14. Break-Glass emergency access
**Description:** Authorized users can request temporary emergency access with a justification for urgent case work.

- **Frontend flow:** Open Break-Glass Access → submit the case and justification → await the required approval → use the temporary access while active.
- **Backend:** Creates and validates time-limited emergency grants and records their use in the audit trail.

## Prototype notes

- OTP delivery is simulated: the code is shown on the same desktop and is not sent by SMS or email.
- Demo employee and IT Admin credentials are listed in [DEMO_CREDENTIALS_AND_ACCESS_FLOW.md](./DEMO_CREDENTIALS_AND_ACCESS_FLOW.md).
- Registered computer IPs are stored as prototype account details; they are not currently used as live firewall rules.
- Newly registered employees receive a generated temporary password displayed once in the registration flow.
