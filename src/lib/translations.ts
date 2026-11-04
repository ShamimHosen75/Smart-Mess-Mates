export type Lang = "en" | "hi" | "bn";

export interface Translations {
  // App
  appName: string;
  appTagline: string;
  signOut: string;
  administrator: string;
  activeMonth: string;
  february2026: string;

  // Sidebar sections
  overview: string;
  dailyEntry: string;
  manage: string;

  // Sidebar items
  dashboard: string;
  monthlyReport: string;
  mealEntry: string;
  expenses: string;
  advances: string;
  members: string;
  settings: string;
  myAccount: string;

  // Dashboard
  totalExpense: string;
  totalMeals: string;
  perMealCost: string;
  totalAdvances: string;
  records: string;
  activeMembersCount: string;
  perMealUnit: string;
  entries: string;
  memberBalances: string;
  expenseByCategory: string;
  quickActions: string;
  recordTodaysMeals: string;
  addExpense: string;
  filterExpenses: string;
  recordAdvance: string;
  meals: string;
  pay: string;
  receive: string;
  guest: string;
  amount: string;

  // Meal Entry
  savedLocally: string;
  selectDate: string;
  allDay: string;
  allDayNight: string;
  clearAll: string;
  breakfast: string;
  day: string;
  night: string;
  custom: string;
  today: string;
  monthlySummary: string;
  member: string;
  totalMealsCol: string;

  // Expenses
  all: string;
  date: string;
  description: string;
  category: string;
  addedBy: string;
  receipt: string;
  total: string;
  addNewExpense: string;
  editExpense: string;
  recordNewExpense: string;
  updateExpenseDetails: string;
  whatWasPurchased: string;
  receiptExpenseSlip: string;
  uploadReceiptImage: string;
  saveExpense: string;
  updateExpense: string;
  deleteExpense: string;
  deleteExpenseConfirm: string;
  cancel: string;
  delete: string;
  view: string;

  // Advances
  trackContributions: string;
  recordAdvancePayment: string;
  editAdvance: string;
  updateAdvanceDetails: string;
  optionalNote: string;
  saveAdvance: string;
  updateAdvanceBtn: string;
  deleteAdvance: string;
  deleteAdvanceConfirm: string;
  note: string;

  // Members
  manageMembers: string;
  activeMembers: string;
  addMember: string;
  addNewMember: string;
  editMember: string;
  updateMemberDetails: string;
  fillMemberDetails: string;
  fullName: string;
  enterMemberName: string;
  role: string;
  admin: string;
  manager: string;
  guestMember: string;
  saveMember: string;
  updateMemberBtn: string;
  deleteMember: string;
  deleteMemberConfirm: string;
  personalPurchases: string;
  advance: string;
  balance: string;
  active: string;
  inactive: string;

  // Monthly Report
  calculation: string;
  individualReport: string;
  printReport: string;
  mustPay: string;
  willReceive: string;
  finalBalance: string;
  advanceContributed: string;

  // Settings
  managePreferences: string;
  globalSettings: string;
  themeSettings: string;
  selectCountry: string;
  currency: string;
  currencyCode: string;
  currencySymbol: string;
  currencyLocale: string;
  currencyAutoFill: string;
  websiteLanguage: string;
  currentActiveSettings: string;
  country: string;
  language: string;
  lastUpdated: string;
  notSavedYet: string;
  saveSettings: string;
  resetToDefault: string;
  saved: string;

  // Theme
  appearance: string;
  light: string;
  dark: string;
  brandColors: string;
  borderRadius: string;
  sharp: string;
  subtle: string;
  default_: string;
  rounded: string;
  pill: string;
  quickAccentPresets: string;
  preview: string;
  sampleCard: string;
  previewThemeSettings: string;
  primaryButton: string;
  secondary: string;
  saveTheme: string;

  // My Account
  accountSettings: string;
  activeMess: string;
  memberSince: string;
  editProfile: string;
  profileUpdated: string;
  email: string;
  phone: string;
  saveChanges: string;

  // Color labels
  accentCta: string;
  secondarySurfaces: string;
  background: string;
  text: string;
  mutedText: string;
  border: string;
  cardSurface: string;
}

