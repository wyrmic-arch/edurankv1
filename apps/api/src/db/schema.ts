import { sqliteTable, text, integer, primaryKey, index, uniqueIndex, real } from "drizzle-orm/sqlite-core";

// Timestamps are stored as INTEGER unix epoch milliseconds (UTC) so that
// range filtering and sorting are simple and timezone-safe.

export const schools = sqliteTable("schools", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  province: text("province").notNull(),
  city: text("city"),
  lat: real("lat"),
  lng: real("lng"),
});

export const subjects = sqliteTable("subjects", {
  id: text("id").primaryKey(), // slug e.g. "mathematics"
  name: text("name").notNull(),
  blurb: text("blurb").notNull().default(""),
  color: text("color").notNull().default("#A6FF3F"),
  icon: text("icon").notNull().default("BookOpen"),
  unsplashQuery: text("unsplash_query").notNull().default("study"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name").notNull(),
    avatarUrl: text("avatar_url"), // nullable -> web renders generated HUD avatar
    bio: text("bio").notNull().default(""),
    grade: integer("grade"), // 8..12 (CAPS FET/GET)
    gradeYear: integer("grade_year"), // academic year the grade applies to
    gradeSetAt: integer("grade_set_at"), // when the grade was locked
    heldBack: integer("held_back").notNull().default(0), // principal marked: repeat next year
    graduatedAt: integer("graduated_at"), // grade-12 leavers (alumni, read-only)
    schoolId: text("school_id").references(() => schools.id),
    schoolLockedAt: integer("school_locked_at"), // set once the school is chosen
    role: text("role").notNull().default("user"), // 'user' | 'admin'
    emailVerifiedAt: integer("email_verified_at"), // null = unverified
    verifyToken: text("verify_token"), // hashed one-time verify token
    verifyTokenAt: integer("verify_token_at"),
    resetToken: text("reset_token"), // hashed one-time password-reset token
    resetTokenAt: integer("reset_token_at"),
    balance: integer("balance").notNull().default(0),
    totalEarned: integer("total_earned").notNull().default(0),
    totalSpent: integer("total_spent").notNull().default(0),
    streakCount: integer("streak_count").notNull().default(0),
    bestStreak: integer("best_streak").notNull().default(0),
    lastStreakDate: text("last_streak_date"), // 'YYYY-MM-DD' in SAST
    referralCode: text("referral_code").notNull().unique(),
    referredBy: text("referred_by"),
    profileCompletedAt: integer("profile_completed_at"),
    equippedFrameId: text("equipped_frame_id"),
    equippedSkinId: text("equipped_skin_id"),
    notifyEmail: integer("notify_email").notNull().default(1), // daily digest opt-out
    lastDigestAt: integer("last_digest_at"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => ({
    earnedIdx: index("idx_users_total_earned").on(t.totalEarned),
    schoolIdx: index("idx_users_school").on(t.schoolId),
    roleIdx: index("idx_users_role").on(t.role),
    gradeIdx: index("idx_users_grade").on(t.grade),
  }),
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(), // sha256(token) hex — raw token never stored
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    createdAt: integer("created_at").notNull(),
    expiresAt: integer("expires_at").notNull(),
  },
  (t) => ({
    userIdx: index("idx_sessions_user").on(t.userId),
  }),
);

export const notes = sqliteTable(
  "notes",
  {
    id: text("id").primaryKey(),
    uploaderId: text("uploader_id")
      .notNull()
      .references(() => users.id),
    subjectId: text("subject_id")
      .notNull()
      .references(() => subjects.id),
    grade: integer("grade").notNull(),
    topic: text("topic").notNull().default(""),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    fileKey: text("file_key").notNull(), // R2 object key
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size").notNull().default(0),
    mimeType: text("mime_type").notNull().default("application/octet-stream"),
    coverKey: text("cover_key"), // optional R2 key of user-uploaded cover
    schoolId: text("school_id").references(() => schools.id), // uploader's school at upload time
    contentHash: text("content_hash"), // SHA-256 of the file — provenance / duplicate detection
    license: text("license").notNull().default("all-rights-reserved"), // see NOTE_LICENSES
    isOfficial: integer("is_official").notNull().default(0), // EduRank Team content
    slug: text("slug"), // SEO URL slug (official notes)
    body: text("body"), // sanitised HTML body (official notes; powers SEO pages)
    bodyUpdatedAt: integer("body_updated_at"),
    isFree: integer("is_free").notNull().default(1),
    pricePoints: integer("price_points").notNull().default(0),
    status: text("status").notNull().default("pending"), // pending | approved | rejected
    reviewNote: text("review_note"),
    reviewedBy: text("reviewed_by"),
    reviewedAt: integer("reviewed_at"),
    downloadCount: integer("download_count").notNull().default(0),
    upvoteCount: integer("upvote_count").notNull().default(0),
    createdAt: integer("created_at").notNull(),
  },
  (t) => ({
    uploaderIdx: index("idx_notes_uploader").on(t.uploaderId),
    subjectIdx: index("idx_notes_subject").on(t.subjectId),
    statusIdx: index("idx_notes_status").on(t.status),
    createdIdx: index("idx_notes_created").on(t.createdAt),
    gradeIdx: index("idx_notes_grade").on(t.grade),
    schoolIdx: index("idx_notes_school").on(t.schoolId),
    hashIdx: index("idx_notes_content_hash").on(t.contentHash),
  }),
);

// One row per (note,user) — doubles as the "has access" marker for paid AND
// free notes, so a download event maps 1:1 to an uploader reward.
export const noteUnlocks = sqliteTable(
  "note_unlocks",
  {
    noteId: text("note_id")
      .notNull()
      .references(() => notes.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    pricePaid: integer("price_paid").notNull().default(0),
    uploaderCut: integer("uploader_cut").notNull().default(0),
    createdAt: integer("created_at").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.noteId, t.userId] }),
    userIdx: index("idx_unlocks_user").on(t.userId),
  }),
);

