# Student Information Chatbot — 3D Website

A single-page 3D website for the AI mini project **Student Information Chatbot**.
It presents the project and carries a working chatbot prototype that runs entirely
in the browser.

## Run it

Open `index.html` in any modern browser — no build step, no server needed.
(The only external resources are Three.js from a CDN and Google Fonts, so the first
load needs internet.)

## Files

| File | What it holds |
|---|---|
| `index.html` | Page structure — hero, overview, demo, features, architecture, stack |
| `css/style.css` | Theme, glassmorphism, CSS 3D transforms, responsive rules |
| `js/scene.js` | Three.js hero scene: AI core, orbiting data nodes, starfield, parallax |
| `js/chatbot.js` | Intent engine + mock student database + chat UI |
| `js/main.js` | Nav, scroll reveal, card tilt, counters |

## The chatbot

`js/chatbot.js` mirrors the Python/NLTK pipeline described in the report:

1. **Tokenise** the question and drop stop words.
2. **Score** the tokens against the patterns of every intent (40+ patterns across
   21 intents: attendance, results, CGPA, fees, scholarship, timetable, exams,
   library, faculty, courses, hostel, transport, placement, admission, holidays,
   contact, greeting, help, identity, thanks, bye).
3. **Extract entities** — a roll number such as `21CS002`, or a weekday for the
   timetable.
4. **Look up** the record in the mock database (`DB` in `chatbot.js`) and fill the
   response template.
5. Anything unmatched falls back to a suggestion list.

### Sample records

| Roll no. | Name | Branch |
|---|---|---|
| 21CS001 | Aarav Mehta | Computer Engineering |
| 21CS002 | Diya Sharma | Computer Engineering |
| 21IT014 | Rohan Verma | Information Technology |
| 21EC027 | Sneha Patil | Electronics & Communication |
| 21ME009 | Kabir Nair | Mechanical Engineering |

Type a roll number in the chat to switch the active student, then ask
"my attendance", "show results", "fee status", and so on.

### Connecting a real backend

Replace the body of `ask()` in `js/chatbot.js` with a call to the Flask API:

```js
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: text })
})
  .then(function (r) { return r.json(); })
  .then(function (d) { bubble(d.reply, 'bot'); });
```

The rest of the UI stays unchanged.