const en: Translations = {
  appName: "MessMate",
  appTagline: "Smart Meal System",
  signOut: "Sign Out",
  administrator: "Administrator",
  activeMonth: "Active Month",
  february2026: "February 2026",
  overview: "OVERVIEW",
  dailyEntry: "DAILY ENTRY",
  manage: "MANAGE",
  dashboard: "Dashboard",
  monthlyReport: "Monthly Report",
  mealEntry: "Meal Entry",
  expenses: "Expenses",
  advances: "Advances",
  members: "Members",
  settings: "Settings",
  myAccount: "My Account",
  totalExpense: "Total Expense",
  totalMeals: "Total Meals",
  perMealCost: "Per Meal Cost",
  totalAdvances: "Total Advances",
  records: "records",
  activeMembersCount: "active members",
  perMealUnit: "per meal unit",
  entries: "entries",
  memberBalances: "Member Balances",
  expenseByCategory: "Expense by Category",
  quickActions: "Quick Actions",
  recordTodaysMeals: "Record Today's Meals",
  addExpense: "Add Expense",
  filterExpenses: "Filter Expenses",
  recordAdvance: "Record Advance",
  meals: "meals",
  pay: "Pay",
  receive: "Receive",
  guest: "Guest",
  amount: "Amount",
  savedLocally: "Saved locally",
  selectDate: "Select Date",
  allDay: "All Day",
  allDayNight: "All Day+Night",
  clearAll: "Clear All",
  breakfast: "Breakfast",
  day: "Day",
  night: "Night",
  custom: "Custom",
  today: "Today",
  monthlySummary: "Monthly Summary",
  member: "Member",
  totalMealsCol: "Total Meals",
  all: "All",
  date: "Date",
  description: "Description",
  category: "Category",
  addedBy: "Added By",
  receipt: "Receipt",
  total: "Total",
  addNewExpense: "Add New Expense",
  editExpense: "Edit Expense",
  recordNewExpense: "Record a new expense for this month.",
  updateExpenseDetails: "Update expense details.",
  whatWasPurchased: "What was purchased?",
  receiptExpenseSlip: "Receipt / Expense Slip",
  uploadReceiptImage: "Upload Receipt Image",
  saveExpense: "Save Expense",
  updateExpense: "Update Expense",
  deleteExpense: "Delete Expense",
  deleteExpenseConfirm: "Are you sure you want to delete this expense? This action cannot be undone.",
  cancel: "Cancel",
  delete: "Delete",
  view: "View",
  trackContributions: "Track member contributions",
  recordAdvancePayment: "Record a new advance payment from a member.",
  editAdvance: "Edit Advance",
  updateAdvanceDetails: "Update advance details.",
  optionalNote: "Optional note",
  saveAdvance: "Save Advance",
  updateAdvanceBtn: "Update Advance",
  deleteAdvance: "Delete Advance",
  deleteAdvanceConfirm: "Are you sure you want to delete this advance record? This action cannot be undone.",
  note: "Note",
  manageMembers: "Manage mess members",
  activeMembers: "active members",
  addMember: "Add Member",
  addNewMember: "Add New Member",
  editMember: "Edit Member",
  updateMemberDetails: "Update member details.",
  fillMemberDetails: "Fill in the details to add a new mess member.",
  fullName: "Full Name",
  enterMemberName: "Enter member name",
  role: "Role",
  admin: "Admin",
  manager: "Manager",
  guestMember: "Guest Member",
  saveMember: "Save Member",
  updateMemberBtn: "Update Member",
  deleteMember: "Delete Member",
  deleteMemberConfirm: "Are you sure you want to remove this member? This action cannot be undone.",
  personalPurchases: "Personal Purchases",
  advance: "Advance",
  balance: "Balance",
  active: "Active",
  inactive: "Inactive",
  calculation: "Calculation",
  individualReport: "Individual Report",
  printReport: "Print Report",
  mustPay: "Must Pay",
  willReceive: "Will Receive",
  finalBalance: "Final Balance",
  advanceContributed: "Advance Contributed",
  managePreferences: "Manage your preferences",
  globalSettings: "Global Settings",
  themeSettings: "Theme Settings",
  selectCountry: "Select Country",
  currency: "Currency",
  currencyCode: "Currency Code",
  currencySymbol: "Currency Symbol",
  currencyLocale: "Currency Locale",
  currencyAutoFill: "Currency is auto-filled based on the selected country",
  websiteLanguage: "Website Language",
  currentActiveSettings: "Current Active Settings",
  country: "Country",
  language: "Language",
  lastUpdated: "Last Updated",
  notSavedYet: "Not saved yet",
  saveSettings: "Save Settings",
  resetToDefault: "Reset to Default",
  saved: "✓ Saved!",
  appearance: "Appearance",
  light: "Light",
  dark: "Dark",
  brandColors: "Brand Colors",
  borderRadius: "Border Radius",
  sharp: "Sharp",
  subtle: "Subtle",
  default_: "Default",
  rounded: "Rounded",
  pill: "Pill",
  quickAccentPresets: "Quick Accent Presets",
  preview: "Preview",
  sampleCard: "Sample Card",
  previewThemeSettings: "Preview of your theme settings",
  primaryButton: "Primary Button",
  secondary: "Secondary",
  saveTheme: "Save Theme",
  accountSettings: "Account settings",
  activeMess: "Active Mess",
  memberSince: "Member Since",
  editProfile: "Edit Profile",
  profileUpdated: "Profile updated successfully",
  email: "Email",
  phone: "Phone",
  saveChanges: "Save Changes",
  accentCta: "Accent / CTA",
  secondarySurfaces: "Secondary surfaces",
  background: "Page background",
  text: "Main text color",
  mutedText: "Secondary text",
  border: "Borders, dividers",
  cardSurface: "Cards, modals, popups",
};

