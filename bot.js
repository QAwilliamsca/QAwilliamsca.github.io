// "Ask Christine's bot": fixed questions with written answers. No live AI, no network calls, no key.
(function () {
  var QA = [
    { q: "What have you tested?",
      a: "UI, API and integration tests in Playwright with TypeScript, for almost four years. I automated 180+ manual test cases, built a 70+ test security suite that checks access by user role, and wired the tests into Azure DevOps pipelines." },
    { q: "How do you check AI-written tests?",
      a: "I run every generated test and read it to confirm it checks the intended behavior, not just that it passes. I also break the app on purpose to prove the test fails when it should." },
    { q: "Tell me about LiftLog",
      a: "LiftLog is a live shop-management app that I directed with Claude Code. It is a course project with a fictional shop. Nothing ships unless 249 unit tests, 217 browser checks and a backup-and-restore drill pass, and 24 checks run against the live site after each release." },
    { q: "What is in your Playwright framework?",
      a: "27 UI and API tests with a Page Object Model, environment-based settings, and a GitHub Actions pipeline that runs on every push. The tests run against public practice sites." },
    { q: "What is InsightForge?",
      a: "My capstone for the UC Santa Barbara Applied Generative AI program: a business-intelligence assistant built with LangChain, RAG, OpenAI and Streamlit. pandas does all the calculations and the AI explains them, because early on the model misread a table and gave a confident wrong answer." },
    { q: "What other projects have you worked on?",
      a: "Three main projects, each with a case study above:\n\u2022 LiftLog: a live shop-management app I directed with Claude Code, with 249 unit tests, 217 browser checks and 24 live-site checks.\n\u2022 Playwright framework: 27 UI and API tests, Page Object Model, GitHub Actions.\n\u2022 InsightForge: my RAG business-intelligence assistant.\nClass projects, built with an AI agent under a course playbook:\n\u2022 Campusly: a multi-school management app where admins, teachers, parents and students each see only their own attendance, marks and fees.\n\u2022 Enrolla: an admissions CRM for colleges, with six business rules that each have a test (for example, no oversold seats and no changes to a sent offer).\nPractice work: an evaluation suite that tests InsightForge's answers against a reference set, and a Django enquiry-desk exercise.", link: "#work", linkText: "See the case studies" },
    { q: "Are you open to new roles?",
      a: "Yes. I'm looking for SDET and QA automation roles, remote or hybrid in Northern Virginia." },
    { q: "How can I contact you?",
      a: "Email qawilliamsca@gmail.com, or find me on LinkedIn. The links are in the contact section just below.", link: "#contact" }
  ];
  var log = document.getElementById("bot-log"), qs = document.getElementById("bot-qs");
  if (!log || !qs) return;
  var reduce = window.REDUCE;
  function add(cls, text, link, linkText) {
    var d = document.createElement("div");
    d.className = "bot-msg " + cls;
    d.textContent = text;
    if (link) { d.appendChild(document.createTextNode(" ")); var a = document.createElement("a"); a.href = link; a.textContent = linkText || "Go to contact"; d.appendChild(a); }
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
  }
  function count(q) {
    try {
      if (window.goatcounter && window.goatcounter.count) {
        window.goatcounter.count({ path: "/bot/" + q.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), title: "Bot question: " + q });
      }
    } catch (e) { if (window.console) console.warn("bot count failed", e); }
  }
  add("bot", "Hi, I'm an automated bot with ready answers about Christine's work. Pick a question below.");
  QA.forEach(function (item) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "bot-q"; b.textContent = item.q;
    b.addEventListener("click", function () {
      count(item.q);
      add("me", item.q);
      setTimeout(function () { add("bot", item.a, item.link, item.linkText); }, reduce ? 0 : 250);
    });
    qs.appendChild(b);
  });
})();
