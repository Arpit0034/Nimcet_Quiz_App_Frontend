import { useState, useEffect, useCallback, useMemo, use } from "react";
import * as api from "./services/api";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_QUESTIONS = [
  {
    id: 1,
    questionText: "Which data structure uses LIFO principle?",
    optionA: "Queue",
    optionB: "Stack",
    optionC: "Array",
    optionD: "Linked List",
    correctAnswer: "B",
    manualSolution:
      "Stack follows Last In First Out (LIFO). Queue follows FIFO.",
    subject: "Computer Awareness",
    topic: "Data Structures",
    year: 2022,
    difficulty: "Easy",
    expectedSolveTime: 10,
  },
];

const SUBJECTS = ["Mathematics", "Reasoning", "Computer Awareness"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const YEARS = Array.from({ length: 18 }, (_, i) => 2025 - i);
const SOLVE_TIMES = [10, 30, 60, 90]; // allowed values

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtTime = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const subjectColor = (s) =>
  s === "Mathematics" ? "blue" : s === "Reasoning" ? "green" : "purple";
const subjectBg = (s, dark) => {
  const c = subjectColor(s);
  if (dark)
    return c === "blue"
      ? "bg-blue-900/40 border-blue-700"
      : c === "green"
        ? "bg-green-900/40 border-green-700"
        : "bg-purple-900/40 border-purple-700";
  return c === "blue"
    ? "bg-blue-50 border-blue-200"
    : c === "green"
      ? "bg-green-50 border-green-200"
      : "bg-purple-50 border-purple-200";
};
const subjectText = (s) => {
  const c = subjectColor(s);
  return c === "blue"
    ? "text-blue-600"
    : c === "green"
      ? "text-green-600"
      : "text-purple-600";
};

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-xl shadow-xl text-sm font-medium animate-bounce-in flex items-center gap-2 ${t.type === "success" ? "bg-emerald-500 text-white" : t.type === "error" ? "bg-red-500 text-white" : "bg-blue-500 text-white"}`}
        >
          {t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ"}{" "}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [dark, setDark] = useState(true);
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [testConfig, setTestConfig] = useState(null);
  const [activeTest, setActiveTest] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [currentResult, setCurrentResult] = useState(null);
  const [pageParams, setPageParams] = useState({});
  const [showBugReport, setShowBugReport] = useState(false);

  // Load questions
  useEffect(() => {
    setLoadingQuestions(true);
    api
      .getQuestions()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setQuestions(data);
      })
      .catch(() => setQuestions(MOCK_QUESTIONS))
      .finally(() => setLoadingQuestions(false));
  }, []);

  // Load test history when user logs in and questions are ready
  useEffect(() => {
    if (user?.userId && questions.length > 0) {
      setLoadingHistory(true);
      api
        .getTestHistory(user.userId)
        .then((history) => {
          if (Array.isArray(history)) {
            const enrichedHistory = history.map((attempt) => {
              try {
                const questionIds = JSON.parse(attempt.questionsJson);
                const answers = JSON.parse(attempt.answersJson);
                const attemptQuestions = questionIds
                  .map((id) => questions.find((q) => q.id === id))
                  .filter((q) => q);
                return {
                  ...attempt,
                  questions: attemptQuestions,
                  answers,
                };
              } catch (e) {
                console.error("Failed to parse attempt", attempt, e);
                return attempt;
              }
            });
            setTestHistory(enrichedHistory);
          }
        })
        .catch((err) => console.error("Failed to load test history", err))
        .finally(() => setLoadingHistory(false));
    }
  }, [user, questions]);

  useEffect(() => {
    if (user?.userId) {
      api
        .getBookmarks(user.userId)
        .then((data) => {
          if (Array.isArray(data)) {
            const mapped = data
              .filter((item) => item.question)
              .map((item) => ({
                questionId: item.question.id,
                question: item.question,
              }));
            setBookmarks(mapped);
          }
        })
        .catch((err) => console.error("Failed to load bookmarks", err));
    } else {
      setBookmarks([]);
    }
  }, [user]);

  const toast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);

  const nav = (p, params = {}) => {
    setPage(p);
    setPageParams(params);
    window.scrollTo(0, 0);
  };

  const dc = dark
    ? "bg-gray-950 text-gray-100 min-h-screen"
    : "bg-gray-50 text-gray-900 min-h-screen";

  const ctx = {
    page,
    nav,
    dark,
    setDark,
    user,
    setUser,
    admin,
    setAdmin,
    toast,
    questions,
    setQuestions,
    loadingQuestions,
    loadingHistory,
    testConfig,
    setTestConfig,
    activeTest,
    setActiveTest,
    testHistory,
    setTestHistory,
    bookmarks,
    setBookmarks,
    currentResult,
    setCurrentResult,
    pageParams,
    showBugReport,
    setShowBugReport,
  };

  const renderPage = () => {
    if (page === "home") return <HomePage ctx={ctx} />;
    if (page === "login") return <LoginPage ctx={ctx} />;
    if (page === "register") return <RegisterPage ctx={ctx} />;
    if (page === "configure-test") return <ConfigureTestPage ctx={ctx} />;
    if (page === "test") return <TestPage ctx={ctx} />;
    if (page === "results") return <ResultsPage ctx={ctx} />;
    if (page === "review") return <ReviewPage ctx={ctx} />;
    if (page === "bookmarks") return <BookmarksPage ctx={ctx} />;
    if (page === "analytics") return <AnalyticsPage ctx={ctx} />;
    if (page === "speed-revision") return <SpeedRevisionPage ctx={ctx} />;
    if (page === "full-paper") return <FullPaperPage ctx={ctx} />;
    if (page === "topic-master") return <TopicMasterPage ctx={ctx} />;
    if (page === "admin-login") return <AdminLoginPage ctx={ctx} />;
    if (page === "admin-dashboard") return <AdminDashboard ctx={ctx} />;
    if (page === "admin-add") return <AdminAddQuestion ctx={ctx} />;
    if (page === "admin-manage") return <AdminManageQuestions ctx={ctx} />;
    if (page === "admin-bulk") return <AdminBulkImport ctx={ctx} />;
    if (page === "admin-pdf") return <AdminPDFExtractor ctx={ctx} />;
    if (page === "admin-reports") return <AdminReportsPage ctx={ctx} />;
    if (page === "admin-bug-reports") return <AdminBugReportsPage ctx={ctx} />;
    return <HomePage ctx={ctx} />;
  };

  // Show loading spinner while questions are being fetched
  if (loadingQuestions) {
    return (
      <div className={`${dc} flex items-center justify-center min-h-screen`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={dc} style={{ fontFamily: "'Outfit',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#4b5563; border-radius:3px; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bounceIn { from{opacity:0;transform:scale(0.8)} to{opacity:1;transform:scale(1)} }
        .fade-in { animation: fadeIn 0.35s ease forwards; }
        .animate-bounce-in { animation: bounceIn 0.25s ease forwards; }
        .option-btn { transition: all 0.18s ease; }
        .option-btn:hover { transform: translateX(4px); }
        .q-palette-btn { width:36px;height:36px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.15s; }
      `}</style>
      {!page.startsWith("admin") && page !== "test" && <Navbar ctx={ctx} />}
      {page.startsWith("admin") && <AdminNav ctx={ctx} />}
      <div className="fade-in" key={page}>
        {renderPage()}
      </div>
      <Toast toasts={toasts} />
{showBugReport && <BugReportModal ctx={ctx} />}
{/* Floating bug report button — only for logged in non-admin users */}
{user && !admin && page !== "test" && (
  <button
    onClick={() => setShowBugReport(true)}
    className="fixed bottom-6 right-6 z-40 bg-orange-600 hover:bg-orange-700 text-white rounded-full px-4 py-2.5 text-sm font-bold shadow-lg flex items-center gap-2 transition-all hover:scale-105"
  >
    🐛 Report Bug
  </button>
)}
    </div>
  );
}