const hi: Translations = {
  appName: "মেসমেট",
  appTagline: "स्मार्ट मील सिस्टम",
  signOut: "लॉग आउट",
  administrator: "प्रशासक",
  activeMonth: "सक्रिय महीना",
  february2026: "फ़रवरी 2026",
  overview: "अवलोकन",
  dailyEntry: "दैनिक प्रविष्टि",
  manage: "प्रबंधन",
  dashboard: "डैशबोर्ड",
  monthlyReport: "मासिक रिपोर्ट",
  mealEntry: "भोजन प्रविष्टि",
  expenses: "खर्चे",
  advances: "अग्रिम",
  members: "सदस्य",
  settings: "सेटिंग्स",
  myAccount: "मेरा खाता",
  totalExpense: "कुल खर्च",
  totalMeals: "कुल भोजन",
  perMealCost: "प्रति भोजन लागत",
  totalAdvances: "कुल अग्रिम",
  records: "रिकॉर्ड",
  activeMembersCount: "सक्रिय सदस्य",
  perMealUnit: "प्रति भोजन इकाई",
  entries: "प्रविष्टियाँ",
  memberBalances: "सदस्य शेष",
  expenseByCategory: "श्रेणी के अनुसार खर्च",
  quickActions: "त्वरित कार्य",
  recordTodaysMeals: "आज का भोजन दर्ज करें",
  addExpense: "खर्चा जोड़ें",
  filterExpenses: "खर्चे फ़िल्टर करें",
  recordAdvance: "अग्रिम दर्ज करें",
  meals: "भोजन",
  pay: "भुगतान",
  receive: "प्राप्त",
  guest: "अतिथि",
  amount: "राशि",
  savedLocally: "स्थानीय रूप से सहेजा गया",
  selectDate: "तिथि चुनें",
  allDay: "पूरा दिन",
  allDayNight: "दिन+रात",
  clearAll: "सब मिटाएं",
  breakfast: "नाश्ता",
  day: "दिन",
  night: "रात",
  custom: "कस्टम",
  today: "आज",
  monthlySummary: "मासिक सारांश",
  member: "सदस्य",
  totalMealsCol: "कुल भोजन",
  all: "सभी",
  date: "तिथि",
  description: "विवरण",
  category: "श्रेणी",
  addedBy: "जोड़ने वाला",
  receipt: "रसीद",
  total: "कुल",
  addNewExpense: "नया खर्चा जोड़ें",
  editExpense: "खर्चा संपादित करें",
  recordNewExpense: "इस महीने के लिए नया खर्चा दर्ज करें।",
  updateExpenseDetails: "खर्चे का विवरण अपडेट करें।",
  whatWasPurchased: "क्या खरीदा गया?",
  receiptExpenseSlip: "रसीद / खर्च पर्ची",
  uploadReceiptImage: "रसीद छवि अपलोड करें",
  saveExpense: "खर्चा सहेजें",
  updateExpense: "खर्चा अपडेट करें",
  deleteExpense: "खर्चा हटाएं",
  deleteExpenseConfirm: "क्या आप वाकई इस खर्चे को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।",
  cancel: "रद्द करें",
  delete: "हटाएं",
  view: "देखें",
  trackContributions: "सदस्य योगदान ट्रैक करें",
  recordAdvancePayment: "सदस्य से नया अग्रिम भुगतान दर्ज करें।",
  editAdvance: "अग्रिम संपादित करें",
  updateAdvanceDetails: "अग्रिम विवरण अपडेट करें।",
  optionalNote: "वैकल्पिक नोट",
  saveAdvance: "अग्रिम सहेजें",
  updateAdvanceBtn: "अग्रिम अपडेट करें",
  deleteAdvance: "अग्रिम हटाएं",
  deleteAdvanceConfirm: "क्या आप वाकई इस अग्रिम रिकॉर्ड को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।",
  note: "नोट",
  manageMembers: "मेस सदस्यों को प्रबंधित करें",
  activeMembers: "सक्रिय सदस्य",
  addMember: "सदस्य जोड़ें",
  addNewMember: "नया सदस्य जोड़ें",
  editMember: "सदस्य संपादित करें",
  updateMemberDetails: "सदस्य विवरण अपडेट करें।",
  fillMemberDetails: "नया मेस सदस्य जोड़ने के लिए विवरण भरें।",
  fullName: "पूरा नाम",
  enterMemberName: "सदस्य का नाम दर्ज करें",
  role: "भूमिका",
  admin: "एडमिन",
  manager: "मैनेजर",
  guestMember: "अतिथि सदस्य",
  saveMember: "सदस्य सहेजें",
  updateMemberBtn: "सदस्य अपडेट करें",
  deleteMember: "सदस्य हटाएं",
  deleteMemberConfirm: "क्या आप वाकई इस सदस्य को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।",
  personalPurchases: "व्यक्तिगत खरीद",
  advance: "अग्रिम",
  balance: "शेष",
  active: "सक्रिय",
  inactive: "निष्क्रिय",
  calculation: "गणना",
  individualReport: "व्यक्तिगत रिपोर्ट",
  printReport: "रिपोर्ट प्रिंट करें",
  mustPay: "भुगतान करना होगा",
  willReceive: "प्राप्त करेंगे",
  finalBalance: "अंतिम शेष",
  advanceContributed: "अग्रिम योगदान",
  managePreferences: "अपनी प्राथमिकताएं प्रबंधित करें",
  globalSettings: "वैश्विक सेटिंग्स",
  themeSettings: "थीम सेटिंग्स",
  selectCountry: "देश चुनें",
  currency: "मुद्रा",
  currencyCode: "मुद्रा कोड",
  currencySymbol: "मुद्रा चिह्न",
  currencyLocale: "मुद्रा लोकेल",
  currencyAutoFill: "मुद्रा चयनित देश के आधार पर स्वत: भरी जाती है",
  websiteLanguage: "वेबसाइट भाषा",
  currentActiveSettings: "वर्तमान सक्रिय सेटिंग्स",
  country: "देश",
  language: "भाषा",
  lastUpdated: "अंतिम अपडेट",
  notSavedYet: "अभी तक सहेजा नहीं गया",
  saveSettings: "सेटिंग्स सहेजें",
  resetToDefault: "डिफ़ॉल्ट पर रीसेट करें",
  saved: "✓ सहेजा गया!",
  appearance: "दिखावट",
  light: "लाइट",
  dark: "डार्क",
  brandColors: "ब्रांड रंग",
  borderRadius: "बॉर्डर रेडियस",
  sharp: "तीक्ष्ण",
  subtle: "सूक्ष्म",
  default_: "डिफ़ॉल्ट",
  rounded: "गोल",
  pill: "पिल",
  quickAccentPresets: "त्वरित एक्सेंट प्रीसेट",
  preview: "पूर्वावलोकन",
  sampleCard: "नमूना कार्ड",
  previewThemeSettings: "आपकी थीम सेटिंग्स का पूर्वावलोकन",
  primaryButton: "प्राथमिक बटन",
  secondary: "सेकेंडरी",
  saveTheme: "थीम सहेजें",
  accountSettings: "खाता सेटिंग्स",
  activeMess: "सक्रिय मेस",
  memberSince: "सदस्य तब से",
  editProfile: "प्रोफ़ाइल संपादित करें",
  profileUpdated: "प्रोफ़ाइल सफलतापूर्वक अपडेट हुई",
  email: "ईमेल",
  phone: "फ़ोन",
  saveChanges: "परिवर्तन सहेजें",
  accentCta: "एक्सेंट / CTA",
  secondarySurfaces: "सेकेंडरी सतह",
  background: "पेज बैकग्राउंड",
  text: "मुख्य टेक्स्ट रंग",
  mutedText: "सेकेंडरी टेक्स्ट",
  border: "बॉर्डर, डिवाइडर",
  cardSurface: "कार्ड, मोडल, पॉपअप",
};