export const noteUpvotes = sqliteTable(
  "note_upvotes",
  {
    noteId: text("note_id")
      .notNull()
      .references(() => notes.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    createdAt: integer("created_at").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.noteId, t.userId] }),
    userIdx: index("idx_upvotes_user").on(t.userId),
  }),
);

export const pointsLedger = sqliteTable(
  "points_ledger",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    delta: integer("delta").notNull(), // positive = earn, negative = spend
    reason: text("reason").notNull(),
    noteId: text("note_id"),
    subjectId: text("subject_id"), // enables per-subject leaderboards
    description: text("description").notNull(),
    balanceAfter: integer("balance_after").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => ({
    userCreatedIdx: index("idx_ledger_user_created").on(t.userId, t.createdAt),
    userReasonIdx: index("idx_ledger_user_reason").on(t.userId, t.reason),
    subjectCreatedIdx: index("idx_ledger_subject_created").on(t.subjectId, t.createdAt),
    reasonNoteIdx: index("idx_ledger_reason_note").on(t.reason, t.noteId),
  }),
);

export const badges = sqliteTable("badges", {
  id: text("id").primaryKey(), // slug
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull().default("Award"),
  tier: integer("tier").notNull().default(1), // 1 bronze .. 3 gold
  criteriaType: text("criteria_type").notNull(), // see BADGE_CRITERIA in lib/badges.ts
  threshold: integer("threshold").notNull().default(1),
});

export const userBadges = sqliteTable(
  "user_badges",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    badgeId: text("badge_id")
      .notNull()
      .references(() => badges.id),
    awardedAt: integer("awarded_at").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.badgeId] }),
  }),
);

