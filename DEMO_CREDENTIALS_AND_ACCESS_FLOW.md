# SākshyaChain Prototype Sign-in and Access Flow

This file contains the hardcoded demonstration credentials for the local prototype. Do not reuse these credentials outside the demo.

## Employee accounts

Employees enter the Employee ID in the username field, followed by the password. Employee ID is the account username.

| Employee | Employee ID / username | Password | Assigned computer IP | Role | Assignment |
| --- | --- | --- | --- | --- | --- |
| Inspector Vikram Sharma | `POL-101` | `Vikram@2026` | `10.20.20.101` | Chief Investigating Officer | State vs. Cyber Syndicate (`CASE-2026-8891`) |
| Inspector Bhir Rao | `POL-102` | `Bhir@2026` | `10.20.20.106` | Investigation Officer | State Narcotics Operation (`CASE-2026-4412`) |
| Sub-Inspector Asha Nair | `POL-103` | `Asha@2026` | `10.20.20.107` | Sub-Inspector | Commercial Complex Armed Robbery (`CASE-2026-1102`) |
| Dr. Sunita Rao | `FOR-202` | `Sunita@2026` | `10.20.20.102` | Senior Forensic Analyst | `CASE-2026-8891`, `CASE-2026-4412` |
| Advocate Rajesh Verma | `PROS-303` | `Rajesh@2026` | `10.20.20.103` | Senior Public Prosecutor | `CASE-2026-8891`, `CASE-2026-1102` |
| Justice P. K. Mukherjee | `JUD-404` | `Justice@2026` | `10.20.20.104` | Special Sessions Court Magistrate | All three demonstration cases |
| Anil Gupta | `AUD-505` | `Anil@2026` | `10.20.20.105` | Principal Information Security Auditor | All three demonstration cases |

Police officers only receive the cases in their assignment list. Being in the same department does not make another officer's case visible.

Each assigned case has synthetic approval test evidence: Vikram can request Files A–C (`DOC-ACCESS-TEST-101` to `103`), Bhir can request File D (`DOC-ACCESS-TEST-104`), and Asha can request File E (`DOC-ACCESS-TEST-105`). These test files contain fictional content.

## IT Admin accounts

Choose **IT Admin** at the portal selector. Both the password and the admin-only secret code are required before OTP verification.

| IT Admin | Username | Password | Secret code |
| --- | --- | --- | --- |
| SākshyaChain IT Administrator | `it_admin1` | `Admin@2026` | `IT-SECRET-1029` |
| Meera Nair | `it_admin2` | `Meera@2026` | `IT-SECRET-2048` |

IT Admin can view system information and grant or revoke employee document permissions. The employee registration screen is also available in this prototype so new demo accounts can be created.

## OTP in the prototype

After credentials are accepted, the sign-in page displays a generated six-digit code in a **Prototype desktop message** panel. Enter that code in the OTP field to finish sign-in. Codes expire after 120 seconds and are single-use. This simulates message delivery for the prototype; it does not send an SMS or email.

Newly registered employees use the employee ID entered during registration. The page displays a generated temporary password once; save it and share it with that employee for the demonstration. Their OTP is generated at each sign-in in the same desktop message panel.

## Access request flow

1. An employee signs in with employee ID and password, then completes OTP verification.
2. The employee opens **Request Access**, selects an assigned case and its document, chooses `VIEW`, `DOWNLOAD`, or (where role policy permits) `EDIT`, and supplies a reason and optional duration.
3. The request is recorded in **My Requests**. The file owner reviews it in **Owner Requests**. After owner approval, the assigned supervisor reviews it in the supervisor queue.
4. Access becomes available only after the required approvals. A time-limited grant expires automatically when its selected duration ends.
5. The requester opens the file using the approved action: view-only, download, or edit. The prototype shows a short decryption wait before opening or downloading.
6. IT Admin can directly grant or revoke document permissions from **Access Requests**. All decisions are retained in the prototype audit record.

The requester must be assigned to the document's case to request access. Case assignment is checked for cases and documents; department membership alone does not reveal a case to another police officer.

## Employee registration

In **IT Admin → Device & endpoint registry**, enter employee ID, name, contact detail, and assigned computer IP. Role, designation, station/location, and initial case assignment can also be supplied. The IP is stored as prototype registration data; it is not currently a live network firewall rule. A temporary password is generated on registration and shown once.
