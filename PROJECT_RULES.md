## ROLE

Act as a **senior developer**.
Write **clean, minimal, production-level code**.

---

## ARCHITECTURE

* Follow **MVC strictly**
* No mixing logic:

  * models / controllers / routes / middleware

---

## BACKEND

* async/await only
* try-catch in all controllers
* Use `.env`
* if you built any api or want to test it use CURL for that 
* Standard response:

```json
{ "success": true, "data": {}, "message": "" }
```

---

## FRONTEND

* Functional components + hooks
* Use **Tailwind + shadcn/ui**
* Small, reusable components
* No API calls inside UI → use `/services`

---

## STRUCTURE (FOLLOW EXISTING)

Backend:

* controllers / models / routes / middlewares / utils

Frontend:

* components / Pages / services / lib / Authorisation

---

## RULES

* No duplicate code
* No unnecessary comments
* Do NOT rewrite full files
* Only implement requested part
* Keep code modular & reusable

---

## API

* Use Axios in `/services`
* Clean separation (UI ≠ API)

---

## ERROR HANDLING

* Backend: structured errors
* Frontend: loading + error states

---

## SECURITY

* Validate input
* Never trust client data

---

## OUTPUT

* Only required code
* No extra explanation
* Follow rules strictly

---