export const shopItems = sqliteTable("shop_items", {
  id: text("id").primaryKey(), // slug
  kind: text("kind").notNull(), // 'badge' | 'frame' | 'skin'
  name: text("name").notNull(),
  description: text("description").notNull(),
  pricePoints: integer("price_points").notNull().default(0),
  configJson: text("config_json").notNull().default("{}"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const purchases = sqliteTable(
  "purchases",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    itemId: text("item_id")
      .notNull()
      .references(() => shopItems.id),
    pricePaid: integer("price_paid").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => ({
    // UNIQUE(user_id, item_id) prevents the same shop item being purchased twice.
    uniq: uniqueIndex("uq_purchases_user_item").on(t.userId, t.itemId),
  }),
);

export const challengeCompletions = sqliteTable(
  "challenge_completions",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    dateKey: text("date_key").notNull(), // 'YYYY-MM-DD' SAST
    challengeKey: text("challenge_key").notNull(),
    pointsAwarded: integer("points_awarded").notNull().default(0),
    claimedAt: integer("claimed_at").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.dateKey, t.challengeKey] }),
  }),
);

// One row per (user, SAST date) — written before the streak ledger row so a
// worker crash between "award" and "update users.last_streak_date" can't
// double-pay. Also gates the user-update itself: if a claim row exists,
// neither the award nor the streak counter advance on a retry.
export const streakClaims = sqliteTable(
  "streak_claims",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    dateKey: text("date_key").notNull(), // 'YYYY-MM-DD' SAST
    streakCount: integer("streak_count").notNull(),
    reward: integer("reward").notNull().default(0),
    claimedAt: integer("claimed_at").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.dateKey] }),
  }),
);

// --- Staff: principals & teachers ------------------------------------------

// Invite codes. Admin issues principal invites for a school; a principal issues
// teacher invites (optionally scoped to subjects). Redemption is atomic and
// single-use; staff roles are NEVER self-selected.
export const staffInvites = sqliteTable(
  "staff_invites",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id),
    role: text("role").notNull(), // 'principal' | 'teacher'
    subjectIds: text("subject_ids").notNull().default("[]"), // JSON array (teachers)
    createdBy: text("created_by").notNull(),
    createdAt: integer("created_at").notNull(),
    expiresAt: integer("expires_at").notNull(),
    usedBy: text("used_by"),
    usedAt: integer("used_at"),
  },
  (t) => ({
    codeIdx: index("idx_staff_invites_code").on(t.code),
    schoolIdx: index("idx_staff_invites_school").on(t.schoolId),
  }),
);

export const teacherSubjects = sqliteTable(
  "teacher_subjects",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    subjectId: text("subject_id")
      .notNull()
      .references(() => subjects.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.subjectId] }),
  }),
);

export const noteVerifications = sqliteTable(
  "note_verifications",
  {
    noteId: text("note_id")
      .notNull()
      .references(() => notes.id),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => users.id),
    verdict: text("verdict").notNull(), // 'correct' | 'needs_work'
    comment: text("comment").notNull().default(""),
    createdAt: integer("created_at").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.noteId, t.teacherId] }),
  }),
);

// Stolen-note / abuse reports → admin takedown queue.
export const noteReports = sqliteTable(
  "note_reports",
  {
    id: text("id").primaryKey(),
    noteId: text("note_id")
      .notNull()
      .references(() => notes.id),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => users.id),
    reason: text("reason").notNull(),
    details: text("details").notNull().default(""),
    status: text("status").notNull().default("open"), // open | dismissed | removed
    createdAt: integer("created_at").notNull(),
    resolvedBy: text("resolved_by"),
    resolvedAt: integer("resolved_at"),
  },
  (t) => ({
    noteIdx: index("idx_reports_note").on(t.noteId),
    statusIdx: index("idx_reports_status").on(t.status),
  }),
);

// --- Notifications ----------------------------------------------------------

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    link: text("link"),
    dataJson: text("data_json").notNull().default("{}"),
    readAt: integer("read_at"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => ({
    userCreatedIdx: index("idx_notifications_user_created").on(t.userId, t.createdAt),
    userReadIdx: index("idx_notifications_user_read").on(t.userId, t.readAt),
  }),
);
