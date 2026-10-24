/* ============================================================
   chatbot.js — intent engine + chat UI
   A browser-side model of the Python/NLTK pipeline:
   tokenise -> stop words -> score against intent patterns -> respond
   ============================================================ */
(function () {

  /* ---------------------------------------------------------
     1. Student records (stands in for the MySQL tables)
     --------------------------------------------------------- */
  var DB = {
    '21CS001': {
      name: 'Aarav Mehta', branch: 'Computer Engineering', sem: 5, section: 'A',
      cgpa: 8.62, backlogs: 0,
      attendance: { 'Artificial Intelligence': 88, 'Computer Networks': 72, 'DBMS': 91, 'Operating Systems': 79, 'Software Engineering': 84 },
      marks: { 'Artificial Intelligence': 86, 'Computer Networks': 71, 'DBMS': 92, 'Operating Systems': 78, 'Software Engineering': 81 },
      fees: { total: 86000, paid: 86000, due: 0, lastReceipt: 'RCP-2025-10441' },
      books: [{ t: 'Artificial Intelligence: A Modern Approach', d: '02 Nov 2026' }, { t: 'Computer Networks (Tanenbaum)', d: '28 Oct 2026' }],
      scholarship: 'Merit scholarship approved - credited on 12 Sep 2026'
    },
    '21CS002': {
      name: 'Diya Sharma', branch: 'Computer Engineering', sem: 5, section: 'A',
      cgpa: 9.14, backlogs: 0,
      attendance: { 'Artificial Intelligence': 95, 'Computer Networks': 89, 'DBMS': 93, 'Operating Systems': 90, 'Software Engineering': 88 },
      marks: { 'Artificial Intelligence': 94, 'Computer Networks': 88, 'DBMS': 95, 'Operating Systems': 90, 'Software Engineering': 89 },
      fees: { total: 86000, paid: 66000, due: 20000, lastReceipt: 'RCP-2025-10620' },
      books: [{ t: 'Database System Concepts', d: '05 Nov 2026' }],
      scholarship: 'Application under review at the scholarship cell'
    },
    '21IT014': {
      name: 'Rohan Verma', branch: 'Information Technology', sem: 5, section: 'B',
      cgpa: 7.45, backlogs: 1,
      attendance: { 'Artificial Intelligence': 68, 'Web Technology': 74, 'DBMS': 80, 'Operating Systems': 71, 'Data Mining': 77 },
      marks: { 'Artificial Intelligence': 64, 'Web Technology': 73, 'DBMS': 79, 'Operating Systems': 58, 'Data Mining': 70 },
      fees: { total: 82000, paid: 42000, due: 40000, lastReceipt: 'RCP-2025-10188' },
      books: [{ t: 'Head First Design Patterns', d: '21 Oct 2026' }],
      scholarship: 'Not applied for this academic year'
    },
    '21EC027': {
      name: 'Sneha Patil', branch: 'Electronics & Communication', sem: 5, section: 'A',
      cgpa: 8.05, backlogs: 0,
      attendance: { 'Digital Signal Processing': 82, 'VLSI Design': 86, 'Microcontrollers': 79, 'Antennas': 75, 'Control Systems': 83 },
      marks: { 'Digital Signal Processing': 80, 'VLSI Design': 85, 'Microcontrollers': 76, 'Antennas': 72, 'Control Systems': 84 },
      fees: { total: 84000, paid: 84000, due: 0, lastReceipt: 'RCP-2025-10302' },
      books: [], scholarship: 'EBC fee waiver sanctioned'
    },
    '21ME009': {
      name: 'Kabir Nair', branch: 'Mechanical Engineering', sem: 5, section: 'C',
      cgpa: 7.88, backlogs: 0,
      attendance: { 'Thermodynamics': 77, 'Machine Design': 81, 'Fluid Mechanics': 69, 'Manufacturing': 85, 'Metrology': 80 },
      marks: { 'Thermodynamics': 75, 'Machine Design': 82, 'Fluid Mechanics': 66, 'Manufacturing': 88, 'Metrology': 79 },
      fees: { total: 80000, paid: 60000, due: 20000, lastReceipt: 'RCP-2025-10477' },
      books: [{ t: 'Engineering Thermodynamics (P.K. Nag)', d: '30 Oct 2026' }],
      scholarship: 'Not applied for this academic year'
    }
  };

  var TIMETABLE = {
    monday:    ['09:00 Artificial Intelligence - LH 204', '10:00 DBMS - LH 204', '11:15 Computer Networks - LH 201', '13:30 AI Lab - Lab 3'],
    tuesday:   ['09:00 Operating Systems - LH 204', '10:00 Software Engineering - LH 206', '11:15 DBMS Lab - Lab 1'],
    wednesday: ['09:00 Computer Networks - LH 201', '10:00 Artificial Intelligence - LH 204', '13:30 Mini Project review - Seminar Hall'],
    thursday:  ['09:00 DBMS - LH 204', '10:00 Operating Systems - LH 204', '11:15 Networks Lab - Lab 2'],
    friday:    ['09:00 Software Engineering - LH 206', '10:00 Artificial Intelligence - LH 204', '13:30 Mentoring - LH 207'],
    saturday:  ['10:00 Remedial / Project work - Lab 3'],
    sunday:    []
  };

  var EXAMS = [
    '04 Dec 2026 - Artificial Intelligence - 10:00 to 13:00 - Block A',
    '07 Dec 2026 - Computer Networks - 10:00 to 13:00 - Block A',
    '10 Dec 2026 - DBMS - 10:00 to 13:00 - Block B',
    '13 Dec 2026 - Operating Systems - 10:00 to 13:00 - Block B',
    '16 Dec 2026 - Software Engineering - 10:00 to 13:00 - Block A'
  ];

  var FACULTY = [
    { n: 'Dr. S. R. Kulkarni', s: 'Artificial Intelligence', c: 'Cabin 212, CS Block', e: 'kulkarni@college.edu' },
    { n: 'Prof. M. Joshi',     s: 'Computer Networks',       c: 'Cabin 208, CS Block', e: 'mjoshi@college.edu' },
    { n: 'Dr. A. Deshmukh',    s: 'DBMS',                    c: 'Cabin 215, CS Block', e: 'deshmukh@college.edu' },
    { n: 'Prof. R. Iyer',      s: 'Operating Systems',       c: 'Cabin 203, CS Block', e: 'riyer@college.edu' },
    { n: 'Dr. P. Bhosale',     s: 'Software Engineering',    c: 'Cabin 219, CS Block', e: 'bhosale@college.edu' }
  ];

  var DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  /* ---------------------------------------------------------
     2. Session state
     --------------------------------------------------------- */
  var current = '21CS001';
  function me() { return DB[current]; }

  /* ---------------------------------------------------------
     3. Helpers
     --------------------------------------------------------- */
  var STOP = ' a an the is are am was were do does did my me i you your please can could tell show give about of for to in on at and or what whats which how when who whom pls '.split(' ');

  function tokens(s) {
    return s.toLowerCase().replace(/[^a-z0-9%\s]/g, ' ').split(/\s+/).filter(function (w) {
      return w && STOP.indexOf(w) === -1;
    });
  }

  function pct(n) { return n + '%'; }

  function avg(obj) {
    var k = Object.keys(obj), s = 0;
    k.forEach(function (x) { s += obj[x]; });
    return Math.round(s / k.length);
  }

  function rupees(n) { return 'Rs. ' + n.toLocaleString('en-IN'); }

  function listAttendance(st) {
    return Object.keys(st.attendance).map(function (sub) {
      var v = st.attendance[sub];
      return (v < 75 ? '  !  ' : '  -  ') + sub + ' : **' + pct(v) + '**';
    }).join('\n');
  }

  function dayName() { return DAYS[new Date().getDay()]; }

  /* ---------------------------------------------------------
     4. Intents — patterns are matched by keyword overlap
     --------------------------------------------------------- */
  var INTENTS = [
    {
      tag: 'greeting', score: 0,
      patterns: ['hi', 'hello', 'hey', 'good morning', 'good evening', 'namaste', 'hola', 'yo'],
      reply: function () {
        return 'Hello **' + me().name.split(' ')[0] + '**! I am StudentBot, your college information assistant.\n' +
               'Ask me about attendance, results, fees, timetable, exams, the library or faculty.';
      }
    },
    {
      tag: 'identity',
      patterns: ['who are you', 'your name', 'what are you', 'about you', 'bot'],
      reply: function () {
        return 'I am **StudentBot**, a rule-and-intent based assistant built for the Student Information Chatbot mini project.\n' +
               'I classify your question into one of 40+ intents and read the answer from the student database.';
      }
    },
    {
      tag: 'help',
      patterns: ['help', 'what can you do', 'options', 'commands', 'menu', 'features'],
      reply: function () {
        return 'Here is what I can answer:\n' +
               '  -  **Attendance** - subject wise percentage and shortage\n' +
               '  -  **Results** - marks, CGPA, backlogs\n' +
               '  -  **Fees** - paid, pending, receipts, scholarship\n' +
               '  -  **Timetable** - today or any weekday\n' +
               '  -  **Exams** - the published schedule\n' +
               '  -  **Library** - issued books, fines, timings\n' +
               '  -  **Faculty** - cabins and e-mail ids\n' +
               '  -  **Campus** - hostel, transport, placement, admission\n\n' +
               'Tip: type a roll number such as **21CS002** to look up another student.';
      }
    },
    {
      tag: 'attendance',
      patterns: ['attendance', 'present', 'absent', 'lectures attended', 'defaulter', 'shortage', '75'],
      reply: function () {
        var st = me(), a = avg(st.attendance), low = [];
        Object.keys(st.attendance).forEach(function (s) { if (st.attendance[s] < 75) low.push(s); });
        var out = 'Attendance for **' + st.name + '** (' + current + ', Sem ' + st.sem + ')\n' +
                  listAttendance(st) + '\n\nOverall: **' + pct(a) + '**';
        out += low.length
          ? '\n\n Warning: you are below 75% in ' + low.join(', ') + '. Attend the next 6 to 8 lectures to clear the shortage.'
          : '\n\n You are above the 75% requirement in every subject. Well done.';
        return out;
      }
    },
    {
      tag: 'results',
      patterns: ['result', 'results', 'marks', 'score', 'grade', 'marksheet', 'internal', 'performance'],
      reply: function () {
        var st = me();
        var rows = Object.keys(st.marks).map(function (s) {
          return '  -  ' + s + ' : **' + st.marks[s] + '/100**';
        }).join('\n');
        return 'Semester ' + st.sem + ' results for **' + st.name + '** (' + current + ')\n' + rows +
               '\n\nAverage: **' + avg(st.marks) + '/100**   |   CGPA: **' + st.cgpa + '**   |   Backlogs: **' + st.backlogs + '**';
      }
    },
    {
      tag: 'cgpa',
      patterns: ['cgpa', 'sgpa', 'gpa', 'percentage overall', 'aggregate'],
      reply: function () {
        var st = me();
        return 'Your current CGPA is **' + st.cgpa + '** with **' + st.backlogs + '** backlog(s).\n' +
               'Approximate percentage: **' + (st.cgpa * 9.5).toFixed(1) + '%** (CGPA x 9.5 formula).';
      }
    },
    {
      tag: 'timetable',
      patterns: ['timetable', 'time table', 'schedule today', 'lecture', 'class', 'periods', 'next class', 'today'],
      reply: function (q) {
        var day = dayName();
        DAYS.forEach(function (d) { if (q.indexOf(d) > -1) day = d; });
        if (q.indexOf('tomorrow') > -1) day = DAYS[(new Date().getDay() + 1) % 7];
        var list = TIMETABLE[day];
        if (!list.length) return 'There are no lectures scheduled on **' + day + '**. Enjoy the break.';
        return 'Timetable for **' + day.charAt(0).toUpperCase() + day.slice(1) + '**\n' +
               list.map(function (l) { return '  -  ' + l; }).join('\n');
      }
    },
    {
      tag: 'exam',
      patterns: ['exam', 'exams', 'examination', 'test', 'paper', 'hall ticket', 'end sem', 'datesheet'],
      reply: function () {
        return 'End semester examination schedule\n' +
               EXAMS.map(function (e) { return '  -  ' + e; }).join('\n') +
               '\n\nHall tickets will be released on the student portal one week before the first paper.';
      }
    },
    {
      tag: 'fees',
      patterns: ['fee', 'fees', 'payment', 'due', 'pending amount', 'receipt', 'installment', 'paid'],
      reply: function () {
        var f = me().fees;
        var out = 'Fee status for **' + me().name + '** (' + current + ')\n' +
                  '  -  Total payable : **' + rupees(f.total) + '**\n' +
                  '  -  Paid          : **' + rupees(f.paid) + '**\n' +
                  '  -  Pending       : **' + rupees(f.due) + '**\n' +
                  '  -  Last receipt  : ' + f.lastReceipt;
        out += f.due > 0
          ? '\n\nThe pending amount is due on **30 Nov 2026**. Pay online through the student portal or at the accounts counter.'
          : '\n\nNo dues. Your fee account is clear.';
        return out;
      }
    },
    {
      tag: 'scholarship',
      patterns: ['scholarship', 'freeship', 'ebc', 'waiver', 'stipend', 'financial aid'],
      reply: function () { return 'Scholarship status: **' + me().scholarship + '**\nFor queries, visit the scholarship cell in the administrative block between 11:00 and 16:00.'; }
    },
    {
      tag: 'library',
      patterns: ['library', 'book', 'books', 'issued', 'return', 'fine', 'journal', 'reading room'],
      reply: function () {
        var b = me().books;
        var out = 'Library account of **' + me().name + '**\n';
        out += b.length
          ? b.map(function (x) { return '  -  ' + x.t + '  (return by **' + x.d + '**)'; }).join('\n')
          : '  -  No books currently issued.';
        return out + '\n\nLibrary hours: 08:30 to 19:30 on working days. Overdue fine is Rs. 2 per day per book.';
      }
    },
    {
      tag: 'faculty',
      patterns: ['faculty', 'teacher', 'professor', 'sir', 'madam', 'hod', 'cabin', 'mentor', 'contact teacher'],
      reply: function () {
        return 'Faculty of the department\n' +
               FACULTY.map(function (f) { return '  -  **' + f.n + '** - ' + f.s + '\n     ' + f.c + '  |  ' + f.e; }).join('\n') +
               '\n\nHead of Department: Dr. S. R. Kulkarni, Cabin 212.';
      }
    },
    {
      tag: 'course',
      patterns: ['course', 'subject', 'subjects', 'syllabus', 'curriculum', 'branch', 'credits', 'department'],
      reply: function () {
        var st = me();
        return 'You are enrolled in **' + st.branch + '**, Semester ' + st.sem + ', Section ' + st.section + '.\n' +
               'Subjects this semester:\n' +
               Object.keys(st.marks).map(function (s) { return '  -  ' + s; }).join('\n') +
               '\n\nThe full syllabus PDF is on the student portal under Academics > Syllabus.';
      }
    },
    {
      tag: 'hostel',
      patterns: ['hostel', 'room', 'mess', 'warden', 'accommodation'],
      reply: function () {
        return 'Hostel desk\n  -  Boys and girls hostels are inside the campus, 2 and 3 seater rooms.\n' +
               '  -  Mess charges: Rs. 3,200 per month.\n  -  Entry closes at 22:00; late entry needs a warden pass.\n' +
               '  -  Warden office: Block C, ground floor, 09:00 to 17:00.';
      }
    },
    {
      tag: 'transport',
      patterns: ['bus', 'transport', 'van', 'route', 'pass'],
      reply: function () {
        return 'College transport\n  -  12 routes cover the city, first pick-up at 07:10.\n' +
               '  -  Annual bus pass: Rs. 14,000, issued at the transport counter.\n' +
               '  -  Route sheets are displayed near the main gate notice board.';
      }
    },
    {
      tag: 'placement',
      patterns: ['placement', 'job', 'internship', 'company', 'package', 'recruit', 'training'],
      reply: function () {
        return 'Training and placement cell\n  -  Eligibility: CGPA 6.0 and above with no live backlog.\n' +
               '  -  Your CGPA is **' + me().cgpa + '**, so you are eligible.\n' +
               '  -  Aptitude training starts in the sixth semester.\n' +
               '  -  Register on the T&P portal before the drive window closes.';
      }
    },
    {
      tag: 'admission',
      patterns: ['admission', 'apply', 'eligibility', 'entrance', 'seat', 'cutoff', 'fee structure'],
      reply: function () {
        return 'Admissions\n  -  First year intake is through the state CET / JEE merit list.\n' +
               '  -  Direct second year admission is open for diploma holders.\n' +
               '  -  Documents: marksheets, CET score card, transfer and caste certificate.\n' +
               '  -  Admission cell: 10:00 to 16:00, administrative block.';
      }
    },
    {
      tag: 'holiday',
      patterns: ['holiday', 'vacation', 'leave', 'break', 'calendar'],
      reply: function () {
        return 'Upcoming academic calendar\n  -  31 Oct 2026 - Institute holiday\n  -  04 to 16 Dec 2026 - End semester examinations\n' +
               '  -  17 Dec 2026 to 02 Jan 2027 - Winter break\n  -  05 Jan 2027 - Semester 6 begins';
      }
    },
    {
      tag: 'contact',
      patterns: ['contact', 'phone', 'email', 'address', 'office', 'reach', 'helpline'],
      reply: function () {
        return 'College office\n  -  Phone: +91 20 2555 0101\n  -  E-mail: info@college.edu\n' +
               '  -  Office hours: 10:00 to 17:00, Monday to Saturday\n  -  Address: Pune 411001, Maharashtra';
      }
    },
    {
      tag: 'thanks',
      patterns: ['thanks', 'thank you', 'thx', 'great', 'awesome', 'nice', 'cool', 'helpful'],
      reply: function () { return 'Happy to help. Ask me anything else about your academics.'; }
    },
    {
      tag: 'bye',
      patterns: ['bye', 'goodbye', 'see you', 'exit', 'quit', 'close'],
      reply: function () { return 'Goodbye, **' + me().name.split(' ')[0] + '**. All the best for your exams.'; }
    }
  ];

  /* ---------------------------------------------------------
     5. Classifier
     --------------------------------------------------------- */
  function classify(text) {
    var q = ' ' + text.toLowerCase().trim() + ' ';
    var words = tokens(text);
    var best = null, bestScore = 0;

    INTENTS.forEach(function (it) {
      var score = 0;
      it.patterns.forEach(function (p) {
        if (p.indexOf(' ') > -1) {                 // multi word pattern
          if (q.indexOf(p) > -1) score += 3;
        } else {
          words.forEach(function (w) {
            if (w === p) score += 2;
            else if (w.length > 3 && (w.indexOf(p) === 0 || p.indexOf(w) === 0)) score += 1;
          });
        }
      });
      if (score > bestScore) { bestScore = score; best = it; }
    });

    return bestScore > 0 ? best : null;
  }

  function fallback(text) {
    var hint = text.length > 60 ? 'that' : '"' + text.trim() + '"';
    return 'I could not match ' + hint + ' to anything I was trained on.\n' +
           'Try one of: **attendance**, **results**, **fees**, **timetable**, **exam schedule**, **library**, **faculty** - or type **help** for the full list.';
  }

  /* The public brain: question in, answer out. */
  function respond(text) {
    var raw = text.trim();
    if (!raw) return 'Please type a question.';

    // entity extraction: roll number
    var roll = raw.toUpperCase().match(/\b\d{2}[A-Z]{2}\d{3}\b/);
    if (roll) {
      var id = roll[0];
      if (DB[id]) {
        current = id;
        var st = DB[id];
        return 'Record loaded for **' + st.name + '** (' + id + ')\n' +
               '  -  Branch : ' + st.branch + '\n  -  Semester : ' + st.sem + ', Section ' + st.section + '\n' +
               '  -  CGPA : **' + st.cgpa + '**   |   Attendance : **' + pct(avg(st.attendance)) + '**\n' +
               '  -  Fees pending : **' + rupees(st.fees.due) + '**\n\n' +
               'Now ask me about this student - attendance, results, fees, library and so on.';
      }
      return 'Roll number **' + id + '** is not in the database.\nAvailable records: ' + Object.keys(DB).join(', ') + '.';
    }

    var intent = classify(raw);
    return intent ? intent.reply(' ' + raw.toLowerCase() + ' ') : fallback(raw);
  }

  /* ---------------------------------------------------------
     6. Chat UI
     --------------------------------------------------------- */
  var body = document.getElementById('chatBody');
  var form = document.getElementById('chatForm');
  var input = document.getElementById('chatInput');
  var chips = document.getElementById('chips');
  var reset = document.getElementById('chatReset');
  if (!body || !form) return;

  function escape(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function render(s) {
    return escape(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  }

  function bubble(text, who) {
    var el = document.createElement('div');
    el.className = 'msg ' + who;
    el.innerHTML = render(text);
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }

  function typing() {
    var el = document.createElement('div');
    el.className = 'typing';
    el.innerHTML = '<i></i><i></i><i></i>';
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }

  /* one question at a time, so answers never arrive out of order */
  var queue = [], busy = false, gen = 0;

  function ask(text) {
    queue.push(text);
    pump();
  }

  function pump() {
    if (busy || !queue.length) return;
    busy = true;
    var text = queue.shift();
    bubble(text, 'user');
    var t = typing();
    var answer = respond(text);
    var wait = Math.min(1100, 320 + answer.length * 3);
    var g = gen;
    setTimeout(function () {
      busy = false;
      if (g !== gen) return;            // the chat was reset while typing
      t.remove();
      bubble(answer, 'bot');
      pump();
    }, wait);
  }

  function boot() {
    gen++;
    queue.length = 0;
    busy = false;
    body.innerHTML = '';
    current = '21CS001';
    var g = gen;
    setTimeout(function () {
      if (g !== gen) return;
      bubble('Hello! I am **StudentBot**, the college information assistant.', 'bot');
    }, 300);
    setTimeout(function () {
      if (g !== gen) return;
      bubble('You are signed in as **Aarav Mehta** (21CS001), Computer Engineering, Semester 5.\n' +
             'Ask me about attendance, results, fees, timetable, exams, library or faculty - or type **help**.', 'bot');
    }, 1100);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = input.value.trim();
    if (!v) return;
    input.value = '';
    ask(v);
  });

  if (chips) {
    chips.addEventListener('click', function (e) {
      if (e.target.tagName === 'BUTTON') ask(e.target.textContent);
    });
  }

  if (reset) reset.addEventListener('click', boot);

  boot();

  window.StudentBot = { respond: respond, db: DB };
})();
