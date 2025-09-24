export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDB183VLIdw9tE7gr5cbs0dCPsyjmXG9r8",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "tempo-tracker-719c9.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "tempo-tracker-719c9",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "tempo-tracker-719c9.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "528680834479",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:528680834479:web:41fe2ca649ce4c286c8b5a"
};

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDaE1ZS2Jd6jtcR2bD6JaDP86LJ0f24kiY";

export const TEAMS = ['T2 Order Support', 'Social Media Team', 'T2 Product Support', 'Member Experience Team', 'Unassigned'];
export const COACH_TYPES = ['Team Leader', 'QA Coach', 'Mentor', 'Managment'];
export const AUDITOR_EMAILS = ['ahmed.elsawy@tempo.fit', 'khaledsabban@tempo.fit'];
export const TRIAD_QUESTIONS = [
    { question: "Was the coach prepared & the conversation structured/organized?", description: "Did the coach prepare all points and structure the conversation in an easy-to-understand way?", weight: 25 },
    { question: "Did the coach correctly open the conversation?", description: "Ice breaker, and friendly/professional attitude.", weight: 5 },
    { question: "Did the coach give the coachee the opportunity to express themselves & their areas of improvement?", description: "Did the coach ask twice 'What went well?'. The coach should demonstrate their active listening skills and the coachee should prove his/her self assessment skills.", weight: 25 },
    { question: "Did the coach empower the agent during the coaching?", description: "Did the coach give them accountability for their performance and ask for a follow-up assignment?", weight: 15 },
    { question: "Did the coach tackle the agents performance from the customer's prospective?", description: "We aim to prioritize the member's experience. Our coaches need to start tailoring their advice to put the customer at the center of everything.", weight: 10 },
    { question: "Did the coach summarize the conversation & offered support?", description: "Did the coach include actions that should be taken, current status and required performance?", weight: 10 },
    { question: "Did the coach take control of the conversation, while keeping it a two way discussion?", description: "Maintaining the session in-control, and the ability/skill to keep it a 2-ways conversation.", weight: 5 },
    { question: "Was the coach's tone of voice firm and friendly?", description: "Keeping a friendly, yet, professional tone of voice throughout the whole session.", weight: 5 },
];