const bn: Translations = {
  appName: "মেসমেট",
  appTagline: "স্মার্ট মিল সিস্টেম",
  signOut: "সাইন আউট",
  administrator: "প্রশাসক",
  activeMonth: "সক্রিয় মাস",
  february2026: "ফেব্রুয়ারি ২০২৬",
  overview: "সংক্ষিপ্ত বিবরণ",
  dailyEntry: "দৈনিক এন্ট্রি",
  manage: "পরিচালনা",
  dashboard: "ড্যাশবোর্ড",
  monthlyReport: "মাসিক রিপোর্ট",
  mealEntry: "খাবার এন্ট্রি",
  expenses: "খরচ",
  advances: "অগ্রিম",
  members: "সদস্য",
  settings: "সেটিংস",
  myAccount: "আমার অ্যাকাউন্ট",
  totalExpense: "মোট খরচ",
  totalMeals: "মোট খাবার",
  perMealCost: "প্রতি খাবার খরচ",
  totalAdvances: "মোট অগ্রিম",
  records: "রেকর্ড",
  activeMembersCount: "সক্রিয় সদস্য",
  perMealUnit: "প্রতি খাবার ইউনিট",
  entries: "এন্ট্রি",
  memberBalances: "সদস্য ব্যালেন্স",
  expenseByCategory: "বিভাগ অনুযায়ী খরচ",
  quickActions: "দ্রুত অ্যাকশন",
  recordTodaysMeals: "আজকের খাবার রেকর্ড করুন",
  addExpense: "খরচ যোগ করুন",
  filterExpenses: "খরচ ফিল্টার করুন",
  recordAdvance: "অগ্রিম রেকর্ড করুন",
  meals: "খাবার",
  pay: "দিতে হবে",
  receive: "পাবেন",
  guest: "অতিথি",
  amount: "পরিমাণ",
  savedLocally: "স্থানীয়ভাবে সংরক্ষিত",
  selectDate: "তারিখ নির্বাচন করুন",
  allDay: "সারাদিন",
  allDayNight: "দিন+রাত",
  clearAll: "সব মুছুন",
  breakfast: "সকালের নাস্তা",
  day: "দিন",
  night: "রাত",
  custom: "কাস্টম",
  today: "আজ",
  monthlySummary: "মাসিক সারাংশ",
  member: "সদস্য",
  totalMealsCol: "মোট খাবার",
  all: "সব",
  date: "তারিখ",
  description: "বিবরণ",
  category: "বিভাগ",
  addedBy: "যোগকারী",
  receipt: "রসিদ",
  total: "মোট",
  addNewExpense: "নতুন খরচ যোগ করুন",
  editExpense: "খরচ সম্পাদনা করুন",
  recordNewExpense: "এই মাসের জন্য একটি নতুন খরচ রেকর্ড করুন।",
  updateExpenseDetails: "খরচের বিবরণ আপডেট করুন।",
  whatWasPurchased: "কী কেনা হয়েছে?",
  receiptExpenseSlip: "রসিদ / খরচ স্লিপ",
  uploadReceiptImage: "রসিদ ছবি আপলোড করুন",
  saveExpense: "খরচ সংরক্ষণ করুন",
  updateExpense: "খরচ আপডেট করুন",
  deleteExpense: "খরচ মুছুন",
  deleteExpenseConfirm: "আপনি কি নিশ্চিত যে আপনি এই খরচটি মুছতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।",
  cancel: "বাতিল",
  delete: "মুছুন",
  view: "দেখুন",
  trackContributions: "সদস্যদের অবদান ট্র্যাক করুন",
  recordAdvancePayment: "একজন সদস্যের কাছ থেকে নতুন অগ্রিম পেমেন্ট রেকর্ড করুন।",
  editAdvance: "অগ্রিম সম্পাদনা করুন",
  updateAdvanceDetails: "অগ্রিম বিবরণ আপডেট করুন।",
  optionalNote: "ঐচ্ছিক নোট",
  saveAdvance: "অগ্রিম সংরক্ষণ করুন",
  updateAdvanceBtn: "অগ্রিম আপডেট করুন",
  deleteAdvance: "অগ্রিম মুছুন",
  deleteAdvanceConfirm: "আপনি কি নিশ্চিত যে আপনি এই অগ্রিম রেকর্ডটি মুছতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।",
  note: "নোট",
  manageMembers: "মেস সদস্যদের পরিচালনা করুন",
  activeMembers: "সক্রিয় সদস্য",
  addMember: "সদস্য যোগ করুন",
  addNewMember: "নতুন সদস্য যোগ করুন",
  editMember: "সদস্য সম্পাদনা করুন",
  updateMemberDetails: "সদস্যের বিবরণ আপডেট করুন।",
  fillMemberDetails: "নতুন মেস সদস্য যোগ করতে বিবরণ পূরণ করুন।",
  fullName: "পূর্ণ নাম",
  enterMemberName: "সদস্যের নাম লিখুন",
  role: "ভূমিকা",
  admin: "অ্যাডমিন",
  manager: "ম্যানেজার",
  guestMember: "অতিথি সদস্য",
  saveMember: "সদস্য সংরক্ষণ করুন",
  updateMemberBtn: "সদস্য আপডেট করুন",
  deleteMember: "সদস্য মুছুন",
  deleteMemberConfirm: "আপনি কি নিশ্চিত যে আপনি এই সদস্যকে সরাতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।",
  personalPurchases: "ব্যক্তিগত কেনাকাটা",
  advance: "অগ্রিম",
  balance: "ব্যালেন্স",
  active: "সক্রিয়",
  inactive: "নিষ্ক্রিয়",
  calculation: "হিসাব",
  individualReport: "ব্যক্তিগত রিপোর্ট",
  printReport: "রিপোর্ট প্রিন্ট করুন",
  mustPay: "দিতে হবে",
  willReceive: "পাবেন",
  finalBalance: "চূড়ান্ত ব্যালেন্স",
  advanceContributed: "অগ্রিম অবদান",
  managePreferences: "আপনার পছন্দসমূহ পরিচালনা করুন",
  globalSettings: "গ্লোবাল সেটিংস",
  themeSettings: "থিম সেটিংস",
  selectCountry: "দেশ নির্বাচন করুন",
  currency: "মুদ্রা",
  currencyCode: "মুদ্রা কোড",
  currencySymbol: "মুদ্রা প্রতীক",
  currencyLocale: "মুদ্রা লোকেল",
  currencyAutoFill: "নির্বাচিত দেশের উপর ভিত্তি করে মুদ্রা স্বয়ংক্রিয়ভাবে পূরণ হয়",
  websiteLanguage: "ওয়েবসাইট ভাষা",
  currentActiveSettings: "বর্তমান সক্রিয় সেটিংস",
  country: "দেশ",
  language: "ভাষা",
  lastUpdated: "সর্বশেষ আপডেট",
  notSavedYet: "এখনো সংরক্ষণ করা হয়নি",
  saveSettings: "সেটিংস সংরক্ষণ করুন",
  resetToDefault: "ডিফল্টে রিসেট করুন",
  saved: "✓ সংরক্ষিত!",
  appearance: "অ্যাপিয়ারেন্স",
  light: "লাইট",
  dark: "ডার্ক",
  brandColors: "ব্র্যান্ড রং",
  borderRadius: "বর্ডার রেডিয়াস",
  sharp: "তীক্ষ্ণ",
  subtle: "সূক্ষ্ম",
  default_: "ডিফল্ট",
  rounded: "গোলাকার",
  pill: "পিল",
  quickAccentPresets: "দ্রুত অ্যাকসেন্ট প্রিসেট",
  preview: "প্রিভিউ",
  sampleCard: "নমুনা কার্ড",
  previewThemeSettings: "আপনার থিম সেটিংসের প্রিভিউ",
  primaryButton: "প্রাইমারি বাটন",
  secondary: "সেকেন্ডারি",
  saveTheme: "থিম সংরক্ষণ করুন",
  accountSettings: "অ্যাকাউন্ট সেটিংস",
  activeMess: "সক্রিয় মেস",
  memberSince: "সদস্য হওয়ার তারিখ",
  editProfile: "প্রোফাইল সম্পাদনা",
  profileUpdated: "প্রোফাইল সফলভাবে আপডেট হয়েছে",
  email: "ইমেইল",
  phone: "ফোন",
  saveChanges: "পরিবর্তন সংরক্ষণ",
  accentCta: "অ্যাকসেন্ট / CTA",
  secondarySurfaces: "সেকেন্ডারি সারফেস",
  background: "পেজ ব্যাকগ্রাউন্ড",
  text: "প্রধান টেক্সট রং",
  mutedText: "সেকেন্ডারি টেক্সট",
  border: "বর্ডার, ডিভাইডার",
  cardSurface: "কার্ড, মোডাল, পপআপ",
};

const translations: Record<Lang, Translations> = { en, hi, bn };

export default translations;