// ─── NAVBAR (unchanged) ──────────────────────────────────────────────────────
function Navbar({ ctx }) {
  const { nav, dark, setDark, user, setUser, page, setBookmarks } = ctx;
  const nb = dark
    ? "bg-gray-900/95 border-gray-800"
    : "bg-white/95 border-gray-200";
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <nav className={`sticky top-0 z-40 border-b backdrop-blur-md ${nb}`}>
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <button
          onClick={() => nav("home")}
          className="flex items-center gap-2 font-black text-xl tracking-tight"
        >
          <span className="bg-gradient-to-br from-blue-500 to-purple-600 text-white w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black">
            N
          </span>
          <span>
            NIMCET<span className="text-blue-500">PYQ</span>
          </span>
        </button>
        <div className="hidden md:flex items-center gap-1">
          {[
            ["home", "Home"],
            ["configure-test", "Practice"],
            ["speed-revision", "Speed"],
            ["full-paper", "Full Paper"],
            ["topic-master", "Topics"],
            ["analytics", "Analytics"],
            ["bookmarks", "Bookmarks"],
          ].map(([p, l]) => (
            <button
              key={p}
              onClick={() => nav(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${page === p ? (dark ? "bg-blue-600 text-white" : "bg-blue-600 text-white") : dark ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDark((d) => !d)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-colors ${dark ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-100 hover:bg-gray-200"}`}
          >
            {dark ? "☀️" : "🌙"}
          </button>
          {user ? (
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${dark ? "text-gray-300" : "text-gray-600"}`}
              >
                {user.username}
              </span>
              <button
  onClick={() => ctx.setShowBugReport(true)}
  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${dark ? "bg-orange-600/20 text-orange-400 hover:bg-orange-600/30" : "bg-orange-50 text-orange-600 hover:bg-orange-100"}`}
>
  🐛 Bug
</button>
              <button
                onClick={() => {
                  setUser(null);
                  setBookmarks([]);
                  nav("home");
                }}
                className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => nav("login")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${dark ? "bg-gray-800 hover:bg-gray-700 text-gray-200" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
              >
                Login
              </button>
              <button
                onClick={() => nav("register")}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
              >
                Register
              </button>
            </div>
          )}
          <button
            className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center"
            onClick={() => setMobileOpen((m) => !m)}
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div
          className={`md:hidden border-t px-4 py-3 flex flex-col gap-1 ${dark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"}`}
        >
          {[
            ["home", "Home"],
            ["configure-test", "Practice"],
            ["speed-revision", "Speed Revision"],
            ["full-paper", "Full Paper"],
            ["topic-master", "Topic Master"],
            ["analytics", "Analytics"],
            ["bookmarks", "Bookmarks"],
          ].map(([p, l]) => (
            <button
              key={p}
              onClick={() => {
                nav(p);
                setMobileOpen(false);
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium text-left ${dark ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
            >
              {l}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

function AdminNav({ ctx }) {
  const { nav, admin, setAdmin, dark } = ctx;
  const nb = dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200";
  return (
    <nav className={`sticky top-0 z-40 border-b ${nb}`}>
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-4">
          <span className="font-black text-lg">🛡️ Admin Panel</span>
          {admin && (
            <>
              {[
                ["admin-dashboard", "Dashboard"],
                ["admin-add", "Add Q"],
                ["admin-manage", "Manage"],
                ["admin-bulk", "Bulk Import"],
                ["admin-pdf", "📄 PDF Import"],
                ["admin-reports", "🚨 Reports"],
                ["admin-bug-reports", "🐛 Bugs"],
              ].map(([p, l]) => (
                <button
                  key={p}
                  onClick={() => nav(p)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${dark ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}
                >
                  {l}
                </button>
              ))}
            </>
          )}
        </div>
        {admin && (
          <button
            onClick={() => {
              setAdmin(null);
              localStorage.removeItem("adminToken");
              nav("home");
            }}
            className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ ctx }) {
  const { nav, dark, user, questions, testHistory, bookmarks, loadingHistory } =
    ctx;
  const card = dark
    ? "bg-gray-900 border-gray-800"
    : "bg-white border-gray-200";
  const stats = {
    math: questions.filter((q) => q.subject === "Mathematics").length,
    reason: questions.filter((q) => q.subject === "Reasoning").length,
    comp: questions.filter((q) => q.subject === "Computer Awareness").length,
  };
  const totalAttempted = testHistory.reduce(
    (a, t) => a + (t.correct + t.incorrect),
    0,
  );
  const overallAccuracy = testHistory.length
    ? Math.round(
        (testHistory.reduce(
          (a, t) => a + t.correct / (t.correct + t.incorrect || 1),
          0,
        ) /
          testHistory.length) *
          100,
      )
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <div
        className={`rounded-2xl border p-8 mb-8 relative overflow-hidden ${dark ? "bg-gradient-to-br from-blue-950 to-gray-900 border-blue-900" : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"}`}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-semibold mb-3 uppercase tracking-wider">
            NIMCET 2025 Prep
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3">
            Master NIMCET
            <br />
            <span className="text-blue-500">Previous Year Questions</span>
          </h1>
          <p
            className={`text-lg mb-6 max-w-xl ${dark ? "text-gray-400" : "text-gray-600"}`}
          >
            Practice PYQs from 2008–2025. Get AI-powered explanations in
            Hinglish. Track your progress.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => nav("configure-test")}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base transition-all hover:scale-105 shadow-lg shadow-blue-500/30"
            >
              🚀 Start Practice Test
            </button>
            <button
              onClick={() => nav("full-paper")}
              className={`px-6 py-3 rounded-xl font-bold text-base border transition-all hover:scale-105 ${dark ? "border-gray-700 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"}`}
            >
              📄 Full Year Paper
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {user && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Questions Attempted", val: totalAttempted, icon: "📝" },
            {
              label: "Overall Accuracy",
              val: overallAccuracy + "%",
              icon: "🎯",
            },
            { label: "Tests Taken", val: testHistory.length, icon: "📊" },
            { label: "Bookmarks", val: bookmarks.length, icon: "🔖" },
          ].map((s) => (
            <div key={s.label} className={`border rounded-xl p-4 ${card}`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-black">{s.val}</div>
              <div
                className={`text-xs mt-0.5 ${dark ? "text-gray-500" : "text-gray-500"}`}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subject Cards */}
      <h2 className="text-xl font-bold mb-4">Practice by Subject</h2>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          {
            s: "Mathematics",
            icon: "📐",
            desc: "Algebra, Calculus, Probability & more",
            count: stats.math,
          },
          {
            s: "Reasoning",
            icon: "🧠",
            desc: "Logical, Analytical & Pattern Recognition",
            count: stats.reason,
          },
          {
            s: "Computer Awareness",
            icon: "💻",
            desc: "OS, Networking, Data Structures & more",
            count: stats.comp,
          },
        ].map(({ s, icon, desc, count }) => (
          <button
            key={s}
            onClick={() => nav("configure-test")}
            className={`border rounded-2xl p-6 text-left transition-all hover:scale-105 hover:shadow-lg ${subjectBg(s, dark)} border`}
          >
            <div className="text-3xl mb-3">{icon}</div>
            <div className={`font-bold text-lg mb-1 ${subjectText(s)}`}>
              {s}
            </div>
            <div
              className={`text-sm mb-3 ${dark ? "text-gray-400" : "text-gray-600"}`}
            >
              {desc}
            </div>
            <div className={`text-xs font-semibold ${subjectText(s)}`}>
              {count} Questions Available
            </div>
          </button>
        ))}
      </div>

      {/* Special Modes */}
      <h2 className="text-xl font-bold mb-4">Special Study Modes</h2>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          {
            page: "speed-revision",
            icon: "⚡",
            title: "Speed Revision",
            desc: "Only quick one-liner questions. Perfect for last minute prep.",
            color: "yellow",
          },
          {
            page: "topic-master",
            icon: "🎯",
            title: "Topic Master",
            desc: "Master one topic at a time. See all PYQs on any topic.",
            color: "pink",
          },
          {
            page: "full-paper",
            icon: "📄",
            title: "Full Year Paper",
            desc: "Attempt any year's complete paper with 120min timer.",
            color: "teal",
          },
        ].map((m) => (
          <button
            key={m.page}
            onClick={() => nav(m.page)}
            className={`border rounded-2xl p-6 text-left transition-all hover:scale-105 hover:shadow-lg ${dark ? "bg-gray-900 border-gray-800 hover:border-gray-700" : "bg-white border-gray-200 hover:border-gray-300"}`}
          >
            <div className="text-3xl mb-2">{m.icon}</div>
            <div className="font-bold text-base mb-1">{m.title}</div>
            <div
              className={`text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}
            >
              {m.desc}
            </div>
          </button>
        ))}
      </div>

      {/* Recent Tests */}
      {testHistory.length > 0 && !loadingHistory && (
        <>
          <h2 className="text-xl font-bold mb-4">Recent Tests</h2>
          <div className="flex flex-col gap-3">
            {testHistory
              .slice(-3)
              .reverse()
              .map((t, i) => (
                <div
                  key={i}
                  className={`border rounded-xl p-4 flex items-center justify-between ${card}`}
                >
                  <div>
                    <div className="font-semibold">
                      {t.subject || "Mixed"} Test
                    </div>
                    <div
                      className={`text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {t.correct}✅ {t.incorrect}❌ {t.skipped}⚪ · Score:{" "}
                      {t.score}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      ctx.setCurrentResult(t);
                      nav("results");
                    }}
                    className="text-sm text-blue-400 hover:underline"
                  >
                    View →
                  </button>
                </div>
              ))}
          </div>
        </>
      )}
      {loadingHistory && user && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Admin link */}
      <div className="mt-10 text-center">
        <button
          onClick={() => nav("admin-login")}
          className={`text-xs ${dark ? "text-gray-600 hover:text-gray-400" : "text-gray-400 hover:text-gray-600"}`}
        >
          Admin Panel →
        </button>
      </div>
    </div>
  );
}

// ─── AUTH PAGES (unchanged) ──────────────────────────────────────────────────
function LoginPage({ ctx }) {
  const { nav, dark, setUser, toast } = ctx;
  const [form, setForm] = useState({ username: "", password: "" });
  const card = dark
    ? "bg-gray-900 border-gray-800"
    : "bg-white border-gray-200";
  const inp = dark
    ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
    : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400";
  const submit = async () => {
    if (!form.username || !form.password) {
      toast("Fill all fields", "error");
      return;
    }
    try {
      const res = await api.login(form.username, form.password);
      if (res.token) {
        localStorage.setItem("token", res.token);
        setUser({ username: res.username, role: res.role, userId: res.userId });
        toast("Welcome back, " + res.username + "! 🎉");
        nav("home");
      } else {
        toast(res.message || "Login failed", "error");
      }
    } catch {
      toast("Server error. Is backend running?", "error");
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className={`w-full max-w-md border rounded-2xl p-8 ${card}`}>
        <h2 className="text-2xl font-black mb-6 text-center">
          Welcome Back 👋
        </h2>
        <div className="flex flex-col gap-4">
          <div>
            <label
              className={`text-sm font-medium mb-1.5 block ${dark ? "text-gray-300" : "text-gray-700"}`}
            >
              Username
            </label>
            <input
              className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 ${inp}`}
              placeholder="Enter username"
              value={form.username}
              onChange={(e) =>
                setForm((f) => ({ ...f, username: e.target.value }))
              }
            />
          </div>
          <div>
            <label
              className={`text-sm font-medium mb-1.5 block ${dark ? "text-gray-300" : "text-gray-700"}`}
            >
              Password
            </label>
            <input
              type="password"
              className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 ${inp}`}
              placeholder="Enter password"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
            />
          </div>
          <button
            onClick={submit}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
          >
            Login
          </button>
        </div>
        <p
          className={`text-center text-sm mt-4 ${dark ? "text-gray-400" : "text-gray-500"}`}
        >
          Don't have an account?{" "}
          <button
            onClick={() => nav("register")}
            className="text-blue-400 hover:underline font-medium"
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
}

function RegisterPage({ ctx }) {
  const { nav, dark, setUser, toast } = ctx;
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });
  const card = dark
    ? "bg-gray-900 border-gray-800"
    : "bg-white border-gray-200";
  const inp = dark
    ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
    : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400";
  const submit = async () => {
    if (!form.username || !form.email || !form.password) {
      toast("Fill all fields", "error");
      return;
    }
    if (form.password !== form.confirm) {
      toast("Passwords don't match", "error");
      return;
    }
    try {
      const res = await api.register(form.username, form.email, form.password);
      if (res.token) {
        localStorage.setItem("token", res.token);
        setUser({ username: res.username, role: res.role ,userId: res.userId });
        toast("Account created! Welcome " + res.username + " 🎉");
        nav("home");
      } else {
        toast(res.message || "Registration failed", "error");
      }
    } catch {
      toast("Server error. Is backend running?", "error");
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className={`w-full max-w-md border rounded-2xl p-8 ${card}`}>
        <h2 className="text-2xl font-black mb-6 text-center">
          Create Account 🚀
        </h2>
        <div className="flex flex-col gap-4">
          {[
            ["username", "Username", "text"],
            ["email", "Email", "email"],
            ["password", "Password", "password"],
            ["confirm", "Confirm Password", "password"],
          ].map(([k, l, t]) => (
            <div key={k}>
              <label
                className={`text-sm font-medium mb-1.5 block ${dark ? "text-gray-300" : "text-gray-700"}`}
              >
                {l}
              </label>
              <input
                type={t}
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 ${inp}`}
                placeholder={`Enter ${l.toLowerCase()}`}
                value={form[k]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [k]: e.target.value }))
                }
              />
            </div>
          ))}
          <button
            onClick={submit}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
          >
            Create Account
          </button>
        </div>
        <p
          className={`text-center text-sm mt-4 ${dark ? "text-gray-400" : "text-gray-500"}`}
        >
          Already have an account?{" "}
          <button
            onClick={() => nav("login")}
            className="text-blue-400 hover:underline font-medium"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── CONFIGURE TEST (unchanged) ──────────────────────────────────────────────
function ConfigureTestPage({ ctx }) {
  const { nav, dark, user, questions, setActiveTest, toast } = ctx;
  const [config, setConfig] = useState({
    subject: "All",
    topic: "All",
    year: "All",
    difficulty: "All",
    solveTime: "All",
    count: 20,
    mode: "Random Shuffle",
  });
  const card = dark
    ? "bg-gray-900 border-gray-800"
    : "bg-white border-gray-200";
  const inp = dark
    ? "bg-gray-800 border-gray-700 text-gray-100"
    : "bg-gray-50 border-gray-300 text-gray-900";
  const sel = (k, v) => setConfig((c) => ({ ...c, [k]: v }));

  const topics = [
    "All",
    ...new Set(
      questions
        .filter((q) => config.subject === "All" || q.subject === config.subject)
        .map((q) => q.topic),
    ),
  ];

  const startTest = () => {
  if (!user) {
    toast("Please login to start a test", "error");
    nav("login");
    return;
  }
  let filtered = questions;
  if (config.subject !== "All")
    filtered = filtered.filter((q) => q.subject === config.subject);
  if (config.topic !== "All")
    filtered = filtered.filter((q) => q.topic === config.topic);
  if (config.year !== "All")
    filtered = filtered.filter((q) => q.year === parseInt(config.year));
  if (config.difficulty !== "All")
    filtered = filtered.filter((q) => q.difficulty === config.difficulty);
  if (config.solveTime !== "All")
    filtered = filtered.filter(
      (q) => q.expectedSolveTime === parseInt(config.solveTime),
    );
  if (filtered.length === 0) {
    toast("No questions match your filters. Try different criteria.", "error");
    return;
  }

  // Step 1: Always shuffle the entire pool first (Fisher-Yates)
  let pool = [...filtered];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Step 2: Slice BEFORE sorting — different questions every time
  const sliced = pool.slice(0, Math.min(config.count, pool.length));

  // Step 3: Sort the sliced subset by mode
  let selected;
  if (config.mode === "Random Shuffle") {
    selected = sliced;
  } else if (config.mode === "Year-wise") {
    selected = sliced.sort((a, b) => a.year - b.year);
  } else if (config.mode === "Topic-wise") {
    selected = sliced.sort((a, b) => a.topic.localeCompare(b.topic));
  } else if (config.mode === "Difficulty-wise") {
    const order = { Easy: 1, Medium: 2, Hard: 3 };
    selected = sliced.sort((a, b) => order[a.difficulty] - order[b.difficulty]);
  } else {
    selected = sliced;
  }

  setActiveTest({
    questions: selected,
    answers: {},
    marked: new Set(),
    config,
    startTime: Date.now(),
    timeLimit: config.count * 90,
  });
  nav("test");
};

  const BtnGroup = ({ label, options, field }) => (
    <div>
      <label
        className={`text-sm font-semibold mb-2 block ${dark ? "text-gray-300" : "text-gray-600"}`}
      >
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => sel(field, o)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${config[field] === o ? (dark ? "bg-blue-600 border-blue-600 text-white" : "bg-blue-600 border-blue-600 text-white") : dark ? "border-gray-700 text-gray-300 hover:border-gray-600" : "border-gray-300 text-gray-700 hover:border-gray-400"}`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );

  const solveTimeOptions = useMemo(() => {
    const times = [...new Set(questions.map((q) => q.expectedSolveTime))];
    return times.filter((t) => t != null).sort((a, b) => a - b);
  }, [questions]);

  const minSolveTime = solveTimeOptions.length
    ? Math.min(...solveTimeOptions)
    : 0;
  const maxSolveTime = solveTimeOptions.length
    ? Math.max(...solveTimeOptions)
    : 300;
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black mb-2">Configure Test ⚙️</h1>
      <p className={`mb-8 ${dark ? "text-gray-400" : "text-gray-500"}`}>
        Customize your practice session
      </p>
      <div className={`border rounded-2xl p-6 flex flex-col gap-6 ${card}`}>
        <BtnGroup
          label="Subject"
          options={["All", "Mathematics", "Reasoning", "Computer Awareness"]}
          field="subject"
        />
        <div>
          <label
            className={`text-sm font-semibold mb-2 block ${dark ? "text-gray-300" : "text-gray-600"}`}
          >
            Topic
          </label>
          <select
            value={config.topic}
            onChange={(e) => sel("topic", e.target.value)}
            className={`border rounded-xl px-3 py-2 text-sm outline-none w-full ${inp}`}
          >
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className={`text-sm font-semibold mb-2 block ${dark ? "text-gray-300" : "text-gray-600"}`}
          >
            Year
          </label>
          <select
            value={config.year}
            onChange={(e) => sel("year", e.target.value)}
            className={`border rounded-xl px-3 py-2 text-sm outline-none w-full ${inp}`}
          >
            <option value="All">All Years</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <BtnGroup
          label="Difficulty"
          options={["All", "Easy", "Medium", "Hard"]}
          field="difficulty"
        />
        <div>
          <label
            className={`text-sm font-semibold mb-2 block ${dark ? "text-gray-300" : "text-gray-600"}`}
          >
            Question Type (Filter by expected solve time)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            <button
              onClick={() => sel("solveTime", "All")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all text-center ${
                config.solveTime === "All"
                  ? dark
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-blue-600 border-blue-600 text-white"
                  : dark
                    ? "border-gray-700 text-gray-300 hover:border-gray-600"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
              }`}
            >
              All Types
            </button>
            {solveTimeOptions.map((val) => (
              <button
                key={val}
                onClick={() => sel("solveTime", val.toString())}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all text-center ${
                  config.solveTime === val.toString()
                    ? dark
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-blue-600 border-blue-600 text-white"
                    : dark
                      ? "border-gray-700 text-gray-300 hover:border-gray-600"
                      : "border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                {val}s
              </button>
            ))}
          </div>
          <div className="mt-2">
            <label
              className={`text-sm font-semibold mb-2 block ${dark ? "text-gray-300" : "text-gray-600"}`}
            >
              Or select exact time (seconds):
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={minSolveTime}
                max={maxSolveTime}
                step="1"
                value={
                  config.solveTime === "All" ? 0 : parseInt(config.solveTime)
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "0") {
                    sel("solveTime", "All");
                  } else {
                    const numeric = parseInt(val);
                    const nearest = solveTimeOptions.reduce((prev, curr) =>
                      Math.abs(curr - numeric) < Math.abs(prev - numeric)
                        ? curr
                        : prev,
                    );
                    sel("solveTime", nearest.toString());
                  }
                }}
                className="flex-1"
                list="solveTimes"
              />
              <span
                className={`text-sm ${dark ? "text-gray-300" : "text-gray-600"}`}
              >
                {config.solveTime === "All"
                  ? "All types"
                  : `${config.solveTime}s`}
              </span>
            </div>
            <datalist id="solveTimes">
              {solveTimeOptions.map((val) => (
                <option key={val} value={val} label={`${val}s`} />
              ))}
            </datalist>
          </div>
        </div>
        <BtnGroup
          label="Number of Questions"
          options={[10, 20, 30, 40, 50]}
          field="count"
        />
        <BtnGroup
          label="Mode"
          options={[
            "Random Shuffle",
            "Year-wise",
            "Topic-wise",
            "Difficulty-wise",
          ]}
          field="mode"
        />
        <button
          onClick={startTest}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-black text-lg transition-all hover:scale-[1.02] shadow-lg shadow-blue-500/25 mt-2"
        >
          🚀 Start Test
        </button>
      </div>
    </div>
  );
}

// ─── TEST PAGE (unchanged except error handling) ─────────────────────────────
function TestPage({ ctx }) {
  const {
    dark,
    activeTest,
    setActiveTest,
    setTestHistory,
    setCurrentResult,
    nav,
    toast,
    user,
  } = ctx;
  const [current, setCurrent] = useState(0);
  const [showSubmit, setShowSubmit] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hint, setHint] = useState(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(activeTest?.timeLimit || 1800);

  useEffect(() => {
    if (!activeTest) {
      nav("home");
      return;
    }
    const t = setInterval(
      () =>
        setTimeLeft((l) => {
          if (l <= 1) {
            clearInterval(t);
            submitTest();
            return 0;
          }
          return l - 1;
        }),
      1000,
    );
    return () => clearInterval(t);
  }, []);

  if (!activeTest) return null;

  const { questions, answers, marked } = activeTest;
  const q = questions[current];
  const totalQ = questions.length;

  const selectAnswer = (opt) => {
    setActiveTest((t) => ({ ...t, answers: { ...t.answers, [q.id]: opt } }));
  };

  const toggleMark = () => {
    setActiveTest((t) => {
      const m = new Set(t.marked);
      m.has(q.id) ? m.delete(q.id) : m.add(q.id);
      return { ...t, marked: m };
    });
  };

  const getHint = async () => {
    if (hintsUsed >= 3) {
      toast("Max 3 hints per test!", "error");
      return;
    }
    setHintLoading(true);
    setHint(null);
    try {
      const res = await api.getAIHint(q.id);
      setHint(
        res.hint ||
          "Think about the fundamental concept behind this type of question.",
      );
      setHintsUsed((h) => h + 1);
    } catch {
      setHint(
        "💡 Focus on the key concept. Eliminate clearly wrong options first, then work through the remaining ones carefully.",
      );
      setHintsUsed((h) => h + 1);
    }
    setHintLoading(false);
  };

  const submitTest = () => {
    const timeTaken = activeTest.timeLimit - timeLeft;
    // Save to backend if user logged in
    if (user?.userId) {
      api
        .submitTest({
          userId: user.userId,
          questionIds: questions.map((q) => q.id),
          answers: answers,
          timeTaken: timeTaken,
        })
        .catch((err) => {
          console.error("Failed to submit test to backend", err);
          toast("Test saved locally but could not sync with server", "error");
        });
    }
    let correct = 0,
      incorrect = 0,
      skipped = 0;
    questions.forEach((q) => {
      const a = answers[q.id];
      if (!a) skipped++;
      else if (a === q.correctAnswer) correct++;
      else incorrect++;
    });
    const score = correct * 3 - incorrect;
    const result = {
      questions,
      answers,
      correct,
      incorrect,
      skipped,
      score,
      timeTaken,
      config: activeTest.config,
      id: Date.now(),
    };
    setCurrentResult(result);
    setTestHistory((h) => [...h, result]);
    setActiveTest(null);
    nav("results");
  };

  const answered = Object.keys(answers).length;
  const progress = ((current + 1) / totalQ) * 100;

  const optColors = (opt) => {
    const sel = answers[q.id] === opt;
    if (sel)
      return dark
        ? "bg-blue-600 border-blue-500 text-white"
        : "bg-blue-600 border-blue-600 text-white";
    return dark
      ? "bg-gray-800 border-gray-700 text-gray-200 hover:border-blue-500"
      : "bg-white border-gray-300 text-gray-800 hover:border-blue-400";
  };

  return (
    <div className={`min-h-screen ${dark ? "bg-gray-950" : "bg-gray-50"}`}>
      {/* Top bar */}
      <div
        className={`sticky top-0 z-30 border-b px-4 py-3 flex items-center justify-between ${dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
      >
        <div className="font-bold text-sm">
          Q {current + 1} of {totalQ}
        </div>
        <div
          className={`font-mono font-bold text-lg ${timeLeft < 300 ? "text-red-400" : "text-green-400"}`}
        >
          {fmtTime(timeLeft)}
        </div>
        <div className="flex gap-2">
          <span
            className={`text-xs px-2 py-1 rounded-lg ${dark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"}`}
          >
            {answered}/{totalQ} done
          </span>
          <button
            onClick={() => setShowSubmit(true)}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold"
          >
            Submit
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className={`h-1 ${dark ? "bg-gray-800" : "bg-gray-200"}`}>
        <div
          className="h-1 bg-blue-500 transition-all duration-300"
          style={{ width: progress + "%" }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {/* Main Question Area */}
        <div className="flex-1 min-w-0">
          <div
            className={`border rounded-2xl p-6 mb-4 ${dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
          >
            <div className="flex flex-wrap gap-2 mb-4">
              <span
                className={`text-xs px-2 py-1 rounded-full font-semibold ${subjectText(q.subject)} ${dark ? "bg-gray-800" : "bg-gray-100"}`}
              >
                {q.subject}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${dark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"}`}
              >
                {q.topic}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${dark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"}`}
              >
                NIMCET {q.year}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${q.difficulty === "Easy" ? "bg-green-500/20 text-green-400" : q.difficulty === "Medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}
              >
                {q.difficulty}
              </span>
            </div>
            <p className="text-base font-medium leading-relaxed mb-6">
              {q.questionText}
            </p>
            <div className="flex flex-col gap-3">
              {[
                ["A", q.optionA],
                ["B", q.optionB],
                ["C", q.optionC],
                ["D", q.optionD],
              ].map(([opt, text]) => (
                <button
                  key={opt}
                  onClick={() => selectAnswer(opt)}
                  className={`option-btn w-full text-left border rounded-xl px-5 py-3.5 flex items-start gap-3 ${optColors(opt)}`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${answers[q.id] === opt ? "bg-white/20" : "bg-gray-500/20"}`}
                  >
                    {opt}
                  </span>
                  <span className="text-sm leading-relaxed">{text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Hint */}
          <div
            className={`border rounded-xl p-4 mb-4 ${dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-sm font-semibold ${dark ? "text-gray-300" : "text-gray-700"}`}
              >
                💡 Need a Hint?
              </span>
              <span
                className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}
              >
                {3 - hintsUsed} hints remaining
              </span>
            </div>
            {hint && (
              <p
                className={`text-sm p-3 rounded-lg mb-2 ${dark ? "bg-blue-900/30 text-blue-300 border border-blue-800" : "bg-blue-50 text-blue-700 border border-blue-200"}`}
              >
                {hint}
              </p>
            )}
            <button
              onClick={getHint}
              disabled={hintLoading || hintsUsed >= 3}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${hintsUsed >= 3 ? "opacity-40 cursor-not-allowed" : ""} ${dark ? "bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30" : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"} border ${dark ? "border-yellow-800" : "border-yellow-200"}`}
            >
              {hintLoading ? "Loading hint..." : "Get Hint (AI)"}
            </button>
          </div>

          {/* Navigation */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
              className={`px-4 py-2 rounded-xl font-medium text-sm border disabled:opacity-40 ${dark ? "border-gray-700 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"}`}
            >
              ← Previous
            </button>
            <button
              onClick={toggleMark}
              className={`px-4 py-2 rounded-xl font-medium text-sm border ${marked.has(q.id) ? "bg-orange-500/20 text-orange-400 border-orange-700" : ""}  ${dark ? "border-gray-700 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"}`}
            >
              {marked.has(q.id) ? "★ Marked" : "☆ Mark for Review"}
            </button>
            <button
              onClick={() =>
                setActiveTest((t) => ({
                  ...t,
                  answers: { ...t.answers, [q.id]: undefined },
                }))
              }
              className={`px-4 py-2 rounded-xl font-medium text-sm border ${dark ? "border-gray-700 hover:bg-gray-800 text-gray-400" : "border-gray-300 hover:bg-gray-100 text-gray-500"}`}
            >
              Clear
            </button>
            <button
              onClick={() => setCurrent((c) => Math.min(totalQ - 1, c + 1))}
              disabled={current === totalQ - 1}
              className={`px-4 py-2 rounded-xl font-medium text-sm border disabled:opacity-40 ml-auto ${dark ? "border-gray-700 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"}`}
            >
              Next →
            </button>
          </div>
        </div>

        {/* Question Palette */}
        <div className={`hidden md:block w-60 flex-shrink-0`}>
          <div
            className={`border rounded-2xl p-4 sticky top-24 ${dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
          >
            <h3 className="font-bold text-sm mb-3">Question Palette</h3>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {questions.map((qu, i) => {
                const ans = answers[qu.id];
                const mk = marked.has(qu.id);
                let bg = dark
                  ? "bg-gray-800 text-gray-400"
                  : "bg-gray-100 text-gray-500";
                if (ans) bg = "bg-green-600 text-white";
                if (mk) bg = "bg-orange-500 text-white";
                return (
                  <button
                    key={qu.id}
                    onClick={() => setCurrent(i)}
                    className={`q-palette-btn ${bg} ${i === current ? "ring-2 ring-blue-400" : ""}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-green-600 inline-block" />
                <span className={dark ? "text-gray-400" : "text-gray-500"}>
                  Answered
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-orange-500 inline-block" />
                <span className={dark ? "text-gray-400" : "text-gray-500"}>
                  Marked
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-gray-600 inline-block" />
                <span className={dark ? "text-gray-400" : "text-gray-500"}>
                  Unanswered
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmit && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div
            className={`border rounded-2xl p-6 w-full max-w-sm ${dark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}
          >
            <h3 className="font-black text-lg mb-2">Submit Test?</h3>
            <p
              className={`text-sm mb-4 ${dark ? "text-gray-400" : "text-gray-600"}`}
            >
              Answered: {answered} | Unanswered: {totalQ - answered} | Marked:{" "}
              {marked.size}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmit(false)}
                className={`flex-1 py-2.5 rounded-xl border font-semibold text-sm ${dark ? "border-gray-700 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"}`}
              >
                Cancel
              </button>
              <button
                onClick={submitTest}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm"
              >
                Submit ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RESULTS PAGE (unchanged) ─────────────────────────────────────────────────
function ResultsPage({ ctx }) {
  const { dark, nav, currentResult } = ctx;
  if (!currentResult) {
    nav("home");
    return null;
  }
  const { questions, answers, correct, incorrect, skipped, score } =
    currentResult;
  const total = questions.length;
  const accuracy = Math.round((correct / total) * 100) || 0;
  const card = dark
    ? "bg-gray-900 border-gray-800"
    : "bg-white border-gray-200";

  const subjectStats = SUBJECTS.map((s) => {
    const qs = questions.filter((q) => q.subject === s);
    const c = qs.filter((q) => answers[q.id] === q.correctAnswer).length;
    return { s, total: qs.length, correct: c };
  }).filter((x) => x.total > 0);

  const msgs = [
    "Great effort! Keep practicing! 💪",
    "Almost there! A little more focus! 🎯",
    "Excellent work! You're on fire! 🔥",
    "Good attempt! Review your weak areas 📚",
  ];
  const msg = score > total * 2 ? msgs[2] : score > total ? msgs[0] : msgs[3];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div
        className={`border rounded-2xl p-6 mb-6 text-center ${dark ? "bg-gradient-to-br from-blue-950 to-gray-900 border-blue-900" : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"}`}
      >
        <div className="text-5xl mb-2">🎯</div>
        <h1 className="text-3xl font-black mb-1">Test Complete!</h1>
        <p className={`mb-4 ${dark ? "text-gray-400" : "text-gray-600"}`}>
          {msg}
        </p>
        <div className="text-6xl font-black text-blue-500 mb-1">{score}</div>
        <div className={`text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>
          Total Score (NIMCET: +3/−1/0)
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Correct",
            val: correct,
            color: "text-green-400",
            bg: dark
              ? "bg-green-900/30 border-green-800"
              : "bg-green-50 border-green-200",
          },
          {
            label: "Incorrect",
            val: incorrect,
            color: "text-red-400",
            bg: dark
              ? "bg-red-900/30 border-red-800"
              : "bg-red-50 border-red-200",
          },
          {
            label: "Skipped",
            val: skipped,
            color: "text-gray-400",
            bg: dark
              ? "bg-gray-800 border-gray-700"
              : "bg-gray-50 border-gray-200",
          },
          {
            label: "Accuracy",
            val: accuracy + "%",
            color: "text-blue-400",
            bg: dark
              ? "bg-blue-900/30 border-blue-800"
              : "bg-blue-50 border-blue-200",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`border rounded-xl p-4 text-center ${s.bg}`}
          >
            <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
            <div
              className={`text-xs mt-0.5 ${dark ? "text-gray-400" : "text-gray-500"}`}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className={`border rounded-2xl p-5 mb-6 ${card}`}>
        <h3 className="font-bold mb-4">Subject-wise Performance</h3>
        {subjectStats.map(({ s, total: t, correct: c }) => (
          <div key={s} className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className={subjectText(s)}>{s}</span>
              <span className={dark ? "text-gray-400" : "text-gray-600"}>
                {c}/{t}
              </span>
            </div>
            <div
              className={`h-2.5 rounded-full ${dark ? "bg-gray-800" : "bg-gray-200"}`}
            >
              <div
                className={`h-2.5 rounded-full ${subjectColor(s) === "blue" ? "bg-blue-500" : subjectColor(s) === "green" ? "bg-green-500" : "bg-purple-500"}`}
                style={{ width: `${(c / t) * 100 || 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => nav("review")}
          className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
        >
          📖 Review Solutions + AI
        </button>
        <button
          onClick={() => nav("configure-test")}
          className={`flex-1 py-3 border rounded-xl font-bold transition-colors ${dark ? "border-gray-700 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"}`}
        >
          🔄 New Test
        </button>
      </div>
    </div>
  );
}

// ─── REVIEW PAGE WITH AI (unchanged) ─────────────────────────────────────────
function ReviewPage({ ctx }) {
  const { dark, currentResult, bookmarks, setBookmarks, toast, user } = ctx;
  const [current, setCurrent] = useState(0);
  const [aiExplain, setAiExplain] = useState({});
  const [aiSimilar, setAiSimilar] = useState({});
  const [loadingExplain, setLoadingExplain] = useState({});
  const [loadingSimilar, setLoadingSimilar] = useState({});
  const [similarAnswer, setSimilarAnswer] = useState({});
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportNote, setReportNote] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reported, setReported] = useState({});

  if (!currentResult) return null;
  const { questions, answers } = currentResult;
  const q = questions[current];
  const userAns = answers[q.id];
  const isCorrect = userAns === q.correctAnswer;
  const card = dark
    ? "bg-gray-900 border-gray-800"
    : "bg-white border-gray-200";

  const optStyle = (opt) => {
    if (opt === q.correctAnswer)
      return dark
        ? "bg-green-900/40 border-green-600 text-green-300"
        : "bg-green-50 border-green-500 text-green-800";
    if (opt === userAns && opt !== q.correctAnswer)
      return dark
        ? "bg-red-900/40 border-red-600 text-red-300"
        : "bg-red-50 border-red-500 text-red-800";
    return dark
      ? "bg-gray-800 border-gray-700 text-gray-300"
      : "bg-gray-50 border-gray-200 text-gray-700";
  };

  const getExplain = async () => {
    if (aiExplain[q.id]) return;
    setLoadingExplain((l) => ({ ...l, [q.id]: true }));
    try {
      const res = await api.getAIExplain(q.id);
      setAiExplain((e) => ({
        ...e,
        [q.id]: res.explanation || "Unable to load explanation.",
      }));
    } catch (err) {
      setAiExplain((e) => ({
        ...e,
        [q.id]: `✅ Correct answer hai ${q.correctAnswer}! \n\n${q.manualSolution}\n\nYaad raho: ${q.topic} ka yeh ek important concept hai. Practice karte raho!`,
      }));
    }
    setLoadingExplain((l) => ({ ...l, [q.id]: false }));
  };

  const getSimilar = async () => {
    if (aiSimilar[q.id]) return;
    setLoadingSimilar((l) => ({ ...l, [q.id]: true }));
    try {
      const res = await api.getAISimilar(q.id);
      const parsed = JSON.parse(res.question);
      setAiSimilar((s) => ({ ...s, [q.id]: parsed }));
    } catch (err) {
      setAiSimilar((s) => ({
        ...s,
        [q.id]: {
          question_text: "If A={2,3,5,7} and B={1,3,5,9}, what is A∩B?",
          option_a: "{3,5}",
          option_b: "{2,7}",
          option_c: "{1,9}",
          option_d: "{1,2,3}",
          correct_answer: "A",
          solution: "Common elements of A and B are 3 and 5. So A∩B = {3,5}",
        },
      }));
    }
    setLoadingSimilar((l) => ({ ...l, [q.id]: false }));
  };

  const isBookmarked = bookmarks.some((b) => b.questionId === q.id);
  const toggleBookmark = async () => {
    if (!user) {
      toast("Login to bookmark", "error");
      return;
    }
    if (isBookmarked) {
      try {
        await api.removeBookmark(user.userId, q.id);
        setBookmarks((b) => b.filter((x) => x.questionId !== q.id));
        toast("Bookmark removed");
      } catch {
        toast("Failed to remove bookmark", "error");
      }
    } else {
      try {
        await api.addBookmark(user.userId, q.id);
        setBookmarks((b) => [...b, { questionId: q.id, question: q }]);
        toast("Bookmarked! 🔖");
      } catch {
        toast("Failed to add bookmark", "error");
      }
    }
  };

  const sim = aiSimilar[q.id];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black">Solution Review 📖</h1>
        <span className={`text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>
          Q{current + 1} of {questions.length}
        </span>
      </div>

      {/* Question */}
      <div className={`border rounded-2xl p-6 mb-4 ${card}`}>
        <div className="flex flex-wrap gap-2 mb-3">
          <span
            className={`text-xs px-2 py-1 rounded-full font-semibold ${subjectText(q.subject)} ${dark ? "bg-gray-800" : "bg-gray-100"}`}
          >
            {q.subject}
          </span>
          <span
            className={`text-xs px-2 py-1 rounded-full ${dark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"}`}
          >
            {q.topic} · {q.year}
          </span>
          <span
            className={`text-xs px-2 py-1 rounded-full ml-auto ${isCorrect ? "bg-green-500/20 text-green-400" : "text-red-400 bg-red-500/20"}`}
          >
            {isCorrect ? "✅ Correct" : "❌ Wrong"}
          </span>
        </div>
        <p className="font-medium text-base leading-relaxed mb-5">
          {q.questionText}
        </p>
        <div className="flex flex-col gap-2">
          {[
            ["A", q.optionA],
            ["B", q.optionB],
            ["C", q.optionC],
            ["D", q.optionD],
          ].map(([opt, text]) => (
            <div
              key={opt}
              className={`border rounded-xl px-4 py-3 flex items-start gap-3 ${optStyle(opt)}`}
            >
              <span className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs flex-shrink-0 bg-current/10">
                {opt}
              </span>
              <span className="text-sm">
                {text}
                {opt === q.correctAnswer && (
                  <span className="ml-2 text-green-500 font-bold">
                    ← Correct
                  </span>
                )}
                {opt === userAns && opt !== q.correctAnswer && (
                  <span className="ml-2 text-red-500 font-bold">
                    ← Your Answer
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Solution */}
      <div
        className={`border rounded-2xl p-5 mb-4 ${dark ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"}`}
      >
        <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
          📝 Solution
        </h3>
        <p
          className={`text-sm leading-relaxed ${dark ? "text-gray-300" : "text-gray-700"}`}
        >
          {q.manualSolution}
        </p>
      </div>

      {/* AI Explain */}
      <div className={`border rounded-2xl p-5 mb-4 ${card}`}>
        <h3 className="font-bold text-sm mb-3">🤖 AI Explanation (Hinglish)</h3>
        {aiExplain[q.id] ? (
          <p
            className={`text-sm leading-relaxed p-4 rounded-xl ${dark ? "bg-blue-900/20 text-blue-200 border border-blue-800" : "bg-blue-50 text-blue-800 border border-blue-200"}`}
          >
            {aiExplain[q.id]}
          </p>
        ) : (
          <button
            onClick={getExplain}
            disabled={loadingExplain[q.id]}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 ${dark ? "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-800" : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"}`}
          >
            {loadingExplain[q.id] ? (
              <>
                <span className="animate-spin">⟳</span> Generating...
              </>
            ) : (
              "🤖 Ask AI to Explain"
            )}
          </button>
        )}
      </div>

      {/* Similar Question */}
      <div className={`border rounded-2xl p-5 mb-4 ${card}`}>
        <h3 className="font-bold text-sm mb-3">🔄 Practice Similar Question</h3>
        {sim ? (
          <div>
            <p className="font-medium text-sm mb-3">{sim.question_text}</p>
            <div className="flex flex-col gap-2 mb-3">
              {[
                ["A", sim.option_a],
                ["B", sim.option_b],
                ["C", sim.option_c],
                ["D", sim.option_d],
              ].map(([opt, text]) => (
                <button
                  key={opt}
                  onClick={() =>
                    setSimilarAnswer((a) => ({ ...a, [q.id]: opt }))
                  }
                  className={`text-left border rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm transition-all ${similarAnswer[q.id] === opt ? (opt === sim.correct_answer ? (dark ? "bg-green-900/40 border-green-600" : "bg-green-50 border-green-500") : dark ? "bg-red-900/40 border-red-600" : "bg-red-50 border-red-500") : dark ? "border-gray-700 hover:border-gray-600" : "border-gray-300 hover:border-gray-400"}`}
                >
                  <span className="font-bold">{opt}.</span> {text}
                  {similarAnswer[q.id] && opt === sim.correct_answer && (
                    <span className="ml-auto text-green-400 font-bold text-xs">
                      ✓ Correct
                    </span>
                  )}
                </button>
              ))}
            </div>
            {similarAnswer[q.id] && (
              <p
                className={`text-sm p-3 rounded-lg ${dark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700"}`}
              >
                💡 {sim.solution}
              </p>
            )}
          </div>
        ) : (
          <button
            onClick={getSimilar}
            disabled={loadingSimilar[q.id]}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 ${dark ? "bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border border-purple-800" : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"}`}
          >
            {loadingSimilar[q.id] ? (
              <>
                <span className="animate-spin">⟳</span> Generating...
              </>
            ) : (
              "🔄 Generate Similar Question"
            )}
          </button>
        )}
      </div>

      {/* Nav */}
      <div className="flex gap-3 items-center">
        <button
          onClick={() => setShowReport(true)}
          disabled={reported[q.id]}
          className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
            reported[q.id]
              ? dark
                ? "border-gray-700 text-gray-600 cursor-not-allowed"
                : "border-gray-200 text-gray-400 cursor-not-allowed"
              : dark
                ? "border-red-800 text-red-400 hover:bg-red-900/20"
                : "border-red-300 text-red-600 hover:bg-red-50"
          }`}
        >
          {reported[q.id] ? "✓ Reported" : "🚩 Report"}
        </button>
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className={`px-4 py-2 rounded-xl border text-sm font-medium disabled:opacity-40 ${dark ? "border-gray-700 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"}`}
        >
          ← Prev
        </button>
        <button
          onClick={toggleBookmark}
          className={`px-4 py-2 rounded-xl border text-sm font-medium ${isBookmarked ? (dark ? "bg-yellow-600/20 text-yellow-400 border-yellow-700" : "bg-yellow-50 text-yellow-700 border-yellow-300") : dark ? "border-gray-700 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"}`}
        >
          {isBookmarked ? "🔖 Saved" : "🔖 Bookmark"}
        </button>
        <button
          onClick={() =>
            setCurrent((c) => Math.min(questions.length - 1, c + 1))
          }
          disabled={current === questions.length - 1}
          className={`px-4 py-2 rounded-xl border text-sm font-medium disabled:opacity-40 ml-auto ${dark ? "border-gray-700 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"}`}
        >
          Next →
        </button>
      </div>
      {showReport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div
            className={`border rounded-2xl p-6 w-full max-w-md ${dark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}
          >
            <h3 className="font-black text-lg mb-1">🚩 Report Question</h3>
            <p
              className={`text-sm mb-4 ${dark ? "text-gray-400" : "text-gray-500"}`}
            >
              Help us improve the question bank by flagging issues.
            </p>
            <div className="flex flex-col gap-3">
              <div>
                <label
                  className={`text-xs font-semibold mb-2 block ${dark ? "text-gray-300" : "text-gray-600"}`}
                >
                  Reason *
                </label>
                <div className="flex flex-col gap-2">
                  {[
                    "Wrong correct answer",
                    "Incorrect question text",
                    "Wrong/missing options",
                    "Poor/wrong solution",
                    "Duplicate question",
                    "Other",
                  ].map((r) => (
                    <button
                      key={r}
                      onClick={() => setReportReason(r)}
                      className={`text-left px-3 py-2 rounded-xl text-sm border transition-all ${
                        reportReason === r
                          ? dark
                            ? "bg-red-600/20 border-red-600 text-red-300"
                            : "bg-red-50 border-red-500 text-red-700"
                          : dark
                            ? "border-gray-700 text-gray-300 hover:border-gray-600"
                            : "border-gray-300 text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label
                  className={`text-xs font-semibold mb-1.5 block ${dark ? "text-gray-300" : "text-gray-600"}`}
                >
                  Additional note (optional)
                </label>
                <textarea
                  rows={2}
                  className={`w-full border rounded-xl px-3 py-2 text-sm outline-none resize-none ${
                    dark
                      ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
                      : "bg-gray-50 border-gray-300 text-gray-900"
                  }`}
                  placeholder="e.g. The correct answer should be C because..."
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowReport(false);
                  setReportReason("");
                  setReportNote("");
                }}
                className={`flex-1 py-2.5 border rounded-xl text-sm font-semibold ${dark ? "border-gray-700 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"}`}
              >
                Cancel
              </button>
              <button
                disabled={!reportReason || reportSubmitting}
                onClick={async () => {
                  setReportSubmitting(true);
                  try {
                    await api.reportQuestion(
                      q.id,
                      user?.userId,
                      user?.username,
                      reportReason,
                      reportNote,
                    );
                    setReported((r) => ({ ...r, [q.id]: true }));
                    toast("Report submitted. Thanks! 🙏");
                    setShowReport(false);
                    setReportReason("");
                    setReportNote("");
                  } catch {
                    toast("Failed to submit report", "error");
                  }
                  setReportSubmitting(false);
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm"
              >
                {reportSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BOOKMARKS (unchanged) ────────────────────────────────────────────────────
function BookmarksPage({ ctx }) {
  const { dark, bookmarks, setBookmarks, setActiveTest, nav, user, toast } =
    ctx;
  const [filter, setFilter] = useState("All");
  const card = dark
    ? "bg-gray-900 border-gray-800"
    : "bg-white border-gray-200";
  if (!user) return <AuthWall ctx={ctx} msg="Login to view your bookmarks" />;
  const filtered =
    filter === "All"
      ? bookmarks
      : bookmarks.filter((b) => b.question.subject === filter);

  const startBookmarkTest = () => {
    if (bookmarks.length === 0) {
      toast("No bookmarks to practice!", "error");
      return;
    }
    const qs = filtered.map((b) => b.question);
    setActiveTest({
      questions: qs,
      answers: {},
      marked: new Set(),
      config: {},
      startTime: Date.now(),
      timeLimit: qs.length * 90,
    });
    nav("test");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-black">Bookmarks 🔖</h1>
        <button
          onClick={startBookmarkTest}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm"
        >
          Practice Bookmarks
        </button>
      </div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {["All", "Mathematics", "Reasoning", "Computer Awareness"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${filter === s ? (dark ? "bg-blue-600 border-blue-600 text-white" : "bg-blue-600 border-blue-600 text-white") : dark ? "border-gray-700 text-gray-300" : "border-gray-300 text-gray-700"}`}
          >
            {s}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className={`border rounded-2xl p-10 text-center ${card}`}>
          <div className="text-5xl mb-3">🔖</div>
          <div className="font-bold mb-1">No bookmarks yet</div>
          <div
            className={`text-sm ${dark ? "text-gray-500" : "text-gray-400"}`}
          >
            Save questions during solution review to practice them later.
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((b) => (
            <div key={b.questionId} className={`border rounded-xl p-4 ${card}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex gap-2 mb-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${subjectText(b.question.subject)} ${dark ? "bg-gray-800" : "bg-gray-100"}`}
                    >
                      {b.question.subject}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${dark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"}`}
                    >
                      {b.question.topic}
                    </span>
                  </div>
                  <p
                    className={`text-sm ${dark ? "text-gray-300" : "text-gray-700"}`}
                  >
                    {b.question.questionText.slice(0, 120)}...
                  </p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await api.removeBookmark(user.userId, b.questionId);
                      setBookmarks((bk) =>
                        bk.filter((x) => x.questionId !== b.questionId),
                      );
                    } catch {
                      toast("Failed to remove bookmark", "error");
                    }
                  }}
                  className="text-red-400 hover:text-red-300 text-sm flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ANALYTICS (unchanged) ────────────────────────────────────────────────────
function AnalyticsPage({ ctx }) {
  const { dark, testHistory, user, loadingHistory } = ctx;
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_PER_PAGE = 5;
  const historyStart = (historyPage - 1) * HISTORY_PER_PAGE;
  const paginatedHistory = testHistory
    .slice()
    .reverse()
    .slice(historyStart, historyStart + HISTORY_PER_PAGE);
  const totalHistoryPages = Math.ceil(testHistory.length / HISTORY_PER_PAGE);
  const card = dark
    ? "bg-gray-900 border-gray-800"
    : "bg-white border-gray-200";
  if (!user) return <AuthWall ctx={ctx} msg="Login to view your analytics" />;

  if (loadingHistory) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const subjectAcc = SUBJECTS.map((s) => {
    const relevant = testHistory.flatMap((t) =>
      t.questions.filter((q) => q.subject === s).map((q) => ({ q, t })),
    );
    if (!relevant.length) return { s, acc: 0, count: 0 };
    const correct = relevant.filter(
      ({ q, t }) => t.answers[q.id] === q.correctAnswer,
    ).length;
    return {
      s,
      acc: Math.round((correct / relevant.length) * 100),
      count: relevant.length,
    };
  });

  const topicMap = {};
  testHistory.forEach((t) => {
    t.questions.forEach((q) => {
      if (!topicMap[q.topic]) topicMap[q.topic] = { correct: 0, total: 0 };
      topicMap[q.topic].total++;
      if (t.answers[q.id] === q.correctAnswer) topicMap[q.topic].correct++;
    });
  });

  const topicList = Object.entries(topicMap)
    .map(([topic, { correct, total }]) => ({
      topic,
      acc: Math.round((correct / total) * 100),
      total,
    }))
    .sort((a, b) => a.acc - b.acc);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black mb-6">Analytics 📊</h1>

      {testHistory.length === 0 ? (
        <div className={`border rounded-2xl p-10 text-center ${card}`}>
          <div className="text-5xl mb-3">📊</div>
          <div className="font-bold mb-1">No data yet</div>
          <div
            className={`text-sm ${dark ? "text-gray-500" : "text-gray-400"}`}
          >
            Take a few tests to see your analytics here.
          </div>
        </div>
      ) : (
        <>
          {/* Overall Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Tests", val: testHistory.length },
              {
                label: "Questions Done",
                val: testHistory.reduce((a, t) => a + t.questions.length, 0),
              },
              {
                label: "Best Score",
                val: Math.max(...testHistory.map((t) => t.score)),
              },
              {
                label: "Avg Accuracy",
                val:
                  Math.round(
                    (testHistory.reduce(
                      (a, t) => a + t.correct / t.questions.length,
                      0,
                    ) /
                      testHistory.length) *
                      100,
                  ) + "%",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`border rounded-xl p-4 text-center ${card}`}
              >
                <div className="text-2xl font-black text-blue-400">{s.val}</div>
                <div
                  className={`text-xs mt-0.5 ${dark ? "text-gray-500" : "text-gray-500"}`}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Subject Accuracy */}
          <div className={`border rounded-2xl p-5 mb-6 ${card}`}>
            <h3 className="font-bold mb-4">Subject-wise Accuracy</h3>
            {subjectAcc.map(({ s, acc, count }) => (
              <div key={s} className="mb-4">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className={`font-medium ${subjectText(s)}`}>{s}</span>
                  <span className={dark ? "text-gray-400" : "text-gray-600"}>
                    {acc}% ({count} Qs)
                  </span>
                </div>
                <div
                  className={`h-3 rounded-full ${dark ? "bg-gray-800" : "bg-gray-200"}`}
                >
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${subjectColor(s) === "blue" ? "bg-blue-500" : subjectColor(s) === "green" ? "bg-green-500" : "bg-purple-500"}`}
                    style={{ width: `${acc}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Topic Performance */}
          <div className={`border rounded-2xl p-5 mb-6 ${card}`}>
            <h3 className="font-bold mb-4">Topic-wise Performance</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {topicList.map(({ topic, acc, total }) => (
                <div
                  key={topic}
                  className={`border rounded-xl p-3 flex items-center justify-between ${dark ? "border-gray-800" : "border-gray-200"}`}
                >
                  <div>
                    <div className="text-sm font-medium">{topic}</div>
                    <div
                      className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}
                    >
                      {total} questions
                    </div>
                  </div>
                  <div
                    className={`text-sm font-bold ${acc >= 70 ? "text-green-400" : acc >= 40 ? "text-yellow-400" : "text-red-400"}`}
                  >
                    {acc}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test History */}
          <div className={`border rounded-2xl p-5 ${card}`}>
            <h3 className="font-bold mb-4">Test History</h3>
            {paginatedHistory.length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-500">
                No tests taken yet.
              </div>
            ) : (
              <>
                {paginatedHistory.map((t, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between py-3 border-b last:border-0 ${dark ? "border-gray-800" : "border-gray-200"}`}
                  >
                    <div>
                      <div className="text-sm font-medium">
                        Test {testHistory.length - (historyStart + i)} –{" "}
                        {new Date(t.createdAt).toLocaleDateString()}
                      </div>
                      <div
                        className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}
                      >
                        {t.correct}✅ {t.incorrect}❌ {t.skipped}⚪ · Score:{" "}
                        {t.score}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          ctx.setCurrentResult(t);
                          ctx.nav("results");
                        }}
                        className="text-blue-400 text-xs hover:underline"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                ))}
                {totalHistoryPages > 1 && (
                  <div className="flex justify-between items-center mt-4 pt-2">
                    <button
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      disabled={historyPage === 1}
                      className="px-3 py-1 rounded-lg text-sm disabled:opacity-40 bg-gray-200 dark:bg-gray-700"
                    >
                      ← Prev
                    </button>
                    <span className="text-sm">
                      Page {historyPage} of {totalHistoryPages}
                    </span>
                    <button
                      onClick={() =>
                        setHistoryPage((p) =>
                          Math.min(totalHistoryPages, p + 1),
                        )
                      }
                      disabled={historyPage === totalHistoryPages}
                      className="px-3 py-1 rounded-lg text-sm disabled:opacity-40 bg-gray-200 dark:bg-gray-700"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── SPEED REVISION (already has login check) ─────────────────────────────────
function SpeedRevisionPage({ ctx }) {
  const { dark, questions, user } = ctx;
  const card = dark
    ? "bg-gray-900 border-gray-800"
    : "bg-white border-gray-200";
  const speedQs = questions.filter((q) => q.expectedSolveTime <= 30);
  const [current, setCurrent] = useState(0);
  const [answered, setAnswered] = useState({});
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  if (!user) {
    return <AuthWall ctx={ctx} msg="Login to access Speed Revision" />;
  }

  if (!started)
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">⚡</div>
        <h1 className="text-3xl font-black mb-3">Speed Revision</h1>
        <p
          className={`text-base mb-2 ${dark ? "text-gray-400" : "text-gray-600"}`}
        >
          Quick one-liner questions only. No timer. Go at your own pace. Perfect
          for last-minute revision before NIMCET.
        </p>
        <p
          className={`text-sm mb-8 ${dark ? "text-gray-500" : "text-gray-500"}`}
        >
          {speedQs.length} quick questions available
        </p>
        {speedQs.length === 0 ? (
          <div
            className={`text-sm ${dark ? "text-gray-500" : "text-gray-400"}`}
          >
            No quick questions available yet.
          </div>
        ) : (
          <button
            onClick={() => setStarted(true)}
            className="px-8 py-4 bg-yellow-500 hover:bg-yellow-600 text-black font-black rounded-2xl text-lg transition-all hover:scale-105 shadow-lg shadow-yellow-500/30"
          >
            ⚡ Start Speed Revision
          </button>
        )}
      </div>
    );

  if (done) {
    const correct = speedQs
      .slice(0, current + 1)
      .filter((q) => answered[q.id] === q.correctAnswer).length;
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-3">🎉</div>
        <h2 className="text-2xl font-black mb-2">Revision Complete!</h2>
        <p className={`mb-6 ${dark ? "text-gray-400" : "text-gray-600"}`}>
          {correct}/{current + 1} correct ·{" "}
          {Math.round((correct / (current + 1)) * 100)}% accuracy
        </p>
        <button
          onClick={() => {
            setCurrent(0);
            setAnswered({});
            setStarted(false);
            setDone(false);
          }}
          className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl"
        >
          Restart
        </button>
      </div>
    );
  }

  const q = speedQs[current];
  const a = answered[q.id];
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-black text-xl">⚡ Speed Revision</h1>
        <span
          className={`text-sm font-medium ${dark ? "text-gray-400" : "text-gray-500"}`}
        >
          {current + 1}/{speedQs.length}
        </span>
      </div>
      <div
        className={`h-1.5 rounded-full mb-6 ${dark ? "bg-gray-800" : "bg-gray-200"}`}
      >
        <div
          className="h-1.5 rounded-full bg-yellow-500 transition-all"
          style={{ width: `${((current + 1) / speedQs.length) * 100}%` }}
        />
      </div>
      <div className={`border rounded-2xl p-6 mb-4 ${card}`}>
        <div className="flex gap-2 mb-4">
          <span
            className={`text-xs px-2 py-1 rounded-full ${subjectText(q.subject)} ${dark ? "bg-gray-800" : "bg-gray-100"}`}
          >
            {q.subject}
          </span>
          <span
            className={`text-xs px-2 py-1 rounded-full ${dark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"}`}
          >
            {q.topic}
          </span>
        </div>
        <p className="font-medium mb-5 leading-relaxed">{q.questionText}</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["A", q.optionA],
            ["B", q.optionB],
            ["C", q.optionC],
            ["D", q.optionD],
          ].map(([opt, text]) => {
            let cls = dark
              ? "border-gray-700 hover:border-gray-600"
              : "border-gray-300 hover:border-gray-400";
            if (a) {
              if (opt === q.correctAnswer)
                cls = dark
                  ? "bg-green-900/40 border-green-600 text-green-300"
                  : "bg-green-50 border-green-500 text-green-800";
              else if (opt === a)
                cls = dark
                  ? "bg-red-900/40 border-red-600 text-red-300"
                  : "bg-red-50 border-red-500 text-red-800";
            }
            return (
              <button
                key={opt}
                onClick={() =>
                  !a && setAnswered((x) => ({ ...x, [q.id]: opt }))
                }
                className={`border rounded-xl p-3 text-sm text-left transition-all ${cls}`}
              >
                <span className="font-bold">{opt}.</span> {text}
              </button>
            );
          })}
        </div>
        {a && (
          <div
            className={`mt-4 p-3 rounded-xl text-sm ${dark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700"}`}
          >
            💡 {q.manualSolution}
          </div>
        )}
      </div>
      {a && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              if (current < speedQs.length - 1) setCurrent((c) => c + 1);
              else setDone(true);
            }}
            className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl"
          >
            {current < speedQs.length - 1 ? "Next →" : "Finish ✓"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── FULL YEAR PAPER (added login check) ─────────────────────────────────────
function FullPaperPage({ ctx }) {
  const { dark, questions, setActiveTest, nav, user, toast } = ctx;
  const [year, setYear] = useState("");
  const inp = dark
    ? "bg-gray-800 border-gray-700 text-gray-100"
    : "bg-gray-50 border-gray-300 text-gray-900";
  const card = dark
    ? "bg-gray-900 border-gray-800"
    : "bg-white border-gray-200";
  const availYears = [...new Set(questions.map((q) => q.year))].sort(
    (a, b) => b - a,
  );

  if (!user) {
    return <AuthWall ctx={ctx} msg="Login to access Full Year Paper" />;
  }

  const start = () => {
    if (!year) {
      toast("Select a year", "error");
      return;
    }
    const qs = questions.filter((q) => q.year === parseInt(year));
    if (!qs.length) {
      toast("No questions found for this year", "error");
      return;
    }
    setActiveTest({
      questions: qs,
      answers: {},
      marked: new Set(),
      config: { year },
      startTime: Date.now(),
      timeLimit: 7200,
    });
    nav("test");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <div className="text-6xl mb-4">📄</div>
      <h1 className="text-3xl font-black mb-2">Full Year Paper</h1>
      <p className={`mb-8 ${dark ? "text-gray-400" : "text-gray-600"}`}>
        Attempt a complete year's NIMCET paper with 120-minute timer and full
        NIMCET marking (+3/−1/0)
      </p>
      <div className={`border rounded-2xl p-6 ${card} text-left`}>
        <label className="text-sm font-semibold mb-2 block">Select Year</label>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className={`w-full border rounded-xl px-3 py-3 text-sm mb-4 outline-none ${inp}`}
        >
          <option value="">-- Choose Year --</option>
          {availYears.map((y) => (
            <option key={y} value={y}>
              {y} Paper ({questions.filter((q) => q.year === y).length}{" "}
              questions)
            </option>
          ))}
        </select>
        {year && (
          <div className={`grid grid-cols-3 gap-3 mb-5 text-center`}>
            {SUBJECTS.map((s) => {
              const c = questions.filter(
                (q) => q.year === parseInt(year) && q.subject === s,
              ).length;
              return (
                <div
                  key={s}
                  className={`border rounded-xl p-3 ${dark ? "border-gray-800" : "border-gray-200"}`}
                >
                  <div className={`font-bold ${subjectText(s)}`}>{c}</div>
                  <div
                    className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}
                  >
                    {s.split(" ")[0]}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <button
          onClick={start}
          className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl text-lg transition-all hover:scale-[1.02]"
        >
          🚀 Start {year || "Full"} Paper
        </button>
      </div>
    </div>
  );
}

// ─── TOPIC MASTER (added login check and removed unused state) ───────────────
function TopicMasterPage({ ctx }) {
  const { dark, questions, setActiveTest, nav, user } = ctx;
  const [subject, setSubject] = useState("All");
  const card = dark
    ? "bg-gray-900 border-gray-800"
    : "bg-white border-gray-200";

  if (!user) {
    return <AuthWall ctx={ctx} msg="Login to access Topic Master" />;
  }

  const filteredQs = questions.filter(
    (q) => subject === "All" || q.subject === subject,
  );
  const topicGroups = {};
  filteredQs.forEach((q) => {
    if (!topicGroups[q.topic])
      topicGroups[q.topic] = { count: 0, years: new Set(), subject: q.subject };
    topicGroups[q.topic].count++;
    topicGroups[q.topic].years.add(q.year);
  });

  const start = (t) => {
    const qs = questions.filter((q) => q.topic === t);
    setActiveTest({
      questions: qs,
      answers: {},
      marked: new Set(),
      config: { topic: t },
      startTime: Date.now(),
      timeLimit: qs.length * 90,
    });
    nav("test");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black mb-2">Topic Master 🎯</h1>
      <p className={`mb-6 ${dark ? "text-gray-400" : "text-gray-600"}`}>
        Master one topic at a time. See all PYQs on any topic from 2008–2025.
      </p>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["All", ...SUBJECTS].map((s) => (
          <button
            key={s}
            onClick={() => setSubject(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${subject === s ? (dark ? "bg-blue-600 border-blue-600 text-white" : "bg-blue-600 border-blue-600 text-white") : dark ? "border-gray-700 text-gray-300" : "border-gray-300 text-gray-700"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {Object.entries(topicGroups)
          .sort((a, b) => b[1].count - a[1].count)
          .map(([t, { count, years, subject: s }]) => (
            <div
              key={t}
              className={`border rounded-2xl p-4 flex items-center justify-between ${card}`}
            >
              <div>
                <div className="font-bold text-sm">{t}</div>
                <div
                  className={`text-xs mt-0.5 ${dark ? "text-gray-500" : "text-gray-400"}`}
                >
                  <span className={subjectText(s)}>{s.split(" ")[0]}</span> ·{" "}
                  {count} questions · Years: {[...years].sort().join(", ")}
                </div>
              </div>
              <button
                onClick={() => start(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold flex-shrink-0 ml-3 ${dark ? "bg-pink-600/20 text-pink-400 hover:bg-pink-600/30 border border-pink-800" : "bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200"}`}
              >
                Practice →
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}

// ─── AUTH WALL (unchanged) ────────────────────────────────────────────────────
function AuthWall({ ctx, msg }) {
  const { nav, dark } = ctx;
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="text-5xl mb-4">🔒</div>
      <h2 className="text-xl font-bold mb-2">Login Required</h2>
      <p className={`mb-6 ${dark ? "text-gray-400" : "text-gray-500"}`}>
        {msg}
      </p>
      <button
        onClick={() => nav("login")}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
      >
        Login / Register
      </button>
    </div>
  );
}

// ─── ADMIN LOGIN (unchanged) ──────────────────────────────────────────────────
function AdminLoginPage({ ctx }) {
  const { nav, dark, setAdmin, toast } = ctx;
  const [form, setForm] = useState({ username: "", password: "" });
  const card = dark
    ? "bg-gray-900 border-gray-800"
    : "bg-white border-gray-200";
  const inp = dark
    ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
    : "bg-gray-50 border-gray-300 text-gray-900";
  const submit = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    try {
      const res = await api.adminLogin(form.username, form.password);
      if (res.token) {
        localStorage.setItem("adminToken", res.token);
        setAdmin({ username: form.username, role: "ADMIN" });
        toast("Admin login successful 🛡️");
        nav("admin-dashboard");
      } else {
        toast("Invalid credentials", "error");
      }
    } catch {
      toast("Server error", "error");
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className={`w-full max-w-md border rounded-2xl p-8 ${card}`}>
        <h2 className="text-2xl font-black mb-2 text-center">🛡️ Admin Login</h2>
        <div className="flex flex-col gap-4">
          {[
            ["username", "Admin Username", "text"],
            ["password", "Password", "password"],
          ].map(([k, l, t]) => (
            <div key={k}>
              <label
                className={`text-sm font-medium mb-1.5 block ${dark ? "text-gray-300" : "text-gray-700"}`}
              >
                {l}
              </label>
              <input
                type={t}
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 ${inp}`}
                placeholder={l}
                value={form[k]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [k]: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>
          ))}
          <button
            onClick={submit}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
          >
            Login as Admin
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN DASHBOARD (unchanged) ──────────────────────────────────────────────
function AdminDashboard({ ctx }) {
  const { dark, nav, admin, questions } = ctx;
  if (!admin) return <AuthWall ctx={ctx} msg="Admin access required" />;
  const card = dark
    ? "bg-gray-900 border-gray-800"
    : "bg-white border-gray-200";
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black mb-6">Admin Dashboard 🛡️</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Questions", val: questions.length, icon: "❓" },
          {
            label: "Mathematics",
            val: questions.filter((q) => q.subject === "Mathematics").length,
            icon: "📐",
          },
          {
            label: "Reasoning",
            val: questions.filter((q) => q.subject === "Reasoning").length,
            icon: "🧠",
          },
          {
            label: "Computer",
            val: questions.filter((q) => q.subject === "Computer Awareness")
              .length,
            icon: "💻",
          },
        ].map((s) => (
          <div key={s.label} className={`border rounded-xl p-4 ${card}`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-black text-blue-400">{s.val}</div>
            <div
              className={`text-xs ${dark ? "text-gray-500" : "text-gray-500"}`}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {[
          {
            page: "admin-add",
            icon: "➕",
            title: "Add New Question",
            desc: "Add a single PYQ with full details",
          },
          {
            page: "admin-manage",
            icon: "⚙️",
            title: "Manage Questions",
            desc: "Edit, delete, search, filter questions",
          },
          {
            page: "admin-bulk",
            icon: "📦",
            title: "Bulk Import",
            desc: "Import multiple questions via JSON",
          },
        ].map((m) => (
          <button
            key={m.page}
            onClick={() => nav(m.page)}
            className={`border rounded-2xl p-5 text-left transition-all hover:scale-[1.02] hover:shadow-lg ${card}`}
          >
            <div className="text-2xl mb-2">{m.icon}</div>
            <div className="font-bold mb-1">{m.title}</div>
            <div
              className={`text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}
            >
              {m.desc}
            </div>
          </button>
        ))}
        <div className={`border rounded-2xl p-5 ${card}`}>
          <div className="text-2xl mb-2">📊</div>
          <div className="font-bold mb-1">Coverage by Year</div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-1 mt-2">
            {YEARS.map((y) => {
              const c = questions.filter((q) => q.year === y).length;
              return (
                <div
                  key={y}
                  className={`text-xs px-2 py-0.5 rounded-md text-center ${c > 0 ? (dark ? "bg-green-900/40 text-green-400" : "bg-green-100 text-green-700") : dark ? "bg-gray-800 text-gray-600" : "bg-gray-100 text-gray-400"}`}
                >
                  {y}: {c}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN ADD QUESTION (removed unused state) ────────────────────────────────
function AdminAddQuestion({ ctx }) {
  const { dark, admin, toast } = ctx;
  const blank = {
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "A",
    manualSolution: "",
    subject: "Mathematics",
    topic: "",
    year: 2024,
    difficulty: "Medium",
    expectedSolveTime: 30,
  };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  if (!admin) return <AuthWall ctx={ctx} msg="Admin access required" />;
  const card = dark
    ? "bg-gray-900 border-gray-800"
    : "bg-white border-gray-200";
  const inp = dark
    ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
    : "bg-gray-50 border-gray-300 text-gray-900";
  const sel = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (
      !form.questionText ||
      !form.optionA ||
      !form.optionB ||
      !form.optionC ||
      !form.optionD ||
      !form.topic
    ) {
      toast("Fill all required fields", "error");
      return;
    }
    setSaving(true);
    try {
      const saved = await api.adminAddQuestion(form);
      ctx.setQuestions((prev) => [...prev, saved]);
      toast("Question saved successfully! ✓");
      setForm(blank);
    } catch (e) {
      toast("Save failed: " + (e.message || "Check console"), "error");
      console.error(e);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black mb-6">Add Question ➕</h1>
      <div className={`border rounded-2xl p-6 flex flex-col gap-5 ${card}`}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label
              className={`text-sm font-semibold mb-1.5 block ${dark ? "text-gray-300" : "text-gray-600"}`}
            >
              Subject *
            </label>
            <select
              value={form.subject}
              onChange={(e) => sel("subject", e.target.value)}
              className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${inp}`}
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className={`text-sm font-semibold mb-1.5 block ${dark ? "text-gray-300" : "text-gray-600"}`}
            >
              Topic *
            </label>
            <input
              className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${inp}`}
              placeholder="e.g. Probability"
              value={form.topic}
              onChange={(e) => sel("topic", e.target.value)}
            />
          </div>
          <div>
            <label
              className={`text-sm font-semibold mb-1.5 block ${dark ? "text-gray-300" : "text-gray-600"}`}
            >
              Year *
            </label>
            <select
              value={form.year}
              onChange={(e) => sel("year", parseInt(e.target.value))}
              className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${inp}`}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className={`text-sm font-semibold mb-1.5 block ${dark ? "text-gray-300" : "text-gray-600"}`}
            >
              Difficulty
            </label>
            <select
              value={form.difficulty}
              onChange={(e) => sel("difficulty", e.target.value)}
              className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${inp}`}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className={`text-sm font-semibold mb-1.5 block ${dark ? "text-gray-300" : "text-gray-600"}`}
            >
              Solve Time
            </label>
            <select
              value={form.expectedSolveTime}
              onChange={(e) =>
                sel("expectedSolveTime", parseInt(e.target.value))
              }
              className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${inp}`}
            >
              {SOLVE_TIMES.map((v) => (
                <option key={v} value={v}>
                  {v}s –{" "}
                  {v <= 10
                    ? "Direct"
                    : v <= 30
                      ? "2-3 steps"
                      : v <= 60
                        ? "Medium"
                        : "Lengthy"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className={`text-sm font-semibold mb-1.5 block ${dark ? "text-gray-300" : "text-gray-600"}`}
            >
              Correct Answer
            </label>
            <select
              value={form.correctAnswer}
              onChange={(e) => sel("correctAnswer", e.target.value)}
              className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${inp}`}
            >
              {["A", "B", "C", "D"].map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            className={`text-sm font-semibold mb-1.5 block ${dark ? "text-gray-300" : "text-gray-600"}`}
          >
            Question Text *
          </label>
          <textarea
            rows={3}
            className={`w-full border rounded-xl px-3 py-2 text-sm outline-none resize-y ${inp}`}
            placeholder="Enter the full question text..."
            value={form.questionText}
            onChange={(e) => sel("questionText", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {["optionA", "optionB", "optionC", "optionD"].map((k, i) => (
            <div key={k}>
              <label
                className={`text-sm font-semibold mb-1.5 block ${dark ? "text-gray-300" : "text-gray-600"}`}
              >
                Option {["A", "B", "C", "D"][i]} *
              </label>
              <input
                className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${inp} ${form.correctAnswer === ["A", "B", "C", "D"][i] ? "border-green-500" : ""}`}
                placeholder={`Option ${["A", "B", "C", "D"][i]}`}
                value={form[k]}
                onChange={(e) => sel(k, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div>
          <label
            className={`text-sm font-semibold mb-1.5 block ${dark ? "text-gray-300" : "text-gray-600"}`}
          >
            Manual Solution
          </label>
          <textarea
            rows={3}
            className={`w-full border rounded-xl px-3 py-2 text-sm outline-none resize-y ${inp}`}
            placeholder="Step by step solution..."
            value={form.manualSolution}
            onChange={(e) => sel("manualSolution", e.target.value)}
          />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl transition-all hover:scale-[1.02] text-base"
        >
          {saving ? "Saving..." : "✓ Save Question"}
        </button>
      </div>
    </div>
  );
}

// ─── ADMIN MANAGE QUESTIONS (enhanced edit modal + delete confirmation) ──────
function AdminManageQuestions({ ctx }) {
  const { dark, admin, questions, toast } = ctx;
  const [search, setSearch] = useState("");
  const [filterSub, setFilterSub] = useState("All");
  const [page, setPage] = useState(1);
  const [editQ, setEditQ] = useState(null);
  const PER_PAGE = 10;
  if (!admin) return <AuthWall ctx={ctx} msg="Admin access required" />;
  const card = dark
    ? "bg-gray-900 border-gray-800"
    : "bg-white border-gray-200";
  const inp = dark
    ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
    : "bg-gray-50 border-gray-300 text-gray-900";

  let filtered = questions;
  if (filterSub !== "All")
    filtered = filtered.filter((q) => q.subject === filterSub);
  if (search)
    filtered = filtered.filter(
      (q) =>
        q.questionText.toLowerCase().includes(search.toLowerCase()) ||
        q.topic.toLowerCase().includes(search.toLowerCase()),
    );
  const total = filtered.length;
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const pages = Math.ceil(total / PER_PAGE);

  const deleteQ = async (id) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      await api.adminDeleteQuestion(id);
      ctx.setQuestions((prev) => prev.filter((q) => q.id !== id));
      toast("Question deleted");
      setPage(1);
    } catch {
      toast("Delete failed", "error");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black mb-6">Manage Questions ⚙️</h1>
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          className={`border rounded-xl px-3 py-2 text-sm outline-none flex-1 min-w-48 ${inp}`}
          placeholder="Search question text or topic..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          value={filterSub}
          onChange={(e) => {
            setFilterSub(e.target.value);
            setPage(1);
          }}
          className={`border rounded-xl px-3 py-2 text-sm outline-none ${inp}`}
        >
          <option value="All">All Subjects</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className={`border rounded-2xl overflow-hidden ${card}`}>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div
              className={`px-4 py-3 border-b text-sm font-semibold ${dark ? "border-gray-800 text-gray-400" : "border-gray-200 text-gray-600"}`}
            >
              Showing {(page - 1) * PER_PAGE + 1}–
              {Math.min(page * PER_PAGE, total)} of {total} questions
            </div>
            {paged.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-4xl mb-2">🔍</div>
                <div
                  className={`text-sm ${dark ? "text-gray-500" : "text-gray-400"}`}
                >
                  No questions match your search.
                </div>
              </div>
            ) : (
              paged.map((q, i) => (
                <div
                  key={q.id}
                  className={`px-4 py-3 border-b flex items-center gap-3 ${dark ? "border-gray-800 hover:bg-gray-800/50" : "border-gray-200 hover:bg-gray-50"}`}
                >
                  <div className="text-xs text-gray-500 w-8 flex-shrink-0">
                    #{q.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {q.questionText}
                    </div>
                    <div className="flex gap-2 mt-0.5">
                      <span className={`text-xs ${subjectText(q.subject)}`}>
                        {q.subject}
                      </span>
                      <span
                        className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}
                      >
                        {q.topic} · {q.year} · {q.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setEditQ(q)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium ${dark ? "bg-blue-600/20 text-blue-400" : "bg-blue-50 text-blue-700"}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteQ(q.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium ${dark ? "bg-red-600/20 text-red-400" : "bg-red-50 text-red-700"}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
            {pages > 1 && (
              <div
                className={`px-4 py-3 flex items-center justify-between ${dark ? "border-t border-gray-800" : "border-t border-gray-200"}`}
              >
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className={`px-3 py-1 rounded-lg text-sm disabled:opacity-40 ${dark ? "bg-gray-800" : "bg-gray-100"}`}
                >
                  ← Prev
                </button>
                <span
                  className={`text-sm ${dark ? "text-gray-400" : "text-gray-600"}`}
                >
                  Page {page} of {pages}
                </span>
                <button
                  disabled={page === pages}
                  onClick={() => setPage((p) => p + 1)}
                  className={`px-3 py-1 rounded-lg text-sm disabled:opacity-40 ${dark ? "bg-gray-800" : "bg-gray-100"}`}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal - Enhanced */}
      {editQ && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            className={`border rounded-2xl p-6 w-full max-w-lg my-auto ${dark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}
          >
            <h3 className="font-black text-lg mb-4">Edit Question</h3>
            <div className="flex flex-col gap-3">
              <textarea
                rows={2}
                className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${inp}`}
                value={editQ.questionText}
                onChange={(e) =>
                  setEditQ((q) => ({ ...q, questionText: e.target.value }))
                }
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs block mb-1">Subject</label>
                  <select
                    value={editQ.subject}
                    onChange={(e) =>
                      setEditQ((q) => ({ ...q, subject: e.target.value }))
                    }
                    className={`w-full border rounded-lg px-2 py-1 text-sm ${inp}`}
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs block mb-1">Topic</label>
                  <input
                    className={`w-full border rounded-lg px-2 py-1 text-sm ${inp}`}
                    value={editQ.topic}
                    onChange={(e) =>
                      setEditQ((q) => ({ ...q, topic: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs block mb-1">Year</label>
                  <select
                    value={editQ.year}
                    onChange={(e) =>
                      setEditQ((q) => ({
                        ...q,
                        year: parseInt(e.target.value),
                      }))
                    }
                    className={`w-full border rounded-lg px-2 py-1 text-sm ${inp}`}
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs block mb-1">Difficulty</label>
                  <select
                    value={editQ.difficulty}
                    onChange={(e) =>
                      setEditQ((q) => ({ ...q, difficulty: e.target.value }))
                    }
                    className={`w-full border rounded-lg px-2 py-1 text-sm ${inp}`}
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs block mb-1">Solve Time</label>
                  <select
                    value={editQ.expectedSolveTime}
                    onChange={(e) =>
                      setEditQ((q) => ({
                        ...q,
                        expectedSolveTime: parseInt(e.target.value),
                      }))
                    }
                    className={`w-full border rounded-lg px-2 py-1 text-sm ${inp}`}
                  >
                    {SOLVE_TIMES.map((t) => (
                      <option key={t} value={t}>
                        {t}s
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs block mb-1">Correct Answer</label>
                  <select
                    value={editQ.correctAnswer}
                    onChange={(e) =>
                      setEditQ((q) => ({ ...q, correctAnswer: e.target.value }))
                    }
                    className={`w-full border rounded-lg px-2 py-1 text-sm ${inp}`}
                  >
                    {["A", "B", "C", "D"].map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {["optionA", "optionB", "optionC", "optionD"].map((k, i) => (
                <input
                  key={k}
                  className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${inp}`}
                  placeholder={`Option ${["A", "B", "C", "D"][i]}`}
                  value={editQ[k]}
                  onChange={(e) =>
                    setEditQ((q) => ({ ...q, [k]: e.target.value }))
                  }
                />
              ))}
              <textarea
                rows={2}
                className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${inp}`}
                placeholder="Solution"
                value={editQ.manualSolution}
                onChange={(e) =>
                  setEditQ((q) => ({ ...q, manualSolution: e.target.value }))
                }
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setEditQ(null)}
                className={`flex-1 py-2.5 border rounded-xl text-sm font-semibold ${dark ? "border-gray-700" : "border-gray-300"}`}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const updated = await api.adminUpdateQuestion(
                      editQ.id,
                      editQ,
                    );
                    ctx.setQuestions((prev) =>
                      prev.map((q) => (q.id === editQ.id ? updated : q)),
                    );
                    toast("Question updated");
                    setEditQ(null);
                  } catch (err) {
                    toast(
                      "Update failed: " + (err.message || "Check console"),
                      "error",
                    );
                    console.error(err);
                  }
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ADMIN BULK IMPORT (unchanged) ───────────────────────────────────────────
function AdminBulkImport({ ctx }) {
  const { dark, admin, toast } = ctx;
  const [json, setJson] = useState("");
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [imported, setImported] = useState(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("pdf_extracted_json");
    if (saved) {
      setJson(saved);
      sessionStorage.removeItem("pdf_extracted_json");
      toast("Questions from PDF loaded! Review and click Import.");
    }
  }, []);
  if (!admin) return <AuthWall ctx={ctx} msg="Admin access required" />;
  const card = dark
    ? "bg-gray-900 border-gray-800"
    : "bg-white border-gray-200";
  const inp = dark
    ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
    : "bg-gray-50 border-gray-300 text-gray-900";

  const validate = () => {
    setError("");
    setPreview(null);
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) {
        setError("Must be a JSON array");
        return;
      }
      setPreview(parsed);
    } catch (e) {
      setError("Invalid JSON: " + e.message);
    }
  };

  const importAll = async () => {
    if (!preview) return;
    setImporting(true);
    try {
      const result = await api.adminBulkImport(preview);
      toast(`${result.imported} questions imported!`);
      const fresh = await api.getQuestions();
      if (Array.isArray(fresh)) ctx.setQuestions(fresh);
      setJson("");
      setPreview(null);
      setImported({
        success: result.imported,
        fail: result.total - result.imported,
      });
    } catch {
      toast("Bulk import failed", "error");
    } finally {
      setImporting(false);
    }
  };

  const sampleJson = `[
  {
    "questionText": "What is 2+2?",
    "optionA": "3",
    "optionB": "4",
    "optionC": "5",
    "optionD": "6",
    "correctAnswer": "B",
    "manualSolution": "2+2=4",
    "subject": "Mathematics",
    "topic": "Arithmetic",
    "year": 2023,
    "difficulty": "Easy",
    "expectedSolveTime": 10
  }
]`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black mb-6">Bulk Import 📦</h1>
      {imported && (
        <div
          className={`border rounded-xl p-4 mb-6 ${dark ? "bg-green-900/20 border-green-800" : "bg-green-50 border-green-200"}`}
        >
          <div className="font-bold text-green-400">Import Complete!</div>
          <div className="text-sm">
            {imported.success} imported successfully · {imported.fail} failed
          </div>
        </div>
      )}
      <div className={`border rounded-2xl p-6 mb-4 ${card}`}>
        <label
          className={`text-sm font-semibold mb-2 block ${dark ? "text-gray-300" : "text-gray-600"}`}
        >
          Paste JSON Array
        </label>
        <textarea
          rows={10}
          className={`w-full border rounded-xl px-3 py-3 text-sm font-mono outline-none resize-y mb-3 ${inp}`}
          placeholder="Paste your JSON array of questions here..."
          value={json}
          onChange={(e) => setJson(e.target.value)}
        />
        {error && <div className="text-red-400 text-sm mb-3">⚠ {error}</div>}
        <div className="flex gap-3">
          <button
            onClick={validate}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${dark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
          >
            Validate & Preview
          </button>
          <button
            onClick={importAll}
            disabled={importing}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold disabled:opacity-50"
          >
            {importing
              ? "Importing..."
              : `Import ${preview?.length || 0} Questions`}
          </button>
        </div>
      </div>

      {preview && (
        <div className={`border rounded-2xl p-4 mb-4 ${card}`}>
          <h3 className="font-bold mb-3 text-green-400">
            ✓ Valid JSON – {preview.length} questions found
          </h3>
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
            {preview.slice(0, 5).map((q, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg text-sm ${dark ? "bg-gray-800" : "bg-gray-100"}`}
              >
                <span className="font-medium">{i + 1}.</span>{" "}
                {q.questionText?.slice(0, 80)}...{" "}
                <span className={`text-xs ${subjectText(q.subject)}`}>
                  ({q.subject})
                </span>
              </div>
            ))}
            {preview.length > 5 && (
              <div
                className={`text-sm ${dark ? "text-gray-500" : "text-gray-400"}`}
              >
                ...and {preview.length - 5} more
              </div>
            )}
          </div>
        </div>
      )}

      <div className={`border rounded-2xl p-4 ${card}`}>
        <h3
          className={`text-sm font-bold mb-2 ${dark ? "text-gray-300" : "text-gray-600"}`}
        >
          Sample JSON Format
        </h3>
        <pre
          className={`text-xs font-mono overflow-x-auto rounded-lg p-3 ${dark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"}`}
        >
          {sampleJson}
        </pre>
      </div>
    </div>
  );
}

function AdminReportsPage({ ctx }) {
  const { dark, admin, questions, toast } = ctx;
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open");
  const [editQ, setEditQ] = useState(null);

  useEffect(() => {
    if (!admin) return;
    api
      .getReports()
      .then((data) => {
        if (Array.isArray(data)) setReports(data);
      })
      .catch(() => toast("Failed to load reports", "error"))
      .finally(() => setLoading(false));
  }, [admin]);

  if (!admin) return <AuthWall ctx={ctx} msg="Admin access required" />;

  const card = dark
    ? "bg-gray-900 border-gray-800"
    : "bg-white border-gray-200";
  const inp = dark
    ? "bg-gray-800 border-gray-700 text-gray-100"
    : "bg-gray-50 border-gray-300 text-gray-900";
  const openCount = reports.filter((r) => !r.resolved).length;

  const filtered = reports.filter((r) =>
    filter === "all" ? true : filter === "open" ? !r.resolved : r.resolved,
  );

  const handleResolve = async (reportId, action) => {
    try {
      await api.resolveReport(reportId, action);
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, resolved: true, resolvedAction: action }
            : r,
        ),
      );
      toast(action === "dismiss" ? "Report dismissed" : "Report resolved ✓");
    } catch {
      toast("Action failed", "error");
    }
  };

  const handleDelete = async (questionId, reportId) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm("Delete this question permanently?")) return;
    try {
      await api.adminDeleteQuestion(questionId);
      ctx.setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      await handleResolve(reportId, "deleted");
      toast("Question deleted ✓");
    } catch {
      toast("Delete failed", "error");
    }
  };

  const reasonColor = (reason) => {
    if (reason?.includes("answer"))
      return dark
        ? "bg-red-900/30 text-red-400 border-red-800"
        : "bg-red-50 text-red-700 border-red-200";
    if (reason?.includes("Duplicate"))
      return dark
        ? "bg-purple-900/30 text-purple-400 border-purple-800"
        : "bg-purple-50 text-purple-700 border-purple-200";
    return dark
      ? "bg-yellow-900/30 text-yellow-400 border-yellow-800"
      : "bg-yellow-50 text-yellow-700 border-yellow-200";
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black">Question Reports 🚨</h1>
          <p
            className={`text-sm mt-0.5 ${dark ? "text-gray-400" : "text-gray-500"}`}
          >
            {openCount} open report{openCount !== 1 ? "s" : ""} need review
          </p>
        </div>
        <div className="flex gap-2">
          {[
            ["open", "Open"],
            ["resolved", "Resolved"],
            ["all", "All"],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                filter === val
                  ? dark
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-blue-600 border-blue-600 text-white"
                  : dark
                    ? "border-gray-700 text-gray-300"
                    : "border-gray-300 text-gray-700"
              }`}
            >
              {label}
              {val === "open" && openCount > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                  {openCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`border rounded-2xl p-12 text-center ${card}`}>
          <div className="text-5xl mb-3">✅</div>
          <div className="font-bold mb-1">
            No {filter === "open" ? "open " : ""}reports
          </div>
          <div
            className={`text-sm ${dark ? "text-gray-500" : "text-gray-400"}`}
          >
            {filter === "open" ? "All caught up!" : "Nothing here yet."}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((report) => {
            const q = questions.find((q) => q.id === report.questionId);
            return (
              <div
                key={report.id}
                className={`border rounded-2xl p-5 ${card} ${report.resolved ? "opacity-60" : ""}`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span
                      className={`text-xs px-2 py-1 rounded-full border font-semibold ${reasonColor(report.reason)}`}
                    >
                      {report.reason}
                    </span>
                    {report.resolved && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-semibold ${dark ? "bg-green-900/30 text-green-400" : "bg-green-50 text-green-700"}`}
                      >
                        ✓{" "}
                        {report.resolvedAction === "deleted"
                          ? "Question Deleted"
                          : "Dismissed"}
                      </span>
                    )}
                    <span
                      className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}
                    >
                      Q#{report.questionId}
                    </span>
                  </div>
                  <div
                    className={`text-xs flex-shrink-0 ${dark ? "text-gray-500" : "text-gray-400"}`}
                  >
                    {new Date(report.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Reporter info */}
                <div
                  className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl ${dark ? "bg-gray-800" : "bg-gray-50"}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${dark ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"}`}
                  >
                    {(report.username || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">
                      {report.username || "Anonymous"}
                    </div>
                    <div
                      className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}
                    >
                      User ID: {report.userId || "—"}
                    </div>
                  </div>
                </div>

                {/* Note */}
                {report.note && (
                  <div
                    className={`text-sm p-3 rounded-xl mb-3 italic ${dark ? "bg-blue-900/20 text-blue-300 border border-blue-900" : "bg-blue-50 text-blue-700 border border-blue-200"}`}
                  >
                    "{report.note}"
                  </div>
                )}

                {/* Question preview */}
                {q ? (
                  <div
                    className={`rounded-xl p-3 mb-3 border ${dark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}
                  >
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span
                        className={`text-xs font-semibold ${subjectText(q.subject)}`}
                      >
                        {q.subject}
                      </span>
                      <span
                        className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}
                      >
                        {q.topic} · {q.year}
                      </span>
                      <span
                        className={`text-xs font-bold ml-auto ${dark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        Correct: {q.correctAnswer}
                      </span>
                    </div>
                    <p
                      className={`text-sm leading-relaxed mb-2 ${dark ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {q.questionText.slice(0, 200)}
                      {q.questionText.length > 200 ? "..." : ""}
                    </p>
                    <div
                      className={`grid grid-cols-2 gap-1 text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}
                    >
                      {["A", "B", "C", "D"].map((opt) => (
                        <span
                          key={opt}
                          className={
                            opt === q.correctAnswer
                              ? dark
                                ? "text-green-400 font-bold"
                                : "text-green-600 font-bold"
                              : ""
                          }
                        >
                          {opt}: {q[`option${opt}`]}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    className={`rounded-xl p-3 mb-3 text-sm ${dark ? "bg-red-900/20 text-red-400" : "bg-red-50 text-red-600"}`}
                  >
                    ⚠ Question #{report.questionId} has already been deleted.
                  </div>
                )}

                {/* Action buttons */}
                {!report.resolved && (
                  <div className="flex gap-2 flex-wrap">
                    {q && (
                      <button
                        onClick={() => setEditQ({ ...q })}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border ${dark ? "bg-blue-600/20 text-blue-400 border-blue-800 hover:bg-blue-600/30" : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"}`}
                      >
                        ✏️ Edit Question
                      </button>
                    )}
                    {q && (
                      <button
                        onClick={() =>
                          handleDelete(report.questionId, report.id)
                        }
                        className={`px-4 py-2 rounded-xl text-sm font-bold border ${dark ? "bg-red-600/20 text-red-400 border-red-800 hover:bg-red-600/30" : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"}`}
                      >
                        🗑️ Delete Question
                      </button>
                    )}
                    <button
                      onClick={() => handleResolve(report.id, "dismiss")}
                      className={`px-4 py-2 rounded-xl text-sm font-bold border ${dark ? "border-gray-700 text-gray-400 hover:bg-gray-800" : "border-gray-300 text-gray-600 hover:bg-gray-100"}`}
                    >
                      ✓ Dismiss
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit modal */}
      {editQ && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div
            className={`border rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto ${dark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}
          >
            <h3 className="font-black text-lg mb-4">Edit Question</h3>
            <div className="flex flex-col gap-3">
              <textarea
                rows={2}
                className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${inp}`}
                value={editQ.questionText}
                onChange={(e) =>
                  setEditQ((q) => ({ ...q, questionText: e.target.value }))
                }
              />
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["Subject", "subject", SUBJECTS, "select"],
                  ["Topic", "topic", null, "input"],
                  ["Year", "year", YEARS, "select"],
                  ["Difficulty", "difficulty", DIFFICULTIES, "select"],
                  [
                    "Correct Answer",
                    "correctAnswer",
                    ["A", "B", "C", "D"],
                    "select",
                  ],
                ].map(([label, key, opts, type]) => (
                  <div key={key}>
                    <label className="text-xs block mb-1">{label}</label>
                    {type === "select" ? (
                      <select
                        value={editQ[key]}
                        onChange={(e) =>
                          setEditQ((q) => ({
                            ...q,
                            [key]:
                              key === "year"
                                ? parseInt(e.target.value)
                                : e.target.value,
                          }))
                        }
                        className={`w-full border rounded-lg px-2 py-1 text-sm ${inp}`}
                      >
                        {opts.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className={`w-full border rounded-lg px-2 py-1 text-sm ${inp}`}
                        value={editQ[key]}
                        onChange={(e) =>
                          setEditQ((q) => ({ ...q, [key]: e.target.value }))
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
              {["optionA", "optionB", "optionC", "optionD"].map((k, i) => (
                <input
                  key={k}
                  className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${inp}`}
                  placeholder={`Option ${["A", "B", "C", "D"][i]}`}
                  value={editQ[k]}
                  onChange={(e) =>
                    setEditQ((q) => ({ ...q, [k]: e.target.value }))
                  }
                />
              ))}
              <textarea
                rows={2}
                className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${inp}`}
                placeholder="Solution"
                value={editQ.manualSolution}
                onChange={(e) =>
                  setEditQ((q) => ({ ...q, manualSolution: e.target.value }))
                }
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setEditQ(null)}
                className={`flex-1 py-2.5 border rounded-xl text-sm font-semibold ${dark ? "border-gray-700" : "border-gray-300"}`}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const updated = await api.adminUpdateQuestion(
                      editQ.id,
                      editQ,
                    );
                    ctx.setQuestions((prev) =>
                      prev.map((q) => (q.id === editQ.id ? updated : q)),
                    );
                    toast("Question updated ✓");
                    setEditQ(null);
                  } catch (err) {
                    toast("Update failed", "error");
                  }
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ADMIN PDF EXTRACTOR (unchanged) ──────────────────────────────────────────
function AdminPDFExtractor({ ctx }) {
  const { dark, admin, toast, nav } = ctx;
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("idle");
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const [copied, setCopied] = useState(false);
  const [subject, setSubject] = useState("Mixed");
  const [year, setYear] = useState("2024");

  if (!admin) return <AuthWall ctx={ctx} msg="Admin access required" />;

  const card = dark
    ? "bg-gray-900 border-gray-800"
    : "bg-white border-gray-200";
  const inp = dark
    ? "bg-gray-800 border-gray-700 text-gray-100"
    : "bg-gray-50 border-gray-300 text-gray-900";

  const toBase64 = (f) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(",")[1]);
      r.onerror = () => rej(new Error("File read failed"));
      r.readAsDataURL(f);
    });

  const PROMPT = `You are extracting MCQ questions from a NIMCET exam paper.
The paper may contain Mathematics, Reasoning, or Computer Awareness questions — all mixed together.

Read ALL text carefully including mathematical equations. Write math in plain text:
- Fractions: x/y or (x+1)/(x-1)
- Powers: x^2, e^2, (1+2x)^(1/x)
- Square roots: sqrt(x)
- Integrals: integral of x^2 dx
- Limits: lim(x->0)
- Functions: sin(x), cos(x), log(x)

For figures/diagrams in questions:
- If there is a geometric figure (triangle, circle, graph), describe it in questionText like: [Figure: right triangle with sides 3,4,5]
- If figure is too complex to describe, skip that question entirely

Return ONLY a valid JSON array, no markdown:
[{
  "questionText": "complete question with math in plain text",
  "optionA": "option a",
  "optionB": "option b",
  "optionC": "option c",
  "optionD": "option d",
  "correctAnswer": "A",
  "manualSolution": "brief solution or 'Refer to official answer key'",
  "subject": "Mathematics or Reasoning or Computer Awareness",
  "topic": "specific topic like Calculus, Probability, Coding-Decoding",
  "year": ${year},
  "difficulty": "Easy or Medium or Hard",
  "expectedSolveTime": 60
}]

Rules:
- correctAnswer: A B C or D only — if not shown use "A"
- subject: auto-detect from question content, never use "Mixed"
- Include ALL question numbers visible`;

  const parseQuestions = (text) => {
    const clean = text.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("[");
    const end = clean.lastIndexOf("]");
    if (start === -1) return [];
    try {
      const parsed = JSON.parse(clean.substring(start, end + 1));
      return parsed.map((q, i) => ({
        questionText: q.questionText || `Question ${i + 1}`,
        optionA: q.optionA || "",
        optionB: q.optionB || "",
        optionC: q.optionC || "",
        optionD: q.optionD || "",
        correctAnswer: ["A", "B", "C", "D"].includes(q.correctAnswer)
          ? q.correctAnswer
          : "A",
        manualSolution: q.manualSolution || "Refer to official answer key",
        subject: ["Mathematics", "Reasoning", "Computer Awareness"].includes(
          q.subject,
        )
          ? q.subject
          : "Mathematics",
        topic: q.topic || "General",
        year: parseInt(q.year) || parseInt(year),
        difficulty: ["Easy", "Medium", "Hard"].includes(q.difficulty)
          ? q.difficulty
          : "Medium",
        expectedSolveTime: [10, 30, 60, 90].includes(q.expectedSolveTime)
          ? q.expectedSolveTime
          : 60,
      }));
    } catch {
      return [];
    }
  };

  const extract = async () => {
    if (files.length === 0) return;
    setStatus("loading");
    setError("");
    setQuestions([]);
    let allQuestions = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const pct = Math.round((i / files.length) * 80);
      setProgressPct(pct);
      setProgress(
        `Processing file ${i + 1} of ${files.length}: ${file.name}...`,
      );

      try {
        const base64 = await toBase64(file);
        setProgress(`AI reading ${file.name}... (may take 20-40 seconds)`);
        setProgressPct(pct + 10);

        const data = await api.extractPDF(base64, file.type, PROMPT);
        if (data.error) throw new Error(data.error);

        setProgress(`Parsing questions from ${file.name}...`);
        setProgressPct(pct + 18);
        const qs = parseQuestions(data.text || "[]");
        allQuestions = [...allQuestions, ...qs];
        setProgress(
          `✓ Got ${qs.length} questions from ${file.name}. Total so far: ${allQuestions.length}`,
        );
        await new Promise((r) => setTimeout(r, 600));
      } catch (e) {
        toast(`Error on ${file.name}: ${e.message}`, "error");
        setProgress(`⚠ Error on ${file.name}: ${e.message}. Continuing...`);
        await new Promise((r) => setTimeout(r, 10000));
      }
    }

    setProgressPct(100);
    if (allQuestions.length === 0) {
      setError(
        "No questions extracted. For scanned papers, upload as PNG/JPG screenshots instead of PDF.",
      );
      toast(
        "No questions extracted. Check file format or convert to images.",
        "error",
      );
      setStatus("error");
    } else {
      setQuestions(allQuestions);
      setStatus("done");
      toast(`✅ ${allQuestions.length} questions extracted!`);
    }
    setProgress("");
  };

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(questions, null, 2));
    setCopied(true);
    toast("JSON copied! Now go to Bulk Import and paste it 📋");
    setTimeout(() => setCopied(false), 2000);
  };

  const goToBulkImport = () => {
    sessionStorage.setItem(
      "pdf_extracted_json",
      JSON.stringify(questions, null, 2),
    );
    toast("Opening Bulk Import with extracted questions...");
    nav("admin-bulk");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black mb-2">PDF / Image → Questions 📄</h1>
      <p className={`mb-6 text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>
        Upload PDFs or PNG/JPG screenshots → AI extracts all MCQs → Send to Bulk
        Import
      </p>

      <div className={`border rounded-2xl p-5 mb-4 ${card}`}>
        <h3
          className={`text-sm font-semibold mb-3 ${dark ? "text-gray-300" : "text-gray-600"}`}
        >
          Default Settings
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            [
              "Subject",
              subject,
              setSubject,
              ["Mixed", "Mathematics", "Reasoning", "Computer Awareness"],
            ],
            ["Year", year, setYear, YEARS.map(String)],
          ].map(([label, val, setter, opts]) => (
            <div key={label}>
              <label
                className={`text-xs font-medium mb-1 block ${dark ? "text-gray-400" : "text-gray-500"}`}
              >
                {label}
              </label>
              <select
                value={val}
                onChange={(e) => setter(e.target.value)}
                className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${inp}`}
              >
                {opts.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <p
          className={`text-xs mt-2 ${dark ? "text-gray-500" : "text-gray-400"}`}
        >
          AI auto-detects subject per question. Year is used as default if not
          found in paper.
        </p>
      </div>

      <div
        className={`border rounded-xl p-4 mb-4 ${dark ? "bg-amber-900/20 border-amber-800" : "bg-amber-50 border-amber-200"}`}
      >
        <h3
          className={`text-xs font-bold mb-1.5 ${dark ? "text-amber-400" : "text-amber-700"}`}
        >
          📋 Tips for Best Results
        </h3>
        <ul
          className={`text-xs space-y-1 ${dark ? "text-amber-300" : "text-amber-800"}`}
        >
          <li>
            ✓ <strong>Best:</strong> Upload each page as a PNG/JPG screenshot
          </li>
          <li>
            ✓ <strong>Multiple files:</strong> Upload all pages at once —
            processed in order
          </li>
          <li>
            ✓ <strong>Mixed papers:</strong> AI auto-detects subject per
            question
          </li>
          <li>
            ✅ <strong>Scanned PDFs:</strong> Convert pages to images first (see
            below)
          </li>
        </ul>
      </div>

      <div className={`border rounded-2xl p-5 mb-4 ${card}`}>
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dark ? "border-gray-700 hover:border-blue-600" : "border-gray-300 hover:border-blue-400"}`}
          onClick={() => document.getElementById("file-upload").click()}
          onDrop={(e) => {
            e.preventDefault();
            const dropped = Array.from(e.dataTransfer.files).filter(
              (f) =>
                f.type.startsWith("image/") || f.type === "application/pdf",
            );
            setFiles((prev) => [...prev, ...dropped]);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <input
            id="file-upload"
            type="file"
            accept="application/pdf,image/*"
            multiple
            className="hidden"
            onChange={(e) =>
              setFiles((prev) => [...prev, ...Array.from(e.target.files)])
            }
          />
          <div className="text-4xl mb-2">📁</div>
          <div className="font-semibold mb-1">
            Drop files here or click to browse
          </div>
          <div
            className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}
          >
            PDF files · PNG · JPG · Multiple pages supported
          </div>
        </div>

        {files.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {files.map((f, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-3 py-2 rounded-xl ${dark ? "bg-gray-800" : "bg-gray-100"}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm flex-shrink-0">
                    {f.type.startsWith("image/") ? "🖼️" : "📄"}
                  </span>
                  <span className="text-sm font-medium truncate">{f.name}</span>
                  <span
                    className={`text-xs flex-shrink-0 ${dark ? "text-gray-500" : "text-gray-400"}`}
                  >
                    {f.type.startsWith("image/") ? "Image" : "PDF"} ·{" "}
                    {(f.size / 1024).toFixed(0)}KB
                  </span>
                </div>
                <button
                  onClick={() => setFiles(files.filter((_, j) => j !== i))}
                  className="text-red-400 text-sm hover:text-red-300 flex-shrink-0 ml-2"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={extract}
              disabled={status === "loading"}
              className="w-full mt-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-black text-base transition-all disabled:opacity-60"
            >
              {status === "loading"
                ? "⟳ Extracting..."
                : `🚀 Extract from ${files.length} file${files.length > 1 ? "s" : ""}`}
            </button>
          </div>
        )}

        {status === "loading" && (
          <div className="mt-3">
            <div
              className={`p-3 rounded-xl text-sm mb-2 ${dark ? "bg-blue-900/20 text-blue-300 border border-blue-800" : "bg-blue-50 text-blue-700 border border-blue-200"}`}
            >
              ⟳ {progress || "Processing..."}
            </div>
            <div
              className={`h-2 rounded-full overflow-hidden ${dark ? "bg-gray-800" : "bg-gray-200"}`}
            >
              <div
                className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div
              className={`text-xs mt-1 text-right ${dark ? "text-gray-500" : "text-gray-400"}`}
            >
              {progressPct}%
            </div>
          </div>
        )}
        {error && (
          <div
            className={`mt-3 p-3 rounded-xl text-sm ${dark ? "bg-red-900/20 text-red-300 border border-red-800" : "bg-red-50 text-red-700 border border-red-200"}`}
          >
            ⚠ {error}
          </div>
        )}
      </div>

      {status === "done" && questions.length > 0 && (
        <>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              {
                label: "Extracted",
                val: questions.length,
                color: "text-green-400",
              },
              {
                label: "Maths",
                val: questions.filter((q) => q.subject === "Mathematics")
                  .length,
                color: "text-blue-400",
              },
              {
                label: "Reasoning",
                val: questions.filter((q) => q.subject === "Reasoning").length,
                color: "text-green-400",
              },
              {
                label: "Computer",
                val: questions.filter((q) => q.subject === "Computer Awareness")
                  .length,
                color: "text-purple-400",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`border rounded-xl p-3 text-center ${card}`}
              >
                <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
                <div
                  className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mb-4 flex-wrap">
            <button
              onClick={goToBulkImport}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm"
            >
              📦 Send to Bulk Import →
            </button>
            <button
              onClick={copyJSON}
              className={`flex-1 py-3 rounded-xl font-bold text-sm border ${dark ? "border-gray-700 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"}`}
            >
              {copied ? "✓ Copied!" : "📋 Copy JSON"}
            </button>
            <button
              onClick={() => {
                setStatus("idle");
                setFiles([]);
                setQuestions([]);
                setProgressPct(0);
              }}
              className={`flex-1 py-3 rounded-xl font-bold text-sm border ${dark ? "border-gray-700 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"}`}
            >
              🔄 Extract More
            </button>
          </div>
          <div className={`border rounded-2xl p-5 ${card}`}>
            <h3 className="font-bold text-sm mb-3">
              Preview — {questions.length} questions
            </h3>
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              {questions.map((q, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border ${dark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}
                >
                  <div className="flex gap-2 mb-1 flex-wrap items-center">
                    <span
                      className={`text-xs font-semibold ${subjectText(q.subject)}`}
                    >
                      {q.subject}
                    </span>
                    <span
                      className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}
                    >
                      {q.topic} · {q.year}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ml-auto font-bold ${q.difficulty === "Easy" ? (dark ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700") : q.difficulty === "Hard" ? (dark ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700") : dark ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-700"}`}
                    >
                      {q.difficulty}
                    </span>
                    <span
                      className={`text-xs font-bold ${dark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      ✓{q.correctAnswer}
                    </span>
                  </div>
                  <p
                    className={`text-xs leading-relaxed ${dark ? "text-gray-300" : "text-gray-700"}`}
                  >
                    {q.questionText.slice(0, 120)}
                    {q.questionText.length > 120 ? "..." : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {status === "idle" && (
        <div className={`border rounded-2xl p-5 mt-4 ${card}`}>
          <h3
            className={`text-sm font-semibold mb-3 ${dark ? "text-gray-300" : "text-gray-600"}`}
          >
            🔧 How to convert scanned PDF → images
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: "📱",
                title: "On Phone",
                steps: [
                  "Open PDF",
                  "Screenshot each page",
                  "Upload screenshots here",
                ],
              },
              {
                icon: "🌐",
                title: "Free Online",
                steps: [
                  "Go to ilovepdf.com → PDF to JPG",
                  "Upload your PDF",
                  "Download & upload here",
                ],
              },
            ].map((m) => (
              <div
                key={m.title}
                className={`border rounded-xl p-3 ${dark ? "border-gray-800" : "border-gray-200"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span>{m.icon}</span>
                  <span className="text-sm font-bold">{m.title}</span>
                </div>
                <ol
                  className={`text-xs space-y-0.5 ${dark ? "text-gray-400" : "text-gray-500"}`}
                >
                  {m.steps.map((s, i) => (
                    <li key={i}>
                      {i + 1}. {s}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BugReportModal({ ctx }) {
  const { dark, user, toast, setShowBugReport, page } = ctx;
  const [form, setForm] = useState({ category: "UI Bug", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const inp = dark
    ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
    : "bg-gray-50 border-gray-300 text-gray-900";

  const submit = async () => {
    if (!form.description.trim()) {
      toast("Please describe the bug", "error");
      return;
    }
    setSubmitting(true);
    try {
      await api.submitBugReport(
        user?.userId,
        user?.username || "Anonymous",
        form.description,
        form.category,
        page,
      );
      toast("Bug reported! Thanks for helping us improve 🙏");
      setShowBugReport(false);
      setForm({ category: "UI Bug", description: "" });
    } catch {
      toast("Failed to submit. Try again.", "error");
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={`border rounded-2xl p-6 w-full max-w-md ${dark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
        <h3 className="font-black text-lg mb-1">🐛 Report a Bug</h3>
        <p className={`text-sm mb-4 ${dark ? "text-gray-400" : "text-gray-500"}`}>
          Found something broken? Let us know and we'll fix it.
        </p>
        <div className="flex flex-col gap-3">
          <div>
            <label className={`text-xs font-semibold mb-2 block ${dark ? "text-gray-300" : "text-gray-600"}`}>
              Category *
            </label>
            <div className="flex flex-wrap gap-2">
              {["UI Bug", "Wrong Data", "App Crash", "Feature Not Working", "Other"].map((c) => (
                <button
                  key={c}
                  onClick={() => setForm((f) => ({ ...f, category: c }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    form.category === c
                      ? dark ? "bg-orange-600/20 border-orange-600 text-orange-300" : "bg-orange-50 border-orange-500 text-orange-700"
                      : dark ? "border-gray-700 text-gray-300 hover:border-gray-600" : "border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={`text-xs font-semibold mb-1.5 block ${dark ? "text-gray-300" : "text-gray-600"}`}>
              Description *
            </label>
            <textarea
              rows={4}
              className={`w-full border rounded-xl px-3 py-2 text-sm outline-none resize-none ${inp}`}
              placeholder="Describe the bug in detail... What happened? What did you expect?"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <p className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>
            📍 Page: <span className="font-medium">{page}</span>
            {user && <> · 👤 <span className="font-medium">{user.username}</span></>}
          </p>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => { setShowBugReport(false); setForm({ category: "UI Bug", description: "" }); }}
            className={`flex-1 py-2.5 border rounded-xl text-sm font-semibold ${dark ? "border-gray-700 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"}`}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || !form.description.trim()}
            className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm"
          >
            {submitting ? "Submitting..." : "Submit Bug Report"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminBugReportsPage({ ctx }) {
  const { dark, admin, toast } = ctx;
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open");

  useEffect(() => {
    if (!admin) return;
    api.getBugReports()
      .then((data) => { if (Array.isArray(data)) setReports(data); })
      .catch(() => toast("Failed to load bug reports", "error"))
      .finally(() => setLoading(false));
  }, [admin]);

  if (!admin) return <AuthWall ctx={ctx} msg="Admin access required" />;

  const card = dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200";
  const openCount = reports.filter((r) => !r.resolved).length;
  const filtered = reports.filter((r) =>
    filter === "all" ? true : filter === "open" ? !r.resolved : r.resolved
  );

  const handleResolve = async (id) => {
    try {
      await api.resolveBugReport(id);
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, resolved: true } : r));
      toast("Marked as resolved ✓");
    } catch {
      toast("Action failed", "error");
    }
  };

  const categoryColor = (cat) => {
    if (cat === "App Crash") return dark ? "bg-red-900/30 text-red-400 border-red-800" : "bg-red-50 text-red-700 border-red-200";
    if (cat === "Wrong Data") return dark ? "bg-yellow-900/30 text-yellow-400 border-yellow-800" : "bg-yellow-50 text-yellow-700 border-yellow-200";
    if (cat === "UI Bug") return dark ? "bg-blue-900/30 text-blue-400 border-blue-800" : "bg-blue-50 text-blue-700 border-blue-200";
    return dark ? "bg-gray-800 text-gray-400 border-gray-700" : "bg-gray-100 text-gray-600 border-gray-200";
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black">Bug Reports 🐛</h1>
          <p className={`text-sm mt-0.5 ${dark ? "text-gray-400" : "text-gray-500"}`}>
            {openCount} open bug{openCount !== 1 ? "s" : ""} need attention
          </p>
        </div>
        <div className="flex gap-2">
          {[["open", "Open"], ["resolved", "Resolved"], ["all", "All"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                filter === val
                  ? dark ? "bg-blue-600 border-blue-600 text-white" : "bg-blue-600 border-blue-600 text-white"
                  : dark ? "border-gray-700 text-gray-300" : "border-gray-300 text-gray-700"
              }`}
            >
              {label}
              {val === "open" && openCount > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                  {openCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`border rounded-2xl p-12 text-center ${card}`}>
          <div className="text-5xl mb-3">✅</div>
          <div className="font-bold mb-1">No {filter === "open" ? "open " : ""}bug reports</div>
          <div className={`text-sm ${dark ? "text-gray-500" : "text-gray-400"}`}>
            {filter === "open" ? "All clear!" : "Nothing here yet."}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((report) => (
            <div key={report.id} className={`border rounded-2xl p-5 ${card} ${report.resolved ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${categoryColor(report.category)}`}>
                    {report.category}
                  </span>
                  {report.resolved && (
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${dark ? "bg-green-900/30 text-green-400" : "bg-green-50 text-green-700"}`}>
                      ✓ Resolved
                    </span>
                  )}
                  <span className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>
                    Page: <span className="font-medium">{report.pageUrl || "—"}</span>
                  </span>
                </div>
                <div className={`text-xs flex-shrink-0 ${dark ? "text-gray-500" : "text-gray-400"}`}>
                  {new Date(report.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Reporter */}
              <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl ${dark ? "bg-gray-800" : "bg-gray-50"}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${dark ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"}`}>
                  {(report.username || "?")[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold">{report.username || "Anonymous"}</div>
                  <div className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>
                    User ID: {report.userId || "—"}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className={`text-sm p-3 rounded-xl mb-3 ${dark ? "bg-gray-800 text-gray-300" : "bg-gray-50 text-gray-700"}`}>
                {report.description}
              </div>

              {!report.resolved && (
                <button
                  onClick={() => handleResolve(report.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border ${dark ? "border-green-800 text-green-400 hover:bg-green-900/20" : "border-green-300 text-green-700 hover:bg-green-50"}`}
                >
                  ✓ Mark Resolved
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}